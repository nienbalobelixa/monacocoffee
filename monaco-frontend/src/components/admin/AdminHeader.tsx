import { Menu, Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ordersService } from '../../services/orders.service'

interface Props { onMenuClick: () => void }

export default function AdminHeader({ onMenuClick }: Props) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const lastPendingCount = useRef<number | null>(null)
  const canApproveOrders = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: pendingOrders } = useQuery({
    queryKey: ['admin-pending-orders-count'],
    queryFn: () => ordersService.getAll({ status: 'PENDING', page: 1, limit: 1 }),
    enabled: canApproveOrders,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })

  const pendingCount = pendingOrders?.meta?.total || 0

  useEffect(() => {
    if (!canApproveOrders) return
    if (lastPendingCount.current !== null && pendingCount > lastPendingCount.current) {
      toast.info('Co don hang moi dang cho duyet')
    }
    lastPendingCount.current = pendingCount
  }, [canApproveOrders, pendingCount])

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4" style={{ background: 'white', borderBottom: '1px solid #e8d9cc', flexShrink: 0 }}>
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#6b3f2a' }}>
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 rounded-lg hover:bg-gray-100 relative"
          style={{ color: pendingCount > 0 ? '#6b3f2a' : '#6b7280' }}
          title={pendingCount > 0 ? `${pendingCount} don hang dang cho duyet` : 'Khong co don hang cho duyet'}>
          <Bell size={20} />
          {pendingCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
              style={{ background: '#dc2626', color: 'white' }}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
            {user?.fullName?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold" style={{ color: '#2d1200' }}>{user?.fullName}</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#dc2626' }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
