import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reservationsService } from '../../services/reservations.service'
import { useState } from 'react'
import { CalendarClock, Users, Phone } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#3b82f6', CANCELLED: '#dc2626', COMPLETED: '#16a34a'
}
const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy', COMPLETED: 'Hoàn thành', NO_SHOW: 'Không đến'
}

export default function ReservationsAdminPage() {
  const qc = useQueryClient()
  const [date, setDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reservations', date],
    queryFn: () => reservationsService.getAll({ date: date || undefined, limit: 50 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => reservationsService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reservations'] }); toast.success('Cập nhật thành công') },
  })

  const reservations = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.data)
      ? data.data.data
      : []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Đặt Bàn</h1>
        <p className="mt-1" style={{ color: '#9ca3af' }}>{reservations.length} yêu cầu</p>
      </div>

      <div className="card-flat p-4 mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Lọc theo ngày</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        {date && (
          <div className="flex items-end">
            <button onClick={() => setDate('')} className="btn btn-ghost btn-sm">Xóa bộ lọc</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '1rem' }} />)}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20">
          <CalendarClock size={60} className="mx-auto mb-4" style={{ color: '#e8d9cc' }} />
          <p style={{ color: '#9ca3af' }}>Không có yêu cầu đặt bàn nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reservations.map((res: any) => (
            <div key={res.id} className="card-flat p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold" style={{ color: '#2d1200' }}>{res.guestName}</h3>
                    <span className="badge text-xs" style={{
                      background: statusColors[res.status] + '20',
                      color: statusColors[res.status],
                    }}>{statusLabels[res.status] || res.status}</span>
                  </div>
                  <div className="flex gap-5 text-sm flex-wrap">
                    <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                      <Phone size={13} /> {res.guestPhone}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                      <Users size={13} /> {res.guestCount} khách
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#6b7280' }}>
                      <CalendarClock size={13} />
                      {new Date(res.date).toLocaleDateString('vi-VN')} lúc{' '}
                      {new Date(res.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {res.table && (
                      <span style={{ color: '#6b3f2a', fontWeight: 600 }}>Bàn {res.table.number}</span>
                    )}
                  </div>
                  {res.note && <p className="text-sm mt-2 italic" style={{ color: '#9ca3af' }}>"{res.note}"</p>}
                </div>
                <div className="flex-shrink-0">
                  <select value={res.status}
                    onChange={(e) => statusMutation.mutate({ id: res.id, status: e.target.value })}
                    className="input text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    {Object.entries(statusLabels).filter(([s]) => s !== 'NO_SHOW').map(([s, l]) => (
                      <option key={s} value={s}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
