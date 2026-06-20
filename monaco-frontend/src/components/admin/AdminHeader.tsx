import { Menu, Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { useNavigate } from 'react-router-dom'

interface Props { onMenuClick: () => void }

export default function AdminHeader({ onMenuClick }: Props) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

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
        <button className="p-2 rounded-lg hover:bg-gray-100 relative" style={{ color: '#6b7280' }}>
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#6b3f2a' }} />
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
