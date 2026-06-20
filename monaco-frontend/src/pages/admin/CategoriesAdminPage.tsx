import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesService } from '../../services/categories.service'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useState } from 'react'

export default function CategoriesAdminPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', image: '' })

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.getAll })
  const categories = data?.data || []

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? categoriesService.update(editing.id, d) : categoriesService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Thành công!'); closeModal() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  })

  const deleteMutation = useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Đã xóa danh mục') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không thể xóa'),
  })

  const openEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '', image: cat.image || '' })
    setShowModal(true)
  }
  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', image: '' }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Danh Mục</h1>
          <p className="mt-1" style={{ color: '#9ca3af' }}>{categories.length} danh mục</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={18} /> Thêm Danh Mục</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '1rem' }} />
          ))
        ) : categories.map((cat: any) => (
          <div key={cat.id} className="card-flat p-5 flex items-center gap-4">
            {cat.image ? (
              <img src={cat.image} alt={cat.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#f4ede6' }}>
                <Tag size={24} style={{ color: '#6b3f2a' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold" style={{ color: '#2d1200' }}>{cat.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{cat.slug}</p>
              <p className="text-sm mt-1 font-semibold" style={{ color: '#6b3f2a' }}>
                {cat._count?.products || 0} sản phẩm
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => openEdit(cat)} className="btn btn-ghost btn-sm p-2"><Pencil size={14} /></button>
              <button onClick={() => { if (confirm(`Xóa danh mục "${cat.name}"?`)) deleteMutation.mutate(cat.id) }}
                className="btn btn-sm p-2" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <h3 className="text-xl font-bold mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              {editing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Tên Danh Mục *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input" placeholder="Cà Phê" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Mô Tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input" style={{ minHeight: '70px', resize: 'none' }}
                  placeholder="Mô tả ngắn về danh mục..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>URL Hình Ảnh</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="input" placeholder="https://..." />
                {form.image && (
                  <img src={form.image} alt="preview" className="mt-2 w-20 h-20 rounded-xl object-cover" />
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn btn-outline flex-1">Hủy</button>
                <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}
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
