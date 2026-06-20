import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { productsService } from '../../services/products.service'
import { categoriesService } from '../../services/categories.service'
import { useCartStore } from '../../store/cart.store'
import { toast } from 'sonner'
import { Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ'

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const categoryId = searchParams.get('categoryId') || ''
  const page = Number(searchParams.get('page') || 1)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  })
  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, categoryId, search }],
    queryFn: () =>
      productsService.getAll({
        page,
        limit: 12,
        categoryId: categoryId || undefined,
        search: search || undefined,
      }),
  })

  const categories = categoriesData?.data || []
  const products = data?.data || []
  const meta = data?.meta

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: Number(product.salePrice || product.price),
      quantity: 1,
    })
    openCart()
    toast.success(`Đã thêm ${product.name}`)
  }

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
          >
            Thực Đơn
          </h1>
          <p style={{ color: '#6b7280' }}>Khám phá hơn 50 loại thức uống tinh tế</p>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9ca3af' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm món..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
          <button
            onClick={() => setSearchParams({})}
            className={`btn btn-sm flex-none ${!categoryId ? 'btn-primary' : 'btn-outline'}`}
          >
            Tất cả
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ categoryId: cat.id })}
              className={`btn btn-sm flex-none ${
                categoryId === cat.id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: '200px' }} />
                <div className="p-4">
                  <div className="skeleton h-4 mb-2 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">☕</p>
            <p className="font-semibold" style={{ color: '#6b3f2a' }}>
              Không tìm thấy sản phẩm
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="card product-card">
                <Link to={`/menu/${product.slug}`}>
                  <div className="overflow-hidden" style={{ height: '180px' }}>
                    <img
                      src={
                        product.image ||
                        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'
                      }
                      alt={product.name}
                      className="product-image w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/menu/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <p
                      className="font-semibold mb-1 line-clamp-2"
                      style={{ color: '#2d1200' }}
                    >
                      {product.name}
                    </p>
                    <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                      {product.category?.name}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold" style={{ color: '#6b3f2a' }}>
                        {formatPrice(Number(product.salePrice || product.price))}
                      </p>
                      {product.salePrice && (
                        <p className="text-xs line-through" style={{ color: '#9ca3af' }}>
                          {formatPrice(Number(product.price))}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      style={{ background: '#6b3f2a', color: 'white' }}
                    >
                      <ShoppingCart size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() =>
                  setSearchParams({
                    page: String(p),
                    ...(categoryId ? { categoryId } : {}),
                  })
                }
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
