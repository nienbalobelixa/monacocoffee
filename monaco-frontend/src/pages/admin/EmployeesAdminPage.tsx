import { useQuery } from '@tanstack/react-query'
import { employeesService } from '../../services/employees.service'
import { Search, UserCheck } from 'lucide-react'
import { useState } from 'react'

export default function EmployeesAdminPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => employeesService.getAll({ search: search || undefined }),
  })
  const employees = data?.data || []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
          Quản Lý Nhân Viên
        </h1>
        <p className="mt-1" style={{ color: '#9ca3af' }}>{employees.length} nhân viên</p>
      </div>

      <div className="card-flat p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhân viên..." className="input pl-9" />
        </div>
      </div>

      <div className="card-flat overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nhân Viên</th>
              <th>Mã NV</th>
              <th>Phòng Ban</th>
              <th>Chức Vụ</th>
              <th>Lương</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="text-center py-16">
                    <UserCheck size={48} className="mx-auto mb-3" style={{ color: '#e8d9cc' }} />
                    <p style={{ color: '#9ca3af' }}>Chưa có nhân viên nào</p>
                  </div>
                </td>
              </tr>
            ) : employees.map((emp: any) => (
              <tr key={emp.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
                      {emp.user?.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#2d1200' }}>{emp.user?.fullName}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>{emp.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td><span className="font-mono text-sm" style={{ color: '#6b3f2a' }}>{emp.employeeCode}</span></td>
                <td style={{ color: '#6b7280' }}>{emp.department || '—'}</td>
                <td style={{ color: '#2d1200' }}>{emp.position || '—'}</td>
                <td className="font-semibold" style={{ color: '#6b3f2a' }}>
                  {emp.salary ? Number(emp.salary).toLocaleString('vi-VN') + 'đ' : '—'}
                </td>
                <td>
                  <span className={`badge ${emp.user?.isActive ? 'badge-success' : 'badge-error'}`}>
                    {emp.user?.isActive ? 'Hoạt động' : 'Nghỉ việc'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
