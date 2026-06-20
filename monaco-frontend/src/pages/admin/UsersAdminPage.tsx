import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../../services/users.service'
import { useState } from 'react'
import { Search, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

const roleColors: Record<string, string> = {
  ADMIN: '#dc2626', MANAGER: '#9333ea', STAFF: '#2563eb', CUSTOMER: '#16a34a'
}

export default function UsersAdminPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role],
    queryFn: () => usersService.getAll({ search: search || undefined, role: role || undefined, limit: 50 }),
  })

  const toggleMutation = useMutation({
    mutationFn: usersService.toggleActive,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Cập nhật thành công') },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const users = data?.data || []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
          Quản Lý Người Dùng
        </h1>
        <p className="mt-1" style={{ color: '#9ca3af' }}>{users.length} người dùng</p>
      </div>

      {/* Filters */}
      <div className="card-flat p-4 mb-6 flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email..." className="input pl-9 text-sm" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      <div className="card-flat overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Người Dùng</th>
              <th>Số ĐT</th>
              <th>Vai Trò</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10" style={{ color: '#9ca3af' }}>Không tìm thấy người dùng</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
                      {u.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#2d1200' }}>{u.fullName}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#6b7280', fontSize: '0.875rem' }}>{u.phone || '—'}</td>
                <td>
                  <span className="badge font-semibold" style={{
                    background: roleColors[u.role] + '20',
                    color: roleColors[u.role],
                  }}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                    {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="text-sm" style={{ color: '#9ca3af' }}>
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <button
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending}
                    className={`btn btn-sm flex items-center gap-1 ${u.isActive ? '' : 'btn-primary'}`}
                    style={u.isActive ? { color: '#dc2626', border: '1px solid #fca5a5' } : {}}>
                    {u.isActive ? <><UserX size={13} /> Vô hiệu hóa</> : <><UserCheck size={13} /> Kích hoạt</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
