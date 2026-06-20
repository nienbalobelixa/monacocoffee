import { useCartStore } from '../../store/cart.store'
import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react'
import { useState } from 'react'
import { promotionsService } from '../../services/promotions.service'
import { toast } from 'sonner'

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore()
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState('')

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    try {
      const res = await promotionsService.validate(promoCode.trim().toUpperCase())
      const data = res.data || res
      if (!data.valid) {
        toast.error(data.message || 'Mã khuyến mãi không hợp lệ')
        return
      }
      const promo = data.promotion
      let d = 0
      const subtotal = getTotalPrice()
      if (promo.type === 'PERCENTAGE') {
        d = subtotal * (Number(promo.value) / 100)
        if (promo.maxDiscount) d = Math.min(d, Number(promo.maxDiscount))
      } else if (promo.type === 'FIXED_AMOUNT') {
        d = Math.min(Number(promo.value), subtotal)
      }
      setDiscount(d)
      setPromoApplied(promoCode.toUpperCase())
      toast.success(`Áp dụng mã thành công! Giảm ${formatPrice(d)}`)
    } catch {
      toast.error('Mã khuyến mãi không hợp lệ')
    }
  }

  const removePromo = () => {
    setDiscount(0)
    setPromoApplied('')
    setPromoCode('')
  }

  const subtotal = getTotalPrice()
  const total = Math.max(0, subtotal - discount)

  if (items.length === 0) return (
    <div className="section">
      <div className="container">
        <div className="text-center py-24">
          <ShoppingBag size={80} className="mx-auto mb-6" style={{ color: '#e8d9cc' }} />
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
            Giỏ hàng trống
          </h2>
          <p className="mb-8" style={{ color: '#6b7280' }}>Hãy chọn món yêu thích từ thực đơn của chúng tôi</p>
          <Link to="/menu" className="btn btn-primary btn-lg">
            Xem Thực Đơn
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="section">
      <div className="container">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/menu" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
            Giỏ Hàng ({items.reduce((s, i) => s + i.quantity, 0)} món)
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => (
              <div key={item.id} className="card-flat flex gap-4 p-5">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
                    style={{ background: '#f4ede6' }}>☕</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg" style={{ color: '#2d1200' }}>{item.name}</p>
                  <p className="font-bold mt-1" style={{ color: '#6b3f2a' }}>{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                      style={{ background: '#e8d9cc', color: '#6b3f2a' }}>−</button>
                    <span className="font-bold text-lg w-8 text-center" style={{ color: '#2d1200' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                      style={{ background: '#6b3f2a', color: 'white' }}>+</button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  <button onClick={() => removeItem(item.productId)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    style={{ color: '#dc2626' }}>
                    <Trash2 size={18} />
                  </button>
                  <p className="font-bold text-lg" style={{ color: '#6b3f2a' }}>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="btn btn-ghost btn-sm self-start"
              style={{ color: '#dc2626' }}>
              <Trash2 size={14} /> Xóa tất cả
            </button>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card-flat p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
                Tóm Tắt Đơn Hàng
              </h3>

              <div className="flex flex-col gap-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span style={{ color: '#6b7280' }}>{item.name} ×{item.quantity}</span>
                    <span style={{ color: '#2d1200' }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-5">
                {promoApplied ? (
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
                    <div className="flex items-center gap-2">
                      <Tag size={14} style={{ color: '#166534' }} />
                      <span className="text-sm font-bold" style={{ color: '#166534' }}>{promoApplied}</span>
                      <span className="text-sm" style={{ color: '#166534' }}>-{formatPrice(discount)}</span>
                    </div>
                    <button onClick={removePromo} className="text-xs" style={{ color: '#dc2626' }}>Xóa</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Mã khuyến mãi" className="input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && applyPromo()} />
                    <button onClick={applyPromo} className="btn btn-outline btn-sm">Áp dụng</button>
                  </div>
                )}
              </div>

              <div className="divider" />

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>Tạm tính</span>
                  <span style={{ color: '#2d1200' }}>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: '#16a34a' }}>Giảm giá</span>
                    <span style={{ color: '#16a34a' }}>-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-xl mb-6">
                <span style={{ color: '#2d1200' }}>Tổng cộng</span>
                <span style={{ color: '#6b3f2a' }}>{formatPrice(total)}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary w-full justify-center btn-lg">
                Tiến Hành Thanh Toán
              </Link>
              <Link to="/menu" className="btn btn-outline w-full justify-center mt-3">
                <ArrowLeft size={16} /> Tiếp Tục Mua Sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
