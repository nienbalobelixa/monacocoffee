import { Outlet } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { LogOut, LayoutGrid, Coffee, ClipboardList, Printer } from 'lucide-react'
import { isAndroidWebView } from '../utils/print.service'

export default function PosLayout() {
  const { user, logout } = useAuthStore()
  const loc = useLocation()
  const navLink = (to: string) => ({
    color: loc.pathname === to ? '#c9a97a' : 'rgba(255,255,255,0.5)',
    fontWeight: loc.pathname === to ? '600' : '400',
  })

  return (
    <div className="h-screen flex flex-col" style={{ background: '#1a0a00' }}>
      {/* POS Header */}
      <header className="flex items-center justify-between px-6 py-3" style={{ background: '#2d1200', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <Coffee size={24} style={{ color: '#c9a97a' }} />
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Monaco POS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:inline" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.fullName}</span>
          <Link to="/pos" className="flex items-center gap-1.5 text-sm transition-colors" style={navLink('/pos')}>
            <Coffee size={16} /> POS
          </Link>
          <Link to="/pos/orders" className="flex items-center gap-1.5 text-sm transition-colors" style={navLink('/pos/orders')}>
            <ClipboardList size={16} /> Đơn hàng
          </Link>
          <Link to="/pos/printer" className="flex items-center gap-1.5 text-sm transition-colors" style={navLink('/pos/printer')}
            title="Cài đặt máy in">
            <Printer size={16} />
            {isAndroidWebView() && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
          </Link>
          <Link to="/admin" className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <LayoutGrid size={18} />
          </Link>
          <button onClick={logout} style={{ color: 'rgba(255,255,255,0.4)' }} className="hover:text-white transition-colors">
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
