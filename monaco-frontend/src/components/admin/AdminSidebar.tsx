import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tags, ShoppingCart, Users, UserCheck,
  Warehouse, Gift, Table2, CalendarClock, BarChart3, Coffee, X
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: Package, label: 'Sản Phẩm', to: '/admin/products' },
  { icon: Tags, label: 'Danh Mục', to: '/admin/categories' },
  { icon: ShoppingCart, label: 'Đơn Hàng', to: '/admin/orders' },
  { icon: Users, label: 'Khách Hàng', to: '/admin/users' },
  { icon: UserCheck, label: 'Nhân Viên', to: '/admin/employees' },
  { icon: Warehouse, label: 'Kho Hàng', to: '/admin/inventory' },
  { icon: Gift, label: 'Khuyến Mãi', to: '/admin/promotions' },
  { icon: Table2, label: 'Quản Lý Bàn', to: '/admin/tables' },
  { icon: CalendarClock, label: 'Đặt Bàn', to: '/admin/reservations' },
  { icon: BarChart3, label: 'Báo Cáo', to: '/admin/reports' },
]

interface Props { open: boolean; onClose: () => void }

export default function AdminSidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/40 lg:hidden z-20" onClick={onClose} />}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '260px', background: 'white', borderRight: '1px solid #e8d9cc', flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid #e8d9cc' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
              <Coffee size={16} color="white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Monaco Coffee</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1" style={{ color: '#9ca3af' }}><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {navItems.map(({ icon: Icon, label, to }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Back to site */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #e8d9cc' }}>
          <NavLink to="/" className="sidebar-link">
            <Coffee size={18} />
            <span>Trang Khách Hàng</span>
          </NavLink>
          <NavLink to="/pos" className="sidebar-link mt-1">
            <LayoutDashboard size={18} />
            <span>POS Terminal</span>
          </NavLink>
        </div>
      </aside>
    </>
  )
}
