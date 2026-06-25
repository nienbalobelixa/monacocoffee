import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { posService } from '../../services/pos.service'
import { ordersService } from '../../services/orders.service'
import { productsService } from '../../services/products.service'
import { categoriesService } from '../../services/categories.service'
import { toast } from 'sonner'
import { useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Loader2, RotateCcw, Printer } from 'lucide-react'
import { printKitchenTicket, printReceipt } from '../../utils/print.service'
import { useAuthStore } from '../../store/auth.store'

const formatPrice = (p: number) => (p || 0).toLocaleString('vi-VN') + 'đ'

interface PosItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#16a34a',
  OCCUPIED: '#dc2626',
  RESERVED: '#f59e0b',
  CLEANING: '#9333ea',
}

export default function PosPage() {
  const qc = useQueryClient()
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [cart, setCart] = useState<PosItem[]>([])
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [tableStates, setTableStates] = useState<Record<string, {
    cart: PosItem[]
    orderId: string | null
    orderNumber: string | null
    note: string
  }>>({})
  const [takeawayState, setTakeawayState] = useState<{
    cart: PosItem[]
    orderId: string | null
    orderNumber: string | null
    note: string
  }>({ cart: [], orderId: null, orderNumber: null, note: '' })

  const { data: tablesData, refetch: refetchTables } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: posService.getTablesWithOrders,
    refetchInterval: 20000,
  })

  const [loadOrderId, setLoadOrderId] = useState<string>('')

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  })

  const { data: productsData } = useQuery({
    queryKey: ['pos-products', categoryId],
    queryFn: () => productsService.getAll({
      limit: 100,
      categoryId: categoryId || undefined,
      isAvailable: true,
    }),
  })

  const staffName = useAuthStore((s) => s.user?.fullName)

  const orderMutation = useMutation({
    mutationFn: (data: any) => posService.createOrder(data),
    onSuccess: (res) => {
      const order = res.data || res
      toast.success(`✅ Đã gửi bếp #${order.orderNumber || ''}`)
      setCurrentOrderId(order.id)
      setCurrentOrderNumber(order.orderNumber)

      if (selectedTable?.id) {
        setTableStates((prev) => ({
          ...prev,
          [selectedTable.id]: {
            cart,
            orderId: order.id,
            orderNumber: order.orderNumber,
            note,
          },
        }))
      } else {
        setTakeawayState({
          cart,
          orderId: order.id,
          orderNumber: order.orderNumber,
          note,
        })
      }

      // 🖨️ In phiếu bếp
      printKitchenTicket({
        orderNumber: order.orderNumber || order.id,
        tableName: selectedTable ? `Bàn ${selectedTable.number}` : 'Mang đi',
        type: order.type || (selectedTable ? 'DINE_IN' : 'TAKEAWAY'),
        items: cart.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          subtotal: i.price * i.quantity,
        })),
        note: note || undefined,
        createdAt: new Date(),
        staffName: staffName || undefined,
      })

      refetchTables()
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi tạo đơn hàng'),
  })

  const payMutation = useMutation({
    mutationFn: ({ orderId, method }: { orderId: string; method: string }) =>
      posService.processPayment(orderId, method),
    onSuccess: (_res, vars) => {
      toast.success('💰 Thanh toán thành công!')

      // 🖨️ In hóa đơn thanh toán
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
      printReceipt({
        orderNumber: currentOrderNumber || currentOrderId || '',
        tableName: selectedTable ? `Bàn ${selectedTable.number}` : 'Mang đi',
        items: cart.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          subtotal: i.price * i.quantity,
        })),
        subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod: vars.method,
        note: note || undefined,
        paidAt: new Date(),
        cashierName: staffName || undefined,
      })

      const currentTableId = selectedTable?.id || null
      if (currentTableId) {
        setTableStates((prev) => ({
          ...prev,
          [currentTableId]: { cart: [], orderId: null, orderNumber: null, note: '' },
        }))
      } else {
        setTakeawayState({ cart: [], orderId: null, orderNumber: null, note: '' })
      }
      setCart([])
      setSelectedTable(null)
      setCurrentOrderId(null)
      setCurrentOrderNumber(null)
      setNote('')
      setPaymentModal(false)
      refetchTables()
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: () => toast.error('Lỗi xử lý thanh toán'),
  })

  const tables = tablesData?.data || tablesData || []
  const categories = catsData?.data || []
  const products = productsData?.data || []

  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  const orderToCart = (order: any): PosItem[] => (
    (order?.items || []).map((it: any) => ({
      productId: it.productId,
      name: it.product?.name || '',
      price: Number(it.unitPrice || it.product?.salePrice || it.product?.price || 0),
      quantity: it.quantity,
      image: it.product?.image,
    }))
  )

  const getOpenTableOrder = (table: any) => {
    const orders = table?.orders || []
    return orders[0] || null
  }

  const addToCart = (product: any) => {
    const price = Number(product.salePrice || product.price)
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price, quantity: 1, image: product.image }]
    })
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId))
    } else {
      setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i))
    }
  }

  const saveCurrentState = (tableId: string | null) => {
    const state = {
      cart,
      orderId: currentOrderId,
      orderNumber: currentOrderNumber,
      note,
    }

    if (tableId) {
      setTableStates((prev) => ({ ...prev, [tableId]: state }))
    } else {
      setTakeawayState(state)
    }
  }

  const restoreState = (tableId: string | null, table?: any) => {
    if (tableId && table) {
      const openOrder = getOpenTableOrder(table)
      if (openOrder) {
        const loadedCart = orderToCart(openOrder)
        setCart(loadedCart)
        setCurrentOrderId(openOrder.id)
        setCurrentOrderNumber(openOrder.orderNumber)
        setNote(openOrder.note || '')
        setTableStates((prev) => ({
          ...prev,
          [tableId]: {
            cart: loadedCart,
            orderId: openOrder.id,
            orderNumber: openOrder.orderNumber,
            note: openOrder.note || '',
          },
        }))
        return
      }

      const cachedState = tableStates[tableId]
      if (cachedState?.orderId) {
        setCart([])
        setCurrentOrderId(null)
        setCurrentOrderNumber(null)
        setNote('')
        setTableStates((prev) => ({
          ...prev,
          [tableId]: { cart: [], orderId: null, orderNumber: null, note: '' },
        }))
        return
      }
    }

    const state = tableId ? tableStates[tableId] : takeawayState
    setCart(state?.cart || [])
    setCurrentOrderId(state?.orderId || null)
    setCurrentOrderNumber(state?.orderNumber || null)
    setNote(state?.note || '')
  }

  const handleSelectTable = (table: any) => {
    const currentTableId = selectedTable?.id || null
    saveCurrentState(currentTableId)
    setSelectedTable(table)
    const newTableId = table?.id || null
    restoreState(newTableId, table)
  }

  const handleSendToKitchen = () => {
    if (cart.length === 0) { toast.error('Chưa có món nào!'); return }
    orderMutation.mutate({
      type: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
      tableId: selectedTable?.id || undefined,
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      note: note || undefined,
    })
  }

  const loadOrder = async (orderId: string) => {
    if (!orderId) return
    try {
      const res = await ordersService.getById(orderId)
      const order = res.data || res
      if (!order) { toast.error('Không tìm thấy đơn'); return }
      const loadedCart = orderToCart(order)
      setCart(loadedCart)
      setCurrentOrderId(order.id)
      setCurrentOrderNumber(order.orderNumber)
      setNote(order.note || '')
      // set table if present
      if (order.tableId) {
        const table = tables.find((t: any) => t.id === order.tableId)
        if (table) handleSelectTable(table)
      }
      toast.success('Đã tải đơn')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi khi tải đơn')
    }
  }

  const saveOrderChanges = async () => {
    if (!currentOrderId) { toast.error('Chưa có đơn nào để lưu'); return }
    try {
      await ordersService.update(currentOrderId, {
        note: note || undefined,
        tableId: selectedTable?.id || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      toast.success('Lưu thay đổi đơn thành công')
      refetchTables()
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi khi lưu đơn')
    }
  }

  const cancelOrder = async () => {
    if (!currentOrderId) { toast.error('Chưa có đơn để hủy'); return }
    try {
      await ordersService.cancel(currentOrderId)
      toast.success('Đã hủy đơn')
      // clear local state
      setCart([])
      setCurrentOrderId(null)
      setCurrentOrderNumber(null)
      setNote('')
      refetchTables()
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi khi hủy đơn')
    }
  }

  const handleConfirmPayment = () => {
    if (!currentOrderId) {
      toast.error('Chưa có đơn hàng đã gửi bếp');
      return
    }
    payMutation.mutate({ orderId: currentOrderId, method: paymentMethod })
  }

  return (
    <div className="flex h-full" style={{ background: '#1a0a00' }}>
      {/* LEFT: Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table selector */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold mb-2"
            style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Chọn Bàn
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleSelectTable(null)}
              className="flex-none px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: !selectedTable ? '#6b3f2a' : 'rgba(255,255,255,0.06)',
                color: !selectedTable ? '#fff' : 'rgba(255,255,255,0.5)',
              }}>
              🥡 Mang Đi
            </button>
            {tables.map((table: any) => (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className="flex-none flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                style={{
                  background: selectedTable?.id === table.id ? 'rgba(107,63,42,0.5)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${selectedTable?.id === table.id ? '#c9a97a' : 'transparent'}`,
                  color: 'white',
                }}>
                <span className="w-2 h-2 rounded-full" style={{ background: TABLE_STATUS_COLORS[table.status] || '#9ca3af', flexShrink: 0 }} />
                <span className="font-bold">B{table.number}</span>
              </button>
            ))}
            <button onClick={() => refetchTables()} className="flex-none p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              <RotateCcw size={14} />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <input value={loadOrderId} onChange={(e) => setLoadOrderId(e.target.value)} placeholder="Order ID" className="input input-sm" />
              <button onClick={() => loadOrder(loadOrderId)} className="btn btn-sm">Tải</button>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setCategoryId('')}
            className="flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: !categoryId ? '#c9a97a' : 'rgba(255,255,255,0.07)',
              color: !categoryId ? '#1a0a00' : 'rgba(255,255,255,0.6)',
            }}>
            Tất cả
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className="flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: categoryId === cat.id ? '#c9a97a' : 'rgba(255,255,255,0.07)',
                color: categoryId === cat.id ? '#1a0a00' : 'rgba(255,255,255,0.6)',
              }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product: any) => {
              const cartItem = cart.find((i) => i.productId === product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="rounded-xl overflow-hidden text-left transition-transform hover:scale-105 active:scale-95 relative"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '110px', overflow: 'hidden' }}>
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {cartItem && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: '#c9a97a', color: '#1a0a00' }}>
                      {cartItem.quantity}
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">{product.name}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: '#c9a97a' }}>
                      {formatPrice(Number(product.salePrice || product.price))}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Order panel */}
      <div className="flex flex-col flex-shrink-0"
        style={{ width: '320px', background: '#2d1200', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                {selectedTable ? `Bàn ${selectedTable.number}` : 'Mang Đi'}
              </h3>
              {selectedTable?.location && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedTable.location}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="badge text-xs" style={{ background: 'rgba(201,169,122,0.2)', color: '#c9a97a' }}>
                {totalItems} món
              </span>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} style={{ color: 'rgba(255,255,255,0.3)' }}
                  className="hover:text-white transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Chọn món từ menu</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 mb-2 p-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {item.image && (
                  <img src={item.image} alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                  <p className="text-xs" style={{ color: '#c9a97a' }}>{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <Minus size={10} color="white" />
                  </button>
                  <span className="text-white font-bold text-xs w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#6b3f2a' }}>
                    <Plus size={10} color="white" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 px-3">
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú đơn hàng..."
              className="w-full text-xs rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                resize: 'none',
                minHeight: '52px',
                outline: 'none',
              }} />
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-semibold">Tổng cộng</span>
            <span className="text-2xl font-bold" style={{ color: '#c9a97a', fontFamily: 'Playfair Display, serif' }}>
              {formatPrice(totalPrice)}
            </span>
          </div>
          <button
            onClick={() => {
              if (!currentOrderId) {
                handleSendToKitchen()
              } else {
                setPaymentModal(true)
              }
            }}
            disabled={cart.length === 0 || orderMutation.isPending || payMutation.isPending}
            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: cart.length > 0 ? 'linear-gradient(135deg, #c9a97a, #6b3f2a)' : 'rgba(255,255,255,0.1)',
              color: cart.length > 0 ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: '0.9rem',
            }}>
            <CreditCard size={18} />
            {currentOrderId ? 'Thanh Toán' : 'Gửi bếp'}
          </button>
          {currentOrderId && (
            <div>
              <p className="text-xs mt-2" style={{ color: '#facc15' }}>
                🖨️ Đã in phiếu bếp • #{currentOrderNumber}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => printKitchenTicket({
                    orderNumber: currentOrderNumber || currentOrderId || '',
                    tableName: selectedTable ? `Bàn ${selectedTable.number}` : 'Mang đi',
                    type: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
                    items: cart.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.price, subtotal: i.price * i.quantity })),
                    note: note || undefined,
                    staffName: staffName || undefined,
                  })}
                  className="btn btn-outline btn-sm flex items-center gap-1"
                >
                  <Printer size={12} /> In lại phiếu
                </button>
                <button onClick={saveOrderChanges} className="btn btn-outline btn-sm">Lưu</button>
                <button onClick={cancelOrder} className="btn btn-error btn-sm">Hủy đơn</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => !payMutation.isPending && setPaymentModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm z-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              Thanh Toán 🖨️
            </h3>
            <p className="text-sm mb-1" style={{ color: '#9ca3af' }}>
              {selectedTable ? `Bàn ${selectedTable.number}` : 'Mang đi'} • {totalItems} món
            </p>
            <p className="text-xs mb-4" style={{ color: '#16a34a' }}>
              ✅ Hóa đơn sẽ được in tự động sau khi xác nhận
            </p>

            <div className="flex flex-col gap-3 mb-5">
              {[
                { value: 'CASH', label: '💵 Tiền Mặt', desc: 'Thanh toán trực tiếp' },
                { value: 'BANK_TRANSFER', label: '🏦 Chuyển Khoản', desc: 'ATM / Internet Banking' },
                { value: 'QR_CODE', label: '📱 QR Code', desc: 'Quét mã thanh toán' },
              ].map(({ value, label, desc }) => (
                <label key={value}
                  className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: paymentMethod === value ? '#f4ede6' : '#fdf9f6',
                    border: `2px solid ${paymentMethod === value ? '#6b3f2a' : '#e8d9cc'}`,
                  }}>
                  <input type="radio" name="pos-pm" value={value}
                    checked={paymentMethod === value} onChange={() => setPaymentMethod(value)}
                    style={{ accentColor: '#6b3f2a' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#2d1200' }}>{label}</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl mb-5"
              style={{ background: '#fdf8f0' }}>
              <span className="font-bold" style={{ color: '#2d1200' }}>Tổng cộng</span>
              <span className="text-2xl font-bold" style={{ color: '#6b3f2a' }}>{formatPrice(totalPrice)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(false)} disabled={payMutation.isPending}
                className="btn btn-outline flex-1">Hủy</button>
              <button onClick={handleConfirmPayment} disabled={payMutation.isPending}
                className="btn btn-primary flex-1 justify-center">
                {payMutation.isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Xử lý...</>
                  : '✓ Xác Nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
