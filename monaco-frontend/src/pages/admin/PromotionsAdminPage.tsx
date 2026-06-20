import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promotionsService } from '../../services/promotions.service'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Gift } from 'lucide-react'
import { toast } from 'sonner'

export default function PromotionsAdminPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', code: '', description: '', type: 'PERCENTAGE', value: 0,
    minOrderAmount: 0, maxDiscount: '', usageLimit: '', startDate: '', endDate: '', isActive: true,
  })

  const { data, isLoading } = useQuery({ queryKey: ['promotions'], queryFn: promotionsService.getAll })
  const promotions = data?.data || []

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? promotionsService.update(editing.id, d) : promotionsService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Thành công!'); closeModal() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  })

  const deleteMutation = useMutation({
    mutationFn: promotionsService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Đã xóa khuyến mãi') },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', code: '', description: '', type: 'PERCENTAGE', value: 0, minOrderAmount: 0, maxDiscount: '', usageLimit: '', startDate: '', endDate: '', isActive: true })
    setShowModal(true)
  }
  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      name: p.name, code: p.code, description: p.description || '', type: p.type,
      value: Number(p.value), minOrderAmount: Number(p.minOrderAmount || 0),
      maxDiscount: p.maxDiscount || '', usageLimit: p.usageLimit || '',
      startDate: p.startDate?.split('T')[0] || '', endDate: p.endDate?.split('T')[0] || '',
      isActive: p.isActive,
    })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleSave = () => {
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
    }
    saveMutation.mutate(payload)
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Khuyến Mãi</h1>
          <p className="mt-1" style={{ color: '#9ca3af' }}>{promotions.length} chương trình</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={18} /> Thêm Khuyến Mãi</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '1rem' }} />
          ))
        ) : promotions.map((promo: any) => (
          <div key={promo.id} className="card-flat p-5 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
              style={{ background: '#6b3f2a', transform: 'translate(30%, -30%)' }} />

            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: promo.isActive ? '#f4ede6' : '#f5f5f5' }}>
                <Gift size={20} style={{ color: promo.isActive ? '#6b3f2a' : '#9ca3af' }} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(promo)} className="btn btn-ghost btn-sm p-2"><Pencil size={13} /></button>
                <button onClick={() => { if (confirm('Xóa khuyến mãi?')) deleteMutation.mutate(promo.id) }}
                  className="btn btn-sm p-2" style={{ color: '#dc2626' }}><Trash2 size={13} /></button>
              </div>
            </div>

            <h3 className="font-bold" style={{ color: '#2d1200' }}>{promo.name}</h3>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: '#6b3f2a', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>{promo.code}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-2xl font-bold" style={{ color: '#6b3f2a' }}>
                  {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `${Number(promo.value).toLocaleString('vi-VN')}đ`}
                </p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  {promo.usedCount || 0}/{promo.usageLimit || '∞'} lượt dùng
                </p>
              </div>
              <span className={`badge ${promo.isActive ? 'badge-success' : 'badge-gray'}`}>
                {promo.isActive ? 'Đang chạy' : 'Tạm dừng'}
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
              {formatDate(promo.startDate)} → {formatDate(promo.endDate)}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              {editing ? 'Sửa Khuyến Mãi' : 'Tạo Khuyến Mãi Mới'}
            </h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Tên *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Mã Code *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" placeholder="MONACO10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Mô Tả</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Loại</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Giá Trị *</label>
                  <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Đơn tối thiểu</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Giảm tối đa</label>
                  <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="input" placeholder="Không giới hạn" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Ngày bắt đầu</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Ngày kết thúc</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Giới hạn sử dụng</label>
                  <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="input" placeholder="Không giới hạn" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-3">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      style={{ accentColor: '#6b3f2a', width: '16px', height: '16px' }} />
                    <span className="text-sm font-medium" style={{ color: '#374151' }}>Kích hoạt ngay</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn btn-outline flex-1">Hủy</button>
                <button onClick={handleSave} disabled={saveMutation.isPending || !form.name || !form.code}
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
