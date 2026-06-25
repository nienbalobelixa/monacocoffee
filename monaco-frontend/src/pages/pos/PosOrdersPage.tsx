import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { posService } from '../../services/pos.service'
import { ordersService } from '../../services/orders.service'
import { useState } from 'react'
import { Clock, Coffee, ShoppingBag, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

const fmt = (p: number) => (p || 0).toLocaleString('vi-VN') + 'đ'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  PENDING:   { label: 'Chờ xử lý',   bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  CONFIRMED: { label: 'Xác nhận',    bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  PREPARING: { label: 'Đang pha',    bg: '#f3e8ff', color: '#6b21a8', dot: '#a855f7' },
  READY:     { label: 'Sẵn sàng',   bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  DELIVERING:{ label: 'Đang giao',  bg: '#e0f2fe', color: '#075985', dot: '#0ea5e9' },
  COMPLETED: { label: 'Hoàn thành', bg: '#d1fae5', color: '#065f46', dot: '#16a34a' },
  CANCELLED: { label: 'Đã hủy',     bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED',
}

const FILTERS = [
  { key: 'ALL',       label: 'Tất cả' },
  { key: 'PENDING',   label: 'Chờ xử lý' },
  { key: 'PREPARING', label: 'Đang pha' },
  { key: 'READY',     label: 'Sẵn sàng' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
]

export default function PosOrdersPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('ALL')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['pos-orders-today', filter],
    queryFn: () => posService.getOrdersToday(filter === 'ALL' ? undefined : filter),
    refetchInterval: 15000,
    staleTime: 5000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos-orders-today'] })
      qc.invalidateQueries({ queryKey: ['pos-tables'] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos-orders-today'] })
      toast.success('Đã hủy đơn hàng')
    },
    onError: () => toast.error('Không thể hủy đơn hàng'),
  })

  // Unwrap TransformInterceptor: { success, data: [...] }
  const raw = data?.data ?? data
  const orders: any[] = Array.isArray(raw) ? raw : []

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a0a00' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Đơn Hàng Hôm Nay
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {orders.length} đơn • tự động cập nhật mỗi 15 giây
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(201,169,122,0.15)', color: '#c9a97a' }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => {
            const count = key === 'ALL'
              ? orders.length
              : orders.filter((o: any) => o.status === key).length
            const active = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? '#c9a97a' : 'rgba(255,255,255,0.07)',
                  color: active ? '#1a0a00' : 'rgba(255,255,255,0.55)',
                }}
              >
                {label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: active ? 'rgba(0,0,0,0.2)' : 'rgba(201,169,122,0.25)', color: active ? '#1a0a00' : '#c9a97a' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-4 w-1/2 rounded bg-slate-700 mb-3" />
                <div className="h-3 w-3/4 rounded bg-slate-700" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Coffee size={44} style={{ color: 'rgba(201,169,122,0.3)' }} className="mb-4" />
            <p className="text-white font-semibold mb-1">Không có đơn hàng nào</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {filter === 'ALL' ? 'Hôm nay chưa có đơn nào' : `Không có đơn "${FILTERS.find(f => f.key === filter)?.label}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {orders.map((order: any) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
              const isOpen = expanded[order.id]
              const nextSt = NEXT_STATUS[order.status]
              const isActive = !['COMPLETED', 'CANCELLED'].includes(order.status)

              return (
                <div key={order.id} className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)', border: isActive ? '1px solid rgba(201,169,122,0.2)' : '1px solid transparent' }}>

                  {/* Order header — click to toggle */}
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => toggle(order.id)}
                  >
                    {/* Status dot */}
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-white">#{order.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {order.table && (
                          <span className="text-xs font-semibold" style={{ color: '#c9a97a' }}>
                            Bàn {order.table.number}
                          </span>
                        )}
                        {!order.table && (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Mang đi</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        <span className="flex items-center gap-1">
                          <ShoppingBag size={11} />
                          {order.items?.length || 0} món
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold" style={{ color: '#c9a97a' }}>
                          {fmt(Number(order.total))}
                        </span>
                      </div>
                    </div>

                    {isOpen ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                      : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                  </button>

                  {/* Expanded: items + actions */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {/* Items list */}
                      <div className="space-y-2 pt-3 mb-4">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.2)' }}>
                            {item.product?.image && (
                              <img src={item.product.image} alt={item.product?.name}
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {item.product?.name || 'Sản phẩm'}
                              </p>
                              {item.note && (
                                <p className="text-[11px] italic" style={{ color: '#c9a97a' }}>
                                  "{item.note}"
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold" style={{ color: '#c9a97a' }}>×{item.quantity}</p>
                              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {fmt(Number(item.subtotal))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Note */}
                      {order.note && (
                        <div className="mb-3 px-3 py-2 rounded-xl text-xs italic"
                          style={{ background: 'rgba(201,169,122,0.1)', color: '#c9a97a' }}>
                          📝 {order.note}
                        </div>
                      )}

                      {/* Payment info (if paid) */}
                      {order.payment && (
                        <div className="mb-3 px-3 py-2 rounded-xl text-xs"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
                          💳 {order.payment.method?.replace('_', ' ')} •{' '}
                          {order.payment.paidAt && new Date(order.payment.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {/* Action buttons */}
                      {isActive && (
                        <div className="flex gap-2">
                          {nextSt && (
                            <button
                              onClick={() => statusMutation.mutate({ id: order.id, status: nextSt })}
                              disabled={statusMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                              style={{ background: 'linear-gradient(135deg, #c9a97a, #8b5e3c)', color: 'white' }}
                            >
                              <CheckCircle size={15} />
                              {STATUS_CONFIG[nextSt]?.label || nextSt}
                            </button>
                          )}
                          {order.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Hủy đơn #${order.orderNumber}?`))
                                  cancelMutation.mutate(order.id)
                              }}
                              disabled={cancelMutation.isPending}
                              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                              style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171' }}
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
