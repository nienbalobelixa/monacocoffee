import { useForm } from 'react-hook-form'
import { reservationsService } from '../../services/reservations.service'
import { toast } from 'sonner'
import { CalendarClock, Users, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function ReservationsPage() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm()

  const onSubmit = async (data: any) => {
    try {
      await reservationsService.create({
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestCount: Number(data.guestCount),
        date: new Date(data.date),
        startTime: new Date(`${data.date}T${data.time}:00`),
        note: data.note || undefined,
      })
      setSubmitted(true)
      reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    }
  }

  if (submitted) return (
    <div className="section">
      <div className="container max-w-lg text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: '#dcfce7' }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a' }} />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
          Đặt Bàn Thành Công!
        </h2>
        <p className="mb-8" style={{ color: '#6b7280' }}>
          Chúng tôi đã nhận được yêu cầu của bạn và sẽ xác nhận qua điện thoại trong vòng 30 phút.
        </p>
        <button onClick={() => setSubmitted(false)} className="btn btn-primary btn-lg">
          Đặt Thêm
        </button>
      </div>
    </div>
  )

  return (
    <div className="section">
      <div className="container">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6b3f2a, #c9a97a)' }}>
            <CalendarClock size={32} color="white" />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
            Đặt Bàn Trước
          </h1>
          <p style={{ color: '#6b7280' }}>
            Đảm bảo trải nghiệm hoàn hảo với bàn riêng đặc biệt cho bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info cards */}
          <div className="flex flex-col gap-5">
            {[
              { icon: Clock, title: 'Giờ Mở Cửa', desc: 'Thứ 2 – Chủ nhật\n7:00 – 22:00', color: '#6b3f2a' },
              { icon: Users, title: 'Sức Chứa', desc: 'Tối đa 10 người\nmỗi bàn', color: '#2563eb' },
              { icon: CalendarClock, title: 'Xác Nhận', desc: 'Trong vòng 30 phút\nqua điện thoại', color: '#16a34a' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card-flat p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '18' }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: '#2d1200' }}>{title}</p>
                  <p className="text-sm mt-1 whitespace-pre-line" style={{ color: '#6b7280' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
                Thông Tin Đặt Bàn
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Họ và Tên *
                    </label>
                    <input {...register('guestName', { required: 'Vui lòng nhập họ tên' })}
                      className="input" placeholder="Nguyễn Văn A" />
                    {errors.guestName && (
                      <p className="text-xs text-red-500 mt-1">{errors.guestName.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Số Điện Thoại *
                    </label>
                    <input {...register('guestPhone', { required: 'Vui lòng nhập số điện thoại' })}
                      type="tel" className="input" placeholder="0123 456 789" />
                    {errors.guestPhone && (
                      <p className="text-xs text-red-500 mt-1">{errors.guestPhone.message as string}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Ngày *
                    </label>
                    <input {...register('date', { required: true })}
                      type="date" className="input"
                      min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Giờ *
                    </label>
                    <input {...register('time', { required: true })}
                      type="time" className="input"
                      min="07:00" max="21:00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Số Khách *
                    </label>
                    <input {...register('guestCount', { required: true, min: 1, max: 20 })}
                      type="number" className="input" min={1} max={20} placeholder="2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                    Ghi Chú
                  </label>
                  <textarea {...register('note')}
                    className="input" style={{ minHeight: '90px', resize: 'none' }}
                    placeholder="Yêu cầu đặc biệt: sinh nhật, kỷ niệm, phòng riêng..." />
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="btn btn-primary btn-lg justify-center">
                  {isSubmitting
                    ? <><Loader2 size={18} className="animate-spin" /> Đang gửi...</>
                    : <><CalendarClock size={18} /> Xác Nhận Đặt Bàn</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
