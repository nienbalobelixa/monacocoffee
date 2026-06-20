import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { LogOut, LayoutGrid, Coffee } from 'lucide-react'

export default function PosLayout() {
  const { user, logout } = useAuthStore()

  return (
    <div className="h-screen flex flex-col" style={{ background: '#1a0a00' }}>
      {/* POS Header */}
      <header className="flex items-center justify-between px-6 py-3" style={{ background: '#2d1200', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <Coffee size={24} style={{ color: '#c9a97a' }} />
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Monaco POS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.fullName}</span>
          <Link to="/pos/orders" className="text-sm" style={{ color: '#c9a97a' }}>
            Đơn hàng
          </Link>
          <Link to="/admin" className="text-sm" style={{ color: '#c9a97a' }}>
            <LayoutGrid size={18} />
          </Link>
          <button onClick={logout} style={{ color: 'rgba(255,255,255,0.5)' }} className="hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
