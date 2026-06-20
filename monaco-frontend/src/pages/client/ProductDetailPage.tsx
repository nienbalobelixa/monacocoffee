import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsService } from '../../services/products.service'
import { useCartStore } from '../../store/cart.store'
import { toast } from 'sonner'
import { ShoppingCart, Star, ArrowLeft, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const [qty, setQty] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsService.getBySlug(slug!),
    enabled: !!slug,
  })

  const product = data?.data

  if (isLoading) return (
    <div className="section">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="skeleton" style={{ height: '400px', borderRadius: '1rem' }} />
          <div className="flex flex-col gap-4">
            <div className="skeleton h-8 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="section">
      <div className="container text-center py-20">
        <p className="text-5xl mb-4">☕</p>
        <p style={{ color: '#6b7280' }}>Không tìm thấy sản phẩm</p>
        <Link to="/menu" className="btn btn-primary mt-4">Về Thực Đơn</Link>
      </div>
    </div>
  )

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: Number(product.salePrice || product.price),
      quantity: qty,
    })
    openCart()
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`)
  }

  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : 0

  return (
    <div className="section">
      <div className="container">
        <Link to="/menu" className="btn btn-ghost btn-sm mb-8" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Quay lại thực đơn
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden" style={{ height: '450px' }}>
            <img
              src={product.image || 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div>
            <span className="badge badge-primary mb-4">{product.category?.name}</span>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviews?.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(avgRating) ? '#f59e0b' : 'none'}
                      style={{ color: i < Math.round(avgRating) ? '#f59e0b' : '#d1d5db' }} />
                  ))}
                </div>
                <span className="text-sm" style={{ color: '#6b7280' }}>
                  {avgRating.toFixed(1)} ({product.reviews.length} đánh giá)
                </span>
              </div>
            )}

            <p className="mb-6 leading-relaxed" style={{ color: '#6b7280' }}>{product.description}</p>

            {/* Price */}
            <div className="mb-8 p-4 rounded-xl" style={{ background: '#fdf8f0' }}>
              {product.salePrice ? (
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold" style={{ color: '#6b3f2a' }}>
                    {formatPrice(Number(product.salePrice))}
                  </span>
                  <div>
                    <span className="text-xl line-through" style={{ color: '#9ca3af' }}>
                      {formatPrice(Number(product.price))}
                    </span>
                    <span className="ml-2 badge badge-error">
                      -{Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-4xl font-bold" style={{ color: '#6b3f2a' }}>
                  {formatPrice(Number(product.price))}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium" style={{ color: '#374151' }}>Số lượng:</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: '#e8d9cc', color: '#6b3f2a' }}>−</button>
                <span className="font-bold text-xl w-8 text-center" style={{ color: '#2d1200' }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: '#6b3f2a', color: 'white' }}>+</button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn btn-primary btn-lg flex-1">
                <ShoppingCart size={20} /> Thêm Vào Giỏ ({formatPrice(Number(product.salePrice || product.price) * qty)})
              </button>
              <button className="btn btn-outline" style={{ padding: '0.875rem' }}>
                <Heart size={20} />
              </button>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-6 flex-wrap">
              {product.isAvailable && <span className="badge badge-success">Còn hàng</span>}
              {product.isFeatured && <span className="badge badge-warning">⭐ Nổi bật</span>}
              {product.salePrice && <span className="badge badge-error">🔥 Đang sale</span>}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
              Đánh Giá ({product.reviews.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map((review: any) => (
                <div key={review.id} className="card-flat p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
                      {review.user?.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm" style={{ color: '#2d1200' }}>{review.user?.fullName}</p>
                        <span className="text-xs" style={{ color: '#9ca3af' }}>
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} fill={i < review.rating ? '#f59e0b' : 'none'}
                            style={{ color: i < review.rating ? '#f59e0b' : '#d1d5db' }} />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm" style={{ color: '#6b7280' }}>{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
