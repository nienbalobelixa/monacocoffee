import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersService } from '../../services/orders.service'
import { CheckCircle2, Clock, ChefHat, Package, Bike, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ'

const statusSteps = [
  { status: 'PENDING', label: 'Chờ xác nhận', icon: Clock, color: '#f59e0b' },
  { status: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle2, color: '#3b82f6' },
  { status: 'PREPARING', label: 'Đang pha chế', icon: ChefHat, color: '#8b5cf6' },
  { status: 'READY', label: 'Sẵn sàng', icon: Package, color: '#10b981' },
  { status: 'DELIVERING', label: 'Đang giao', icon: Bike, color: '#f97316' },
  { status: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2, color: '#16a34a' },
]

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getById(id!),
    enabled: !!id,
    refetchInterval: 15000,
  })

  const order = data?.data

  if (isLoading) return (
    <div className="section">
      <div className="container max-w-2xl">
        <div className="skeleton" style={{ height: '120px', borderRadius: '1rem', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '1rem' }} />
      </div>
    </div>
  )

  if (!order) return (
    <div className="section">
      <div className="container text-center py-20">
        <p className="text-5xl mb-4">📦</p>
        <p style={{ color: '#6b7280' }}>Không tìm thấy đơn hàng</p>
        <Link to="/orders" className="btn btn-primary mt-4">Xem Đơn Hàng</Link>
      </div>
    </div>
  )

  const isCancelled = order.status === 'CANCELLED'
  const currentIdx = statusSteps.findIndex((s) => s.status === order.status)

  return (
    <div className="section">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="card-flat p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
                Theo Dõi Đơn Hàng
              </h1>
              <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                #{order.orderNumber}
              </p>
            </div>
            <span className={`badge ${isCancelled ? 'badge-error' : 'badge-success'} text-sm`} style={{ padding: '0.5rem 1rem' }}>
              {statusLabel[order.status] || order.status}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: '1px solid #e8d9cc' }}>
            <div>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Loại đơn</p>
              <p className="font-semibold text-sm mt-0.5" style={{ color: '#2d1200' }}>{order.type}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Thời gian</p>
              <p className="font-semibold text-sm mt-0.5" style={{ color: '#2d1200' }}>
                {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Tổng tiền</p>
              <p className="font-bold text-sm mt-0.5" style={{ color: '#6b3f2a' }}>
                {formatPrice(Number(order.total))}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled ? (
          <div className="card-flat p-6 mb-6">
            <h3 className="font-bold mb-6" style={{ color: '#2d1200' }}>Trạng Thái Đơn Hàng</h3>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5" style={{ background: '#e8d9cc' }} />
              <div
                className="absolute left-5 top-5 w-0.5 transition-all"
                style={{
                  background: 'linear-gradient(to bottom, #6b3f2a, #c9a97a)',
                  height: `${currentIdx >= 0 ? (currentIdx / (statusSteps.length - 1)) * 100 : 0}%`,
                }}
              />

              <div className="flex flex-col gap-6">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon
                  const done = idx <= currentIdx
                  const isCurrent = idx === currentIdx
                  return (
                    <div key={step.status} className="flex items-center gap-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all`}
                        style={{
                          background: done ? step.color : '#f4ede6',
                          outline: isCurrent ? `4px solid ${step.color}40` : 'none',
                        }}>
                        <Icon size={18} color={done ? 'white' : '#9ca3af'} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${done ? '' : 'opacity-50'}`}
                          style={{ color: done ? '#2d1200' : '#9ca3af' }}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs mt-0.5 animate-pulse" style={{ color: step.color }}>
                            Đang thực hiện...
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-flat p-6 mb-6 text-center">
            <XCircle size={48} className="mx-auto mb-3" style={{ color: '#dc2626' }} />
            <p className="font-bold text-lg" style={{ color: '#dc2626' }}>Đơn hàng đã bị hủy</p>
          </div>
        )}

        {/* Items */}
        <div className="card-flat p-6 mb-6">
          <h3 className="font-bold mb-4" style={{ color: '#2d1200' }}>Chi Tiết Đơn Hàng</h3>
          <div className="flex flex-col gap-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid #f5f0eb' }}>
                <div className="flex items-center gap-3">
                  {item.product?.image && (
                    <img src={item.product.image} alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#2d1200' }}>{item.product?.name}</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>×{item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold" style={{ color: '#6b3f2a' }}>
                  {formatPrice(Number(item.subtotal))}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e8d9cc' }}>
            <div className="flex justify-between mb-2 text-sm">
              <span style={{ color: '#6b7280' }}>Tạm tính</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between mb-2 text-sm">
                <span style={{ color: '#16a34a' }}>Giảm giá</span>
                <span style={{ color: '#16a34a' }}>-{formatPrice(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-3">
              <span style={{ color: '#2d1200' }}>Tổng cộng</span>
              <span style={{ color: '#6b3f2a' }}>{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/orders" className="btn btn-outline flex-1 justify-center">
            Tất Cả Đơn Hàng
          </Link>
          <Link to="/menu" className="btn btn-primary flex-1 justify-center">
            Đặt Thêm Món
          </Link>
        </div>
      </div>
    </div>
  )
}
