import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../../services/reports.service'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, ShoppingCart, Package, Calendar } from 'lucide-react'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ' || '0đ'
const COLORS = ['#6b3f2a', '#c9a97a', '#8b5e3c', '#4a1e00', '#d4a27a']

export default function ReportsAdminPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: monthlyData } = useQuery({
    queryKey: ['report-monthly', year, month],
    queryFn: () => reportsService.monthly(year, month),
  })

  const { data: yearlyData } = useQuery({
    queryKey: ['report-yearly', year],
    queryFn: () => reportsService.yearly(year),
  })

  const monthly = monthlyData?.data || monthlyData || {}
  const yearly = yearlyData?.data || yearlyData || {}
  const monthlyDays = monthly.dailyBreakdown || []
  const yearlyMonths = yearly.monthlyBreakdown || []
  const topProducts = monthly.topProducts || []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Báo Cáo</h1>
        <p className="mt-1" style={{ color: '#9ca3af' }}>Phân tích doanh thu và kinh doanh</p>
      </div>

      {/* Filters */}
      <div className="card-flat p-4 mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Năm</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input" style={{ width: 'auto' }}>
            {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Tháng</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input" style={{ width: 'auto' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Doanh Thu Tháng', value: formatPrice(monthly.totalRevenue || 0), icon: TrendingUp, color: '#6b3f2a' },
          { label: 'Tổng Đơn Hàng', value: monthly.totalOrders || 0, icon: ShoppingCart, color: '#2563eb' },
          { label: 'TB/Đơn Hàng', value: formatPrice(monthly.avgOrderValue || 0), icon: Package, color: '#16a34a' },
          { label: 'Khách Mới', value: monthly.newCustomers || 0, icon: Calendar, color: '#9333ea' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-flat p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: color + '18' }}>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#2d1200' }}>{value}</p>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily revenue this month */}
        <div className="card-flat p-6">
          <h3 className="font-bold mb-5" style={{ color: '#2d1200' }}>Doanh Thu Theo Ngày (Tháng {month})</h3>
          {monthlyDays.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f0eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: any) => [formatPrice(v), 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#6b3f2a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12" style={{ color: '#9ca3af' }}>Chưa có dữ liệu</div>
          )}
        </div>

        {/* Yearly trend */}
        <div className="card-flat p-6">
          <h3 className="font-bold mb-5" style={{ color: '#2d1200' }}>Xu Hướng Năm {year}</h3>
          {yearlyMonths.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={yearlyMonths}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f0eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `T${v}`} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: any) => [formatPrice(v), 'Doanh thu']} labelFormatter={(l) => `Tháng ${l}`} />
                <Line type="monotone" dataKey="revenue" stroke="#6b3f2a" strokeWidth={3} dot={{ fill: '#6b3f2a', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12" style={{ color: '#9ca3af' }}>Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-flat p-6">
            <h3 className="font-bold mb-5" style={{ color: '#2d1200' }}>Top Sản Phẩm Bán Chạy</h3>
            <div className="flex flex-col gap-4">
              {topProducts.slice(0, 8).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2f' : '#e8d9cc', color: i < 3 ? 'white' : '#6b7280' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#2d1200' }}>{p.name}</p>
                    <div className="w-full bg-gray-100 rounded-full mt-1" style={{ height: '5px' }}>
                      <div className="rounded-full" style={{
                        width: `${(p.totalSold / (topProducts[0]?.totalSold || 1)) * 100}%`,
                        background: '#6b3f2a', height: '5px'
                      }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: '#6b3f2a' }}>{p.totalSold} bán</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{formatPrice(p.revenue || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-flat p-6">
            <h3 className="font-bold mb-5" style={{ color: '#2d1200' }}>Phân Bổ Doanh Thu</h3>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={topProducts.slice(0, 5)} dataKey="revenue" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {topProducts.slice(0, 5).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatPrice(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-12" style={{ color: '#9ca3af' }}>Chưa có dữ liệu</div>}
          </div>
        </div>
      )}
    </div>
  )
}
