import { useQuery } from '@tanstack/react-query'
import { posService } from '../../services/pos.service'
import { Clock, Coffee, ShoppingBag, Table } from 'lucide-react'

const formatPrice = (p: number) => (p || 0).toLocaleString('vi-VN') + 'đ'
const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang pha chế',
  READY: 'Sẵn sàng',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export default function PosOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pos-active-orders'],
    queryFn: posService.getActiveOrders,
    staleTime: 10000,
    refetchInterval: 15000,
  })

  const orders = data?.data || []

  return (
    <div className="h-full p-6 overflow-hidden" style={{ background: '#1a0a00' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#fff', fontFamily: 'Playfair Display, serif' }}>
            Đơn hàng đang chạy
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Danh sách đơn hàng cho quầy và bếp. Cập nhật tự động mỗi 15 giây.
          </p>
        </div>
      </div>

      <div className="h-[calc(100%-104px)] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-5 w-3/4 rounded-lg bg-slate-700 mb-4" />
                <div className="h-3 w-1/2 rounded-lg bg-slate-700" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <Coffee size={48} className="mb-4" style={{ color: '#c9a97a' }} />
            <p className="text-white font-semibold mb-2">Không có đơn hàng đang chờ</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Khi khách order, đơn hàng sẽ xuất lên đây để quầy và bếp theo dõi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#f8f2e9' }}>#{order.orderNumber}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-2 text-xs" style={{ color: '#d3c4b3' }}>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(201,169,122,0.12)' }}>
                        <Table size={12} />
                        {order.table ? `Bàn ${order.table.number}` : 'Mang đi'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(201,169,122,0.12)' }}>
                        <ShoppingBag size={12} />
                        {order.items?.length || 0} món
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(201,169,122,0.12)' }}>
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: '#c9a97a' }}>{formatPrice(Number(order.total))}</p>
                    <span className="text-[11px] font-semibold uppercase" style={{ color: '#c9a97a' }}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold" style={{ color: '#f8f2e9' }}>{item.product?.name || item.productId}</p>
                        <p className="text-[11px]" style={{ color: '#c9b7a0' }}>
                          {item.quantity} × {formatPrice(Number(item.unitPrice))}
                        </p>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: '#c9a97a' }}>
                        {formatPrice(Number(item.subtotal))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
