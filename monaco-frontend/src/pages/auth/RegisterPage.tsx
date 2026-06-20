import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const schema = z
  .object({
    fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const { confirmPassword: _cp, ...registerData } = data
      const r = await authService.register(registerData)
      setAuth(r.user, r.accessToken, r.refreshToken)
      toast.success('Đăng ký thành công! Chào mừng bạn đến với Monaco Coffee ☕')
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đăng ký thất bại'
      toast.error(msg)
    }
  }

  const fields = [
    { name: 'fullName', label: 'Họ và Tên', type: 'text', placeholder: 'Nguyễn Văn A' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'ten@example.com' },
    { name: 'phone', label: 'Số Điện Thoại', type: 'tel', placeholder: '0123 456 789' },
    { name: 'password', label: 'Mật Khẩu', type: 'password', placeholder: '••••••' },
    {
      name: 'confirmPassword',
      label: 'Xác Nhận Mật Khẩu',
      type: 'password',
      placeholder: '••••••',
    },
  ] as const

  return (
    <div>
      <h2
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}
      >
        Tạo Tài Khoản
      </h2>
      <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
        Tham gia cộng đồng Monaco Coffee
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {fields.map(({ name, label, type, placeholder }) => (
          <div key={name}>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#374151' }}
            >
              {label}
            </label>
            <input
              {...register(name)}
              type={type}
              placeholder={placeholder}
              className="input"
            />
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">
                {(errors[name] as any)?.message}
              </p>
            )}
          </div>
        ))}
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
            'Đăng Ký'
          )}
        </button>
      </form>
      <p className="text-center text-sm mt-6" style={{ color: '#9ca3af' }}>
        Đã có tài khoản?{' '}
        <Link
          to="/auth/login"
          style={{ color: '#6b3f2a', fontWeight: 600, textDecoration: 'none' }}
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
