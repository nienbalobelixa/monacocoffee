import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../services/dashboard.service'
import { TrendingUp, ShoppingCart, Users, Package, ArrowUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const formatPrice = (p: number) => p?.toLocaleString('vi-VN') + 'đ' || '0đ'

export default function DashboardPage() {
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000,
  })

  const { data: chartData } = useQuery({
    queryKey: ['revenue-chart', 30],
    queryFn: () => dashboardService.getRevenueChart(30),
  })

  const stats = statsData?.data || statsData || {}
  const chart = chartData?.data || chartData || []

  const kpis = [
    { label: 'Doanh Thu Hôm Nay', value: formatPrice(stats.todayRevenue || 0), icon: TrendingUp, color: '#6b3f2a', bg: '#f4ede6' },
    { label: 'Đơn Hàng Hôm Nay', value: stats.todayOrders || 0, icon: ShoppingCart, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Tổng Khách Hàng', value: stats.totalCustomers || 0, icon: Users, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Khách Mới Hôm Nay', value: stats.newCustomersToday || 0, icon: Package, color: '#9333ea', bg: '#f3e8ff' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: '#9ca3af' }}>Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-flat p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={22} style={{ color }} />
              </div>
              <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem' }}>
                <ArrowUp size={10} /> Hôm nay
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#2d1200' }}>{value}</p>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-flat p-6">
          <h3 className="font-bold mb-6" style={{ color: '#2d1200' }}>Doanh Thu 30 Ngày</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b3f2a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b3f2a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f0eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [formatPrice(v), 'Doanh thu']} labelFormatter={(l) => `Ngày ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#6b3f2a" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-flat p-6">
          <h3 className="font-bold mb-6" style={{ color: '#2d1200' }}>Sản Phẩm Bán Chạy</h3>
          {stats.topProducts?.length ? (
            <div className="flex flex-col gap-3">
              {stats.topProducts.slice(0, 5).map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#cd7c2f', flexShrink: 0 }}>{i + 1}</span>
                  {p.image && <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#2d1200' }}>{p.name}</p>
                    <div className="w-full rounded-full mt-1" style={{ background: '#e8d9cc', height: '4px' }}>
                      <div className="rounded-full" style={{ width: `${(p.totalSold / (stats.topProducts[0]?.totalSold || 1)) * 100}%`, background: '#6b3f2a', height: '4px' }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#6b3f2a' }}>{p.totalSold}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-center py-8" style={{ color: '#9ca3af' }}>Chưa có dữ liệu</p>}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-flat">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #e8d9cc' }}>
          <h3 className="font-bold" style={{ color: '#2d1200' }}>Đơn Hàng Gần Đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Trạng Thái</th>
                <th>Tổng Tiền</th>
                <th>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders?.map((order: any) => (
                <tr key={order.id}>
                  <td><span className="font-mono text-sm" style={{ color: '#6b3f2a' }}>#{order.orderNumber}</span></td>
                  <td style={{ color: '#2d1200' }}>{order.user?.fullName || 'Khách vãng lai'}</td>
                  <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                  <td className="font-semibold" style={{ color: '#6b3f2a' }}>{formatPrice(Number(order.total))}</td>
                  <td className="text-sm" style={{ color: '#9ca3af' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              )) || <tr><td colSpan={5} className="text-center" style={{ color: '#9ca3af' }}>Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
