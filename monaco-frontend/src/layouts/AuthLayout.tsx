import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1a0a00 0%, #4a1e00 50%, #6b3f2a 100%)',
      }}
    >
      {/* Left side — branding (chỉ hiện trên màn lớn >= 1024px) */}
      <div
        style={{
          display: 'none',
          flex: '0 0 50%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          color: 'white',
        }}
        className="lg:flex lg:flex-col"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>☕</div>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              marginBottom: '1rem',
              fontFamily: 'Playfair Display, serif',
            }}
          >
            Monaco Coffee
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '2rem', fontFamily: 'Inter, sans-serif' }}>
            Where every cup tells a story
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginTop: '3rem' }}>
            {['Premium Beans', 'Expert Baristas', 'Perfect Ambiance'].map((item) => (
              <div key={item} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 56, height: 56, margin: '0 auto 0.75rem',
                    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>☕</span>
                </div>
                <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              padding: '2rem',
            }}
          >
            {/* Logo nhỏ — chỉ hiện trên mobile */}
            <div
              style={{ textAlign: 'center', marginBottom: '1.5rem' }}
              className="lg:hidden"
            >
              <span style={{ fontSize: '2.5rem' }}>☕</span>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginTop: '0.5rem',
                  fontFamily: 'Playfair Display, serif',
                  color: '#6b3f2a',
                }}
              >
                Monaco Coffee
              </h1>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
