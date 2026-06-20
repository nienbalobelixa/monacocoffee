import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '../../services/orders.service'
import { toast } from 'sonner'
import { useState } from 'react'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ'
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']

export default function OrdersAdminPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => ordersService.getAll({ status: status || undefined, page, limit: 15 }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => ordersService.updateStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Cập nhật trạng thái thành công')
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
                  <select
                    value={order.status}
                    onChange={(e) => updateMutation.mutate({ id: order.id, s: e.target.value })}
                    className="input"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
