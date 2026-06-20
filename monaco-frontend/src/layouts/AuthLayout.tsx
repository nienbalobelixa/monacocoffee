import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #4a1e00 50%, #6b3f2a 100%)' }}>
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white">
        <div className="text-center">
          <div className="text-6xl mb-6">☕</div>
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Monaco Coffee
          </h1>
          <p className="text-xl opacity-80 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Where every cup tells a story
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12">
            {['Premium Beans', 'Expert Baristas', 'Perfect Ambiance'].map((item) => (
              <div key={item} className="text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <span className="text-2xl">☕</span>
                </div>
                <p className="text-sm opacity-70">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8 lg:hidden">
              <span className="text-4xl">☕</span>
              <h1 className="text-2xl font-bold mt-2" style={{ fontFamily: 'Playfair Display, serif', color: '#6b3f2a' }}>Monaco Coffee</h1>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
