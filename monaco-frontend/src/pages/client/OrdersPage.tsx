import { useQuery } from '@tanstack/react-query'
import { ordersService } from '../../services/orders.service'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronRight, Package } from 'lucide-react'

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
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersService.getMyOrders({ limit: 50 }),
  })

  const allOrders: any[] = data?.data || []
  const orders = filter ? allOrders.filter((o) => o.status === filter) : allOrders

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
              <Link key={order.id} to={`/orders/${order.id}`}
                className="card-flat p-5 flex items-center gap-5 group transition-all"
                style={{ textDecoration: 'none' }}>
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

                <ChevronRight size={18} style={{ color: '#9ca3af' }} className="flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
