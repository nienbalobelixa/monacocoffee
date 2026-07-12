import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '../../services/orders.service'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { Trash, Plus } from 'lucide-react'
import { productsService } from '../../services/products.service'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ'
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']

export default function OrdersAdminPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => ordersService.getAll({ status: status || undefined, page, limit: 15 }),
    refetchInterval: 10000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => ordersService.updateStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      toast.success('Cập nhật trạng thái thành công')
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordersService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      toast.success('Cập nhật đơn hàng thành công')
      setShowEditModal(false)
      setEditingOrder(null)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi cập nhật đơn')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      toast.success('Da xoa don hang')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Loi khi xoa don')
    },
  })

  const orders = data?.data || []
  const meta = data?.meta

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Quản Lý Đơn Hàng</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {['', ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`btn btn-sm flex-none ${status === s ? 'btn-primary' : 'btn-outline'}`}>
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="card-flat overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Khách Hàng</th>
              <th>Loại</th>
              <th>Món</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th>Thời Gian</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
            ) : orders.map((order: any) => (
              <tr key={order.id}>
                <td><span className="font-mono text-sm font-bold" style={{ color: '#6b3f2a' }}>#{order.orderNumber}</span></td>
                <td style={{ color: '#2d1200' }}>{order.user?.fullName || 'Khách vãng lai'}</td>
                <td><span className="badge badge-info">{order.type}</span></td>
                <td style={{ color: '#6b7280' }}>{order.items?.length} món</td>
                <td className="font-semibold" style={{ color: '#6b3f2a' }}>{formatPrice(Number(order.total))}</td>
                <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                <td className="text-sm" style={{ color: '#9ca3af' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateMutation.mutate({ id: order.id, s: e.target.value })}
                      className="input"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button title="Chỉnh sửa" className="btn btn-ghost btn-sm" onClick={() => { setEditingOrder(order); setShowEditModal(true) }}>
                      <Pencil size={16} />
                    </button>
                    <button
                      title="Xoa don"
                      className="btn btn-ghost btn-sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Xoa don #${order.orderNumber}?`)) {
                          deleteMutation.mutate(order.id)
                        }
                      }}>
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: meta.totalPages }, (_value: unknown, i: number) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}>{p}</button>
          ))}
        </div>
      )}
      {showEditModal && editingOrder && (
        <EditOrderModal order={editingOrder} open={showEditModal} onClose={() => { setShowEditModal(false); setEditingOrder(null) }} onSave={(data) => editMutation.mutate({ id: editingOrder.id, data })} />
      )}
    </div>
  )
}

// Edit Modal rendered at file bottom so it has access to component state
function EditOrderModal({ order, open, onClose, onSave }: { order: any, open: boolean, onClose: () => void, onSave: (data: any) => void }) {
  const [form, setForm] = useState(() => ({
    note: order?.note || '',
    promotionCode: order?.promotionCode || '',
    tableId: order?.tableId || '',
    deliveryAddress: order?.deliveryAddress || '',
    items: (order?.items || []).map((it: any) => ({ id: it.id, productId: it.productId, name: it.product?.name, quantity: it.quantity, note: it.note }))
  }))

  useEffect(() => {
    setForm({
      note: order?.note || '',
      promotionCode: order?.promotionCode || '',
      tableId: order?.tableId || '',
      deliveryAddress: order?.deliveryAddress || '',
      items: (order?.items || []).map((it: any) => ({ id: it.id, productId: it.productId, name: it.product?.name, quantity: it.quantity, note: it.note }))
    })
  }, [order])

  const { data: productsData } = useQuery({ queryKey: ['products-list-for-order'], queryFn: () => productsService.getAll({ limit: 1000 }) })
  const productsList = productsData?.data || []
  const [newProductId, setNewProductId] = useState<string | null>(productsList?.[0]?.id || null)
  const [newQuantity, setNewQuantity] = useState<number>(1)

  if (!open) return null

  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[900px] max-w-full p-6 z-60">
        <h2 className="text-lg font-bold mb-4">Chỉnh sửa đơn #{order?.orderNumber}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ghi chú</label>
            <input className="input w-full" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

            <label className="label mt-3">Mã khuyến mãi</label>
            <input className="input w-full" value={form.promotionCode} onChange={(e) => setForm({ ...form, promotionCode: e.target.value })} />

            <label className="label mt-3">Bàn</label>
            <input className="input w-full" value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} />

            <label className="label mt-3">Địa chỉ giao</label>
            <input className="input w-full" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
          </div>

          <div>
            <label className="label">Món</label>
            <div className="space-y-2 max-h-64 overflow-auto">
              {form.items.map((it: any, idx: number) => (
                <div key={it.id ?? idx} className="flex items-center gap-2">
                  <div className="flex-1 text-sm" style={{ color: '#2d1200' }}>{it.name}</div>
                  <input type="number" min={1} className="input w-24" value={it.quantity}
                    onChange={(e) => { const q = Number(e.target.value || 0); const items = [...form.items]; items[idx] = { ...items[idx], quantity: q }; setForm({ ...form, items }) }} />
                  <button className="btn btn-ghost btn-sm" onClick={() => { const items = form.items.filter((_item: unknown, i: number) => i !== idx); setForm({ ...form, items }) }} title="Xóa món"><Trash size={16} /></button>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-2">
                <select className="input" value={newProductId || ''} onChange={(e) => setNewProductId(e.target.value)}>
                  <option value="">-- Chọn món --</option>
                  {productsList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} className="input w-24" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value || 1))} />
                <button className="btn btn-primary btn-sm" onClick={() => {
                  if (!newProductId) return
                  const prod = productsList.find((p: any) => p.id === newProductId)
                  if (!prod) return
                  const items = [...form.items, { id: `new-${Date.now()}`, productId: prod.id, name: prod.name, quantity: newQuantity }]
                  setForm({ ...form, items })
                }}><Plus size={14} /> Thêm</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="btn btn-outline">Hủy</button>
          <button onClick={() => onSave({ note: form.note, promotionCode: form.promotionCode || undefined, tableId: form.tableId || undefined, deliveryAddress: form.deliveryAddress || undefined, items: form.items.map((i: any) => ({ productId: i.productId, quantity: Number(i.quantity) })) })} className="btn btn-primary">Lưu</button>
        </div>
      </div>
    </div>
  )
}
