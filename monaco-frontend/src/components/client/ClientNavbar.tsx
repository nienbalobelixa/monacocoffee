import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Coffee, LogOut, LayoutDashboard } from 'lucide-react'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'
import { useState } from 'react'

export default function ClientNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openCart = useCartStore((s) => s.openCart)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Trang Chủ' },
    { to: '/menu', label: 'Thực Đơn' },
    { to: '/reservations', label: 'Đặt Bàn' },
  ]

  return (
    <nav className="navbar">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
              <Coffee size={18} color="white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#6b3f2a' }}>Monaco Coffee</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to}
                className="text-sm font-medium transition-colors"
                style={{ color: '#4a1e00', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#6b3f2a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4a1e00')}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button onClick={openCart} className="relative p-2 rounded-lg transition-colors hover:bg-coffee-100"
              style={{ color: '#6b3f2a' }}>
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: '#6b3f2a' }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg transition-colors"
                  style={{ color: '#6b3f2a' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
                    {user?.fullName?.[0]?.toUpperCase()}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border overflow-hidden z-50"
                    style={{ borderColor: '#e8d9cc' }}>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-coffee-50 transition-colors"
                      style={{ color: '#4a1e00', textDecoration: 'none' }}>
                      <User size={16} /> Hồ Sơ Cá Nhân
                    </Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-coffee-50 transition-colors"
                      style={{ color: '#4a1e00', textDecoration: 'none' }}>
                      📜 Đơn Hàng Của Tôi
                    </Link>
                    {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-coffee-50 transition-colors"
                        style={{ color: '#4a1e00', textDecoration: 'none' }}>
                        <LayoutDashboard size={16} /> Quản Trị
                      </Link>
                    )}
                    {['ADMIN', 'MANAGER', 'STAFF'].includes(user?.role || '') && (
                      <Link to="/pos" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-coffee-50 transition-colors"
                        style={{ color: '#4a1e00', textDecoration: 'none' }}>
                        🖥️ POS Terminal
                      </Link>
                    )}
                    <hr style={{ borderColor: '#e8d9cc' }} />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-red-50 transition-colors text-left"
                      style={{ color: '#dc2626' }}>
                      <LogOut size={16} /> Đăng Xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="btn btn-primary btn-sm">
                Đăng Nhập
              </Link>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: '#6b3f2a' }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t" style={{ borderColor: '#e8d9cc' }}>
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium rounded-lg"
                style={{ color: '#4a1e00', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
