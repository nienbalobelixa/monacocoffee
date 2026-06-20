import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '../../services/products.service'
import { categoriesService } from '../../services/categories.service'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { useState } from 'react'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ'

interface ProductForm {
  name: string
  description: string
  price: number
  salePrice?: number
  categoryId: string
  image: string
  isFeatured: boolean
  isAvailable: boolean
}

export default function ProductsAdminPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    image: '',
    isFeatured: false,
    isAvailable: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => productsService.getAll({ limit: 50, search: search || undefined }),
  })

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.getAll })

  const createMutation = useMutation({
    mutationFn: (d: any) => editing ? productsService.update(editing.id, d) : productsService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success(editing ? 'Cập nhật thành công' : 'Tạo thành công')
      setShowModal(false)
      setEditing(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi'),
  })

  const deleteMutation = useMutation({
    mutationFn: productsService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Xóa thành công')
    },
  })

  const openEdit = (product: any) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : undefined,
      categoryId: product.categoryId,
      image: product.image || '',
      isFeatured: product.isFeatured,
      isAvailable: product.isAvailable,
    })
    setShowModal(true)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: 0, categoryId: '', image: '', isFeatured: false, isAvailable: true })
    setShowModal(true)
  }

  const products = data?.data || []
  const categories = catData?.data || []

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Quản Lý Sản Phẩm</h1>
          <p className="mt-1" style={{ color: '#9ca3af' }}>{products.length} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={18} /> Thêm Sản Phẩm</button>
      </div>

      <div className="card-flat mb-6 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="input pl-10" />
        </div>
      </div>

      <div className="card-flat overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sản Phẩm</th>
              <th>Danh Mục</th>
              <th>Giá</th>
              <th>Trạng Thái</th>
              <th>Nổi Bật</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
            ) : products.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      : <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f4ede6' }}><Package size={16} style={{ color: '#6b3f2a' }} /></div>
                    }
                    <div>
                      <p className="font-medium" style={{ color: '#2d1200' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-primary">{p.category?.name}</span></td>
                <td>
                  <p className="font-semibold" style={{ color: '#6b3f2a' }}>{formatPrice(Number(p.salePrice || p.price))}</p>
                  {p.salePrice && <p className="text-xs line-through" style={{ color: '#9ca3af' }}>{formatPrice(Number(p.price))}</p>}
                </td>
                <td><span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-error'}`}>{p.isAvailable ? 'Hoạt động' : 'Ẩn'}</span></td>
                <td><span className={`badge ${p.isFeatured ? 'badge-warning' : 'badge-gray'}`}>{p.isFeatured ? 'Nổi bật' : 'Thường'}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm('Xóa sản phẩm?')) deleteMutation.mutate(p.id) }} className="btn btn-sm" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="overlay" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              {editing ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Tên Sản Phẩm *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Cà Phê Sữa" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Mô Tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input" style={{ minHeight: '70px', resize: 'none' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Giá *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Giá Sale</label>
                  <input type="number" value={form.salePrice || ''} onChange={(e) => setForm({ ...form, salePrice: e.target.value ? Number(e.target.value) : undefined })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Danh Mục *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
                  <option value="">Chọn danh mục</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>URL Hình Ảnh</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  <span className="text-sm" style={{ color: '#374151' }}>Nổi bật</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
                  <span className="text-sm" style={{ color: '#374151' }}>Hoạt động</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn btn-outline flex-1">Hủy</button>
                <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn btn-primary flex-1">
                  {createMutation.isPending ? 'Saving...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
