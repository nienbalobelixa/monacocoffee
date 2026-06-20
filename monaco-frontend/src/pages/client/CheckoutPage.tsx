import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'
import { ordersService } from '../../services/orders.service'
import { toast } from 'sonner'
import { Loader2, MapPin, CreditCard, Banknote, QrCode, ChevronRight } from 'lucide-react'

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ'

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  const [orderType, setOrderType] = useState<'ONLINE' | 'TAKEAWAY' | 'DELIVERY'>('ONLINE')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const subtotal = getTotalPrice()

  const handleCheckout = async () => {
    if (items.length === 0) { toast.error('Giỏ hàng trống!'); return }
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng')
      return
    }
    setLoading(true)
    try {
      const res = await ordersService.create({
        type: orderType,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note })),
        note: note || undefined,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
      })
      const order = res.data || res
      clearCart()
      toast.success('🎉 Đặt hàng thành công!')
      navigate(`/orders/${order.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="section">
      <div className="container">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
          Thanh Toán
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Customer Info */}
            {isAuthenticated && (
              <div className="card-flat p-6">
                <h3 className="font-bold mb-4" style={{ color: '#2d1200' }}>Thông Tin Khách Hàng</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fdf8f0' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
                    {user?.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#2d1200' }}>{user?.fullName}</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Type */}
            <div className="card-flat p-6">
              <h3 className="font-bold mb-4" style={{ color: '#2d1200' }}>Hình Thức Đặt Hàng</h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'ONLINE', label: 'Tại Quán', icon: '🪑', desc: 'Ngồi thưởng thức' },
                  { value: 'TAKEAWAY', label: 'Mang Đi', icon: '🥡', desc: 'Đến lấy tại quầy' },
                  { value: 'DELIVERY', label: 'Giao Hàng', icon: '🛵', desc: 'Giao tận nơi' },
                ] as const).map(({ value, label, icon, desc }) => (
                  <button key={value} onClick={() => setOrderType(value)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: orderType === value ? '#f4ede6' : 'white',
                      border: `2px solid ${orderType === value ? '#6b3f2a' : '#e8d9cc'}`,
                    }}>
                    <span className="text-2xl block mb-1">{icon}</span>
                    <p className="font-semibold text-sm" style={{ color: '#2d1200' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{desc}</p>
                  </button>
                ))}
              </div>

              {orderType === 'DELIVERY' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                    <MapPin size={14} className="inline mr-1" />Địa chỉ giao hàng *
                  </label>
                  <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="input" placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="card-flat p-6">
              <h3 className="font-bold mb-4" style={{ color: '#2d1200' }}>Phương Thức Thanh Toán</h3>
              <div className="flex flex-col gap-3">
                {[
                  { value: 'CASH', label: 'Tiền Mặt (COD)', desc: 'Thanh toán khi nhận hàng', Icon: Banknote },
                  { value: 'BANK_TRANSFER', label: 'Chuyển Khoản', desc: 'Vietcombank / Techcombank / MB Bank', Icon: CreditCard },
                  { value: 'QR_CODE', label: 'QR Banking', desc: 'Quét mã QR thanh toán nhanh', Icon: QrCode },
                ].map(({ value, label, desc, Icon }) => (
                  <label key={value} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: paymentMethod === value ? '#f4ede6' : 'white',
                      border: `2px solid ${paymentMethod === value ? '#6b3f2a' : '#e8d9cc'}`,
                    }}>
                    <input type="radio" name="payment" value={value}
                      checked={paymentMethod === value} onChange={() => setPaymentMethod(value)}
                      style={{ accentColor: '#6b3f2a' }} />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: paymentMethod === value ? '#6b3f2a' : '#f4ede6' }}>
                      <Icon size={20} color={paymentMethod === value ? 'white' : '#6b3f2a'} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#2d1200' }}>{label}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="card-flat p-6">
              <h3 className="font-bold mb-4" style={{ color: '#2d1200' }}>Ghi Chú</h3>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                className="input" style={{ minHeight: '80px', resize: 'none' }}
                placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm..." />
            </div>
          </div>

          {/* Right — summary */}
          <div>
            <div className="card-flat p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
                Đơn Hàng
              </h3>

              <div className="flex flex-col gap-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <span className="badge badge-primary text-xs">{item.quantity}×</span>
                      <span className="text-sm" style={{ color: '#2d1200' }}>{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold flex-shrink-0 ml-2" style={{ color: '#6b3f2a' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="flex justify-between font-bold text-xl mb-6">
                <span style={{ color: '#2d1200' }}>Tổng cộng</span>
                <span style={{ color: '#6b3f2a' }}>{formatPrice(subtotal)}</span>
              </div>

              <button onClick={handleCheckout} disabled={loading || items.length === 0}
                className="btn btn-primary w-full justify-center btn-lg">
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
                  : <>Xác Nhận Đặt Hàng <ChevronRight size={18} /></>}
              </button>

              <p className="text-xs text-center mt-3" style={{ color: '#9ca3af' }}>
                Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của Monaco Coffee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
