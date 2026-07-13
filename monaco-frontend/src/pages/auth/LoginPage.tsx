import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const from = (location.state as any)?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const r = await authService.login(data)
      setAuth(r.user, r.accessToken, r.refreshToken)
      toast.success(`Chào mừng, ${r.user?.fullName || 'bạn'}!`)
      if (['ADMIN', 'MANAGER'].includes(r.user?.role)) navigate('/admin/dashboard')
      else if (r.user?.role === 'STAFF') navigate('/pos')
      else navigate(from)
    } catch (err: any) {
      let msg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại'
      if (err?.code === 'ECONNABORTED' || msg.includes('timeout')) {
        msg = 'Server đang khởi động, vui lòng thử lại sau 30 giây...'
      } else if (err?.code === 'ERR_NETWORK' || !err?.response) {
        msg = 'Không kết nối được server. Kiểm tra mạng và thử lại!'
      }
      toast.error(msg)
    }
  }

  return (
    <div>
      <h2
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
      >
        Đăng Nhập
      </h2>
      <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
        Chuyên trang cà phê cao cấp
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#374151' }}
          >
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="ten@example.com"
            className="input"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#374151' }}
          >
            Mật Khẩu
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••"
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9ca3af' }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full justify-center mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Đang xử lý...
            </>
          ) : (
            'Đăng Nhập'
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: '#9ca3af' }}>
        Chưa có tài khoản?{' '}
        <Link
          to="/auth/register"
          style={{ color: '#6b3f2a', fontWeight: 600, textDecoration: 'none' }}
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
