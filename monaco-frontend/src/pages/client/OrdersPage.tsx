import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '../../services/orders.service'
import { productsService } from '../../services/products.service'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ChevronRight, Package, Pencil, Trash, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ'

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PREPARING: '#8b5cf6',
  READY: '#10b981',
  DELIVERING: '#f97316',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang pha chế',
  READY: 'Sẵn sàng',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export default function OrdersPage() {
  const [filter, setFilter] = useState('')
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersService.getMyOrders({ limit: 50 }),
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordersService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Cập nhật đơn hàng thành công')
      setShowEditModal(false)
      setEditingOrder(null)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi cập nhật đơn')
    },
  })

  const allOrders: any[] = data?.data || []
  const orders = filter ? allOrders.filter((o) => o.status === filter) : allOrders

  const { data: productsData } = useQuery({ queryKey: ['products-list-for-order-client'], queryFn: () => productsService.getAll({ limit: 1000 }) })
  const productsList = productsData?.data || []

  useEffect(() => {
    // preselect first product when productsList updates
  }, [productsList])

  // Edit modal component — full menu + cart like POS
  function EditOrderModal({ order, open, onClose, onSave }: { order: any, open: boolean, onClose: () => void, onSave: (data: any) => void }) {
    const [cart, setCart] = useState<any[]>(() => (order?.items || []).map((it: any) => ({ productId: it.productId, name: it.product?.name, price: Number(it.product?.salePrice || it.product?.price || 0), quantity: it.quantity, image: it.product?.image })))
    const [note, setNote] = useState<string>(order?.note || '')

    useEffect(() => {
      setCart((order?.items || []).map((it: any) => ({ productId: it.productId, name: it.product?.name, price: Number(it.product?.salePrice || it.product?.price || 0), quantity: it.quantity, image: it.product?.image })))
      setNote(order?.note || '')
    }, [order])

    const addToCart = (product: any) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id)
        const price = Number(product.salePrice || product.price || 0)
        if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        return [...prev, { productId: product.id, name: product.name, price, quantity: 1, image: product.image }]
      })
    }

    const updateQty = (productId: string, qty: number) => {
      if (qty <= 0) setCart((prev) => prev.filter((i) => i.productId !== productId))
      else setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i))
    }

    const products = productsList || []
    const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0)

    if (!open) return null

    return (
      <div className="absolute inset-0 z-50">
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[1000px] max-w-full p-0 z-60 flex overflow-hidden">
          {/* Left: products */}
          <div className="w-2/3 p-4" style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="grid grid-cols-3 gap-3">
              {products.map((product: any) => (
                <button key={product.id} onClick={() => addToCart(product)} className="rounded-xl overflow-hidden text-left transition-transform" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div style={{ height: '90px', overflow: 'hidden' }}>
                    <img src={product.image || 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-semibold" style={{ color: '#2d1200' }}>{product.name}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#6b3f2a' }}>{formatPrice(Number(product.salePrice || product.price))}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: cart */}
          <div className="w-1/3 p-4 flex flex-col">
            <h3 className="font-bold mb-3">Giỏ hàng</h3>
            <div className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <div className="text-center text-sm text-muted">Chưa có món trong đơn</div>
              ) : cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ border: '1px solid rgba(0,0,0,0.04)' }}>
                  {item.image && <img src={item.image} className="w-12 h-12 object-cover rounded" />}
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-muted">{formatPrice(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }}><Minus size={12} /></button>
                    <div className="px-2 font-bold">{item.quantity}</div>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-[#6b3f2a] text-white"><Plus size={12} /></button>
                    <button onClick={() => updateQty(item.productId, 0)} className="btn btn-ghost btn-sm"><Trash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <label className="label">Ghi chú</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded p-2" />
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold">Tổng</div>
                <div className="text-xl font-bold" style={{ color: '#6b3f2a' }}>{formatPrice(totalPrice)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn btn-outline flex-1">Hủy</button>
                <button onClick={() => onSave({ note: note || undefined, items: cart.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })) })} className="btn btn-primary flex-1">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="container">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
          Lịch Sử Đơn Hàng
        </h1>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {['', 'PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm flex-none ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s ? statusLabel[s] : 'Tất cả'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '1rem' }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <Package size={80} className="mx-auto mb-6" style={{ color: '#e8d9cc' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              {filter ? 'Không có đơn hàng' : 'Chưa có đơn hàng nào'}
            </h2>
            <p className="mb-6" style={{ color: '#6b7280' }}>
              {filter ? 'Thử lọc theo trạng thái khác' : 'Hãy đặt món đầu tiên của bạn!'}
            </p>
            <Link to="/menu" className="btn btn-primary">Xem Thực Đơn</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order: any) => (
              <div key={order.id} className="card-flat p-5 flex items-center gap-5 group transition-all" style={{ textDecoration: 'none' }}>
                {/* Status indicator */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: statusColors[order.status] + '20' }}>
                  <div className="w-3 h-3 rounded-full"
                    style={{ background: statusColors[order.status] }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold" style={{ color: '#2d1200' }}>#{order.orderNumber}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
                        {order.items?.length} món •{' '}
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold" style={{ color: '#6b3f2a' }}>
                        {formatPrice(Number(order.total))}
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: statusColors[order.status] + '20',
                          color: statusColors[order.status],
                        }}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  {order.items?.slice(0, 2).map((item: any) => (
                    <span key={item.id} className="text-xs mr-3" style={{ color: '#9ca3af' }}>
                      {item.product?.name} ×{item.quantity}
                    </span>
                  ))}
                  {order.items?.length > 2 && (
                    <span className="text-xs" style={{ color: '#9ca3af' }}>
                      +{order.items.length - 2} món khác
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link to={`/orders/${order.id}`} className="text-xs text-muted">Chi tiết</Link>
                  <button title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); setEditingOrder(order); setShowEditModal(true) }} className="btn btn-ghost btn-sm"><Pencil size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showEditModal && editingOrder && (
          <EditOrderModal order={editingOrder} open={showEditModal} onClose={() => { setShowEditModal(false); setEditingOrder(null) }} onSave={(data) => editMutation.mutate({ id: editingOrder.id, data })} />
        )}
      </div>
    </div>
  )
}
