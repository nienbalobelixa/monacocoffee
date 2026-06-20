import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productsService } from '../../services/products.service'
import { categoriesService } from '../../services/categories.service'
import { promotionsService } from '../../services/promotions.service'
import { ShoppingCart, ArrowRight, Coffee, Award, Clock } from 'lucide-react'
import { useCartStore } from '../../store/cart.store'
import { toast } from 'sonner'

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ'

export default function HomePage() {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const { data: featuredData } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsService.getFeatured(),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  })

  const { data: promotionsData } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: () => promotionsService.getActive(),
  })

  const featured = featuredData?.data || []
  const categories = categoriesData?.data || []
  const promotions = promotionsData?.data || []

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: Number(product.salePrice || product.price),
      quantity: 1,
    })
    openCart()
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section
        className="hero-gradient relative overflow-hidden"
        style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'url(https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80) center/cover',
            opacity: 0.2,
          }}
        />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: 'rgba(201,169,122,0.2)',
                border: '1px solid rgba(201,169,122,0.4)',
              }}
            >
              <Coffee size={16} style={{ color: '#c9a97a' }} />
              <span className="text-sm font-medium" style={{ color: '#c9a97a' }}>
                Premium Coffee Experience
              </span>
            </div>
            <h1
              className="text-5xl md:text-7xl font-bold text-white mb-6"
              style={{ fontFamily: 'Playfair Display, serif', lineHeight: 1.1 }}
            >
              Thưởng Thức Cà Phê
              <span className="block" style={{ color: '#c9a97a' }}>
                Hoàn Hảo
              </span>
            </h1>
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Mỗi tách cà phê là một câu chuyện. Hãy để chúng tôi kể câu chuyện của
              bạn bằng những hương vị tinh tế nhất.
            </p>
            <div className="flex gap-4">
              <Link to="/menu" className="btn btn-accent btn-lg">
                Xem Thực Đơn <ArrowRight size={18} />
              </Link>
              <Link
                to="/reservations"
                className="btn btn-lg"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                Đặt Bàn
              </Link>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="absolute bottom-10 right-0 left-0">
          <div className="container">
            <div className="flex gap-8 justify-end">
              {[
                { num: '500+', label: 'Khách hàng/ngày' },
                { num: '50+', label: 'Loại cà phê' },
                { num: '5★', label: 'Đánh giá' },
              ].map((s) => (
                <div key={s.num} className="text-center">
                  <p
                    className="text-3xl font-bold"
                    style={{
                      color: '#c9a97a',
                      fontFamily: 'Playfair Display, serif',
                    }}
                  >
                    {s.num}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: '#fdf8f0' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Coffee,
                title: 'Hạt Cà Phê Chọn Lọc',
                desc: 'Nhập khẩu trực tiếp từ Ethiopia, Colombia và Việt Nam',
              },
              {
                icon: Award,
                title: 'Barista Chuyên Nghiệp',
                desc: 'Nghệ nhân được đào tạo quốc tế với hơn 5 năm kinh nghiệm',
              },
              {
                icon: Clock,
                title: 'Không Gian Thư Giãn',
                desc: 'Mở cửa 7:00 - 22:00 mọi ngày, không gian ấm cúng',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="text-center p-8 rounded-2xl"
                style={{
                  background: 'white',
                  boxShadow: '0 2px 16px -2px rgba(107,63,42,0.08)',
                }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}
                >
                  <Icon size={28} color="white" />
                </div>
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="text-center mb-12">
              <h2
                className="text-4xl font-bold mb-3"
                style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
              >
                Danh Mục
              </h2>
              <p style={{ color: '#6b7280' }}>Khám phá thực đơn đa dạng</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`/menu?categoryId=${cat.id}`}
                  className="flex-none flex flex-col items-center gap-3 p-5 rounded-2xl min-w-32 transition-all"
                  style={{
                    background: 'white',
                    border: '2px solid #e8d9cc',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6b3f2a'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e8d9cc'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: '#f4ede6' }}
                    >
                      ☕
                    </div>
                  )}
                  <p
                    className="text-sm font-semibold text-center"
                    style={{ color: '#2d1200' }}
                  >
                    {cat.name}
                  </p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    {cat._count?.products || 0} món
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section" style={{ background: '#fdf8f0' }}>
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2
                  className="text-4xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
                >
                  Món Nổi Bật
                </h2>
                <p className="mt-2" style={{ color: '#6b7280' }}>
                  Lựa chọn yêu thích của khách hàng
                </p>
              </div>
              <Link to="/menu" className="btn btn-outline btn-sm">
                Xem Tất Cả <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map((product: any) => (
                <div key={product.id} className="card product-card overflow-hidden">
                  <div className="relative overflow-hidden" style={{ height: '200px' }}>
                    <img
                      src={
                        product.image ||
                        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'
                      }
                      alt={product.name}
                      className="product-image w-full h-full object-cover"
                    />
                    {product.salePrice && (
                      <span className="absolute top-3 left-3 badge badge-error">
                        Sale
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p
                      className="font-semibold text-sm mb-2 line-clamp-2"
                      style={{ color: '#2d1200' }}
                    >
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        {product.salePrice ? (
                          <div>
                            <p className="font-bold" style={{ color: '#6b3f2a' }}>
                              {formatPrice(Number(product.salePrice))}
                            </p>
                            <p
                              className="text-xs line-through"
                              style={{ color: '#9ca3af' }}
                            >
                              {formatPrice(Number(product.price))}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold" style={{ color: '#6b3f2a' }}>
                            {formatPrice(Number(product.price))}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: '#6b3f2a', color: 'white' }}
                      >
                        <ShoppingCart size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotions Banner */}
      {promotions.length > 0 && (
        <section className="section">
          <div className="container">
            <h2
              className="text-4xl font-bold text-center mb-12"
              style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
            >
              Khuyến Mãi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotions.slice(0, 2).map((promo: any) => (
                <div
                  key={promo.id}
                  className="p-6 rounded-2xl flex items-center gap-5"
                  style={{
                    background: 'linear-gradient(135deg, #6b3f2a, #8b5e3c)',
                    color: 'white',
                  }}
                >
                  <div className="text-5xl">🎉</div>
                  <div>
                    <p
                      className="font-bold text-xl"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {promo.name}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {promo.description}
                    </p>
                    <div
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      <span className="text-sm font-bold">{promo.code}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        className="section"
        style={{ background: 'linear-gradient(135deg, #1a0a00, #4a1e00)' }}
      >
        <div className="container text-center">
          <h2
            className="text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Sẵn Sàng Trải Nghiệm?
          </h2>
          <p className="mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Ghé thăm hoặc đặt bàn trước để có trải nghiệm tốt nhất
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/menu" className="btn btn-accent btn-lg">
              Order Ngay
            </Link>
            <Link
              to="/reservations"
              className="btn btn-lg"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Đặt Bàn
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
