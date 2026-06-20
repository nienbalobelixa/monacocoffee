import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesService } from '../../services/tables.service'
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: '#dcfce7', text: '#166534', label: 'Trống' },
  OCCUPIED: { bg: '#fee2e2', text: '#991b1b', label: 'Đang dùng' },
  RESERVED: { bg: '#fef9c3', text: '#854d0e', label: 'Đã đặt' },
  CLEANING: { bg: '#f3e8ff', text: '#6b21a8', label: 'Vệ sinh' },
}

export default function TablesAdminPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', number: 1, capacity: 4, location: '', note: '' })

  const { data, isLoading } = useQuery({ queryKey: ['tables'], queryFn: tablesService.getAll })
  const tables = data?.data || []

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? tablesService.update(editing.id, d) : tablesService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('Thành công!'); closeModal() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  })

  const deleteMutation = useMutation({
    mutationFn: tablesService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('Đã xóa bàn') },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tablesService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('Cập nhật trạng thái') },
  })

  const openCreate = () => { setEditing(null); setForm({ name: '', number: tables.length + 1, capacity: 4, location: '', note: '' }); setShowModal(true) }
  const openEdit = (t: any) => { setEditing(t); setForm({ name: t.name, number: t.number, capacity: t.capacity, location: t.location || '', note: t.note || '' }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Quản Lý Bàn</h1>
          <p className="mt-1" style={{ color: '#9ca3af' }}>{tables.length} bàn</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={18} /> Thêm Bàn</button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(statusColors).map(([status, { bg, text, label }]) => {
          const count = tables.filter((t: any) => t.status === status).length
          return (
            <div key={status} className="card-flat p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: text }}>{count}</p>
              <span className="badge text-xs" style={{ background: bg, color: text }}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Table grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '1rem' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table: any) => {
            const { bg, text, label } = statusColors[table.status] || statusColors.AVAILABLE
            return (
              <div key={table.id} className="card-flat p-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl" style={{ background: text }} />
                <p className="text-3xl font-bold mt-1" style={{ color: text }}>B{table.number}</p>
                <p className="text-xs font-medium mt-1" style={{ color: '#9ca3af' }}>{table.location || 'Tầng 1'}</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>👥 {table.capacity} người</p>
                <span className="badge text-xs mt-2" style={{ background: bg, color: text }}>{label}</span>

                {/* Quick status change */}
                <select
                  value={table.status}
                  onChange={(e) => statusMutation.mutate({ id: table.id, status: e.target.value })}
                  className="w-full mt-3 text-xs rounded-lg border px-2 py-1"
                  style={{ borderColor: '#e8d9cc', color: '#6b7280' }}>
                  {Object.entries(statusColors).map(([s, { label: l }]) => (
                    <option key={s} value={s}>{l}</option>
                  ))}
                </select>

                <div className="flex gap-1 mt-2">
                  <button onClick={() => openEdit(table)} className="btn btn-ghost btn-sm flex-1 p-1 text-xs"><Pencil size={11} /></button>
                  <button onClick={() => { if (confirm(`Xóa bàn ${table.number}?`)) deleteMutation.mutate(table.id) }}
                    className="btn btn-sm flex-1 p-1 text-xs" style={{ color: '#dc2626' }}><Trash2 size={11} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <h3 className="text-xl font-bold mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              {editing ? 'Sửa Bàn' : 'Thêm Bàn Mới'}
            </h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Số Bàn *</label>
                  <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value), name: `Bàn ${e.target.value}` })} className="input" min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Sức Chứa *</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="input" min={1} max={20} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Tên Bàn</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder={`Bàn ${form.number}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Vị Trí</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" placeholder="Tầng 1, Sân vườn..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn btn-outline flex-1">Hủy</button>
                <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
                  className="btn btn-primary flex-1">
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
