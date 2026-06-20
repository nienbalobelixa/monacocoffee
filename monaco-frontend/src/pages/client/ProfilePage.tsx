import { useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { usersService } from '../../services/users.service'
import { toast } from 'sonner'
import { User, Lock, Package, Save, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ordersService } from '../../services/orders.service'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'password' | 'orders'>('profile')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersService.getMyOrders({ limit: 5 }),
    enabled: tab === 'orders',
  })
  const recentOrders = ordersData?.data || []

  const updateMutation = useMutation({
    mutationFn: (data: object) => usersService.updateProfile(data),
    onSuccess: (res) => {
      const u = res.data || res
      setUser({ ...user!, ...u })
      toast.success('Cập nhật thành công!')
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      usersService.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      setOldPassword('')
      setNewPassword('')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Mật khẩu cũ không đúng'),
  })

  const tabs = [
    { id: 'profile', label: 'Thông Tin', icon: User },
    { id: 'password', label: 'Mật Khẩu', icon: Lock },
    { id: 'orders', label: 'Đơn Hàng', icon: Package },
  ] as const

  const roleColors: Record<string, string> = {
    ADMIN: '#dc2626',
    MANAGER: '#9333ea',
    STAFF: '#2563eb',
    CUSTOMER: '#16a34a',
  }

  return (
    <div className="section">
      <div className="container max-w-3xl">
        {/* Profile Header */}
        <div className="card-flat p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
                {user?.fullName}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>{user?.email}</p>
              <span className="badge mt-2 font-semibold" style={{
                background: roleColors[user?.role || 'CUSTOMER'] + '20',
                color: roleColors[user?.role || 'CUSTOMER'],
              }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`btn btn-sm flex items-center gap-2 ${tab === id ? 'btn-primary' : 'btn-outline'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card-flat p-6">
            <h2 className="font-bold text-lg mb-5" style={{ color: '#2d1200' }}>Thông Tin Cá Nhân</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email</label>
                <input value={user?.email || ''} disabled className="input opacity-60" />
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Email không thể thay đổi</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Họ và Tên</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Số Điện Thoại</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" type="tel" />
              </div>
              <button
                onClick={() => updateMutation.mutate({ fullName, phone })}
                disabled={updateMutation.isPending}
                className="btn btn-primary justify-center">
                {updateMutation.isPending ? 'Đang lưu...' : <><Save size={16} /> Lưu Thay Đổi</>}
              </button>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <div className="card-flat p-6">
            <h2 className="font-bold text-lg mb-5" style={{ color: '#2d1200' }}>Đổi Mật Khẩu</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Mật Khẩu Hiện Tại</label>
                <div className="relative">
                  <input value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                    type={showOld ? 'text' : 'password'} className="input pr-10" placeholder="••••••" />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Mật Khẩu Mới</label>
                <div className="relative">
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    type={showNew ? 'text' : 'password'} className="input pr-10" placeholder="••••••" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-red-500 mt-1">Mật khẩu tối thiểu 6 ký tự</p>
                )}
              </div>
              <button
                onClick={() => passwordMutation.mutate({ oldPassword, newPassword })}
                disabled={passwordMutation.isPending || !oldPassword || newPassword.length < 6}
                className="btn btn-primary justify-center">
                {passwordMutation.isPending ? 'Đang lưu...' : <><Lock size={16} /> Đổi Mật Khẩu</>}
              </button>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="card-flat">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e8d9cc' }}>
              <h2 className="font-bold text-lg" style={{ color: '#2d1200' }}>Đơn Hàng Gần Đây</h2>
              <Link to="/orders" className="text-sm font-medium" style={{ color: '#6b3f2a', textDecoration: 'none' }}>
                Xem tất cả →
              </Link>
            </div>
            <div className="divide-y" style={{ '--tw-divide-color': '#f5f0eb' } as any}>
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={40} className="mx-auto mb-3" style={{ color: '#e8d9cc' }} />
                  <p style={{ color: '#9ca3af' }}>Chưa có đơn hàng nào</p>
                </div>
              ) : recentOrders.map((order: any) => (
                <Link key={order.id} to={`/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-amber-50/50 transition-colors"
                  style={{ textDecoration: 'none' }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#2d1200' }}>#{order.orderNumber}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                      {order.items?.length} món • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: '#6b3f2a' }}>
                      {Number(order.total).toLocaleString('vi-VN')}đ
                    </p>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
