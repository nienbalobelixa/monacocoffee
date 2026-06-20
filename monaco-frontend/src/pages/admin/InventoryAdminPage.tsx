import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '../../services/inventory.service'
import { AlertTriangle, Package } from 'lucide-react'

export default function InventoryAdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getAll,
  })
  const { data: lowData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryService.getLowStock,
  })

  const inventory = data?.data || []
  const lowStock = lowData?.data || []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2d1200' }}>
          Quản Lý Kho Hàng
        </h1>
        <p className="mt-1" style={{ color: '#9ca3af' }}>{inventory.length} nguyên liệu</p>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
          style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
          <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#92400e' }}>
              {lowStock.length} nguyên liệu sắp hết hàng
            </p>
            <p className="text-xs mt-1" style={{ color: '#b45309' }}>
              {lowStock.map((i: any) => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="card-flat overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nguyên Liệu</th>
              <th>Đơn Vị</th>
              <th>Tồn Kho</th>
              <th>Tối Thiểu</th>
              <th>Đơn Giá</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="text-center py-16">
                    <Package size={48} className="mx-auto mb-3" style={{ color: '#e8d9cc' }} />
                    <p style={{ color: '#9ca3af' }}>Kho hàng trống</p>
                  </div>
                </td>
              </tr>
            ) : inventory.map((item: any) => {
              const isLow = item.minQuantity && Number(item.quantity) <= Number(item.minQuantity)
              return (
                <tr key={item.id}>
                  <td>
                    <div>
                      <p className="font-medium" style={{ color: '#2d1200' }}>{item.name}</p>
                      {item.product && <p className="text-xs" style={{ color: '#9ca3af' }}>→ {item.product.name}</p>}
                    </div>
                  </td>
                  <td style={{ color: '#6b7280' }}>{item.unit}</td>
                  <td>
                    <span className="font-bold" style={{ color: isLow ? '#dc2626' : '#2d1200' }}>
                      {Number(item.quantity).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ color: '#9ca3af' }}>{item.minQuantity || '—'}</td>
                  <td style={{ color: '#6b3f2a' }}>
                    {item.costPrice ? Number(item.costPrice).toLocaleString('vi-VN') + 'đ' : '—'}
                  </td>
                  <td>
                    {isLow ? (
                      <span className="badge badge-error flex items-center gap-1">
                        <AlertTriangle size={11} /> Sắp hết
                      </span>
                    ) : (
                      <span className="badge badge-success">Đủ hàng</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
