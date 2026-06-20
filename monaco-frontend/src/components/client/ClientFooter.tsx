import { Link } from 'react-router-dom'
import { Coffee, MapPin, Phone, Mail, Share2, Globe } from 'lucide-react'

export default function ClientFooter() {
  return (
    <footer style={{ background: '#1a0a00', color: 'rgba(255,255,255,0.85)' }}>
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Coffee size={28} style={{ color: '#c9a97a' }} />
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Monaco Coffee</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Không gian cà phê cao cấp, nơi mỗi tách cà phê là một trải nghiệm đáng nhớ.
              Thưởng thức hương vị tinh tế từ những hạt cà phê tốt nhất thế giới.
            </p>
            <div className="flex gap-4">
              {[Share2, Globe].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,122,0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <Icon size={18} style={{ color: '#c9a97a' }} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Khám Phá</h4>
            <div className="flex flex-col gap-3">
              {[{ to: '/menu', label: 'Thực Đơn' }, { to: '/reservations', label: 'Đặt Bàn' }, { to: '/orders', label: 'Đơn Hàng' }].map((l) => (
                <Link key={l.to} to={l.to} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a97a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Liên Hệ</h4>
            <div className="flex flex-col gap-3">
              {[
                { Icon: MapPin, text: '123 Đường Cà Phê, TP.HCM' },
                { Icon: Phone, text: '0123 456 789' },
                { Icon: Mail, text: 'hello@monaco.vn' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  <Icon size={14} style={{ color: '#c9a97a' }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container py-6">
          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2025 Monaco Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
