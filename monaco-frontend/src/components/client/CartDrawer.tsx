import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/cart.store'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore()

  if (!isOpen) return null

  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ'

  return (
    <div className="cart-drawer animate-slide-in" style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e8d9cc' }}>
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} style={{ color: '#6b3f2a' }} />
          <h2 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
            Giỏ Hàng ({getTotalItems()})
          </h2>
        </div>
        <button onClick={closeCart} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#6b7280' }}>
          <X size={20} />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-5">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">☕</div>
            <p className="font-semibold" style={{ color: '#6b3f2a' }}>Giỏ hàng trống</p>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Hãy chọn món yêu thích của bạn</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl" style={{ background: '#fdf9f6', border: '1px solid #e8d9cc' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: '#2d1200' }}>{item.name}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#6b3f2a' }}>{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: '#e8d9cc', color: '#6b3f2a' }}>
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center" style={{ color: '#2d1200' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: '#6b3f2a', color: 'white' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(item.productId)}
                    className="p-1 rounded transition-colors hover:bg-red-50" style={{ color: '#dc2626' }}>
                    <Trash2 size={14} />
                  </button>
                  <p className="text-sm font-bold" style={{ color: '#6b3f2a' }}>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="p-5" style={{ borderTop: '1px solid #e8d9cc' }}>
          <div className="flex justify-between mb-4">
            <span className="font-semibold" style={{ color: '#6b7280' }}>Tổng cộng</span>
            <span className="font-bold text-xl" style={{ color: '#6b3f2a' }}>{formatPrice(getTotalPrice())}</span>
          </div>
          <Link to="/checkout" onClick={closeCart} className="btn btn-primary w-full justify-center">
            Thanh Toán
          </Link>
        </div>
      )}
    </div>
  )
}
