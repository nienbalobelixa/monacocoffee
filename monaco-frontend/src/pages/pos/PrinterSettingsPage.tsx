import { useState, useEffect } from 'react'
import { Bluetooth, Usb, CheckCircle, RefreshCw, Printer, Wifi } from 'lucide-react'
import { getBluetoothPrinters, printerPrefs, isAndroidWebView, type BtPrinter } from '../../utils/print.service'
import { toast } from 'sonner'

export default function PrinterSettingsPage() {
  const [btPrinters, setBtPrinters] = useState<BtPrinter[]>([])
  const [selectedAddr, setSelectedAddr] = useState(printerPrefs.getAddress())
  const [scanning, setScanning] = useState(false)
  const isAndroid = isAndroidWebView()

  const scan = () => {
    setScanning(true)
    setTimeout(() => {
      const printers = getBluetoothPrinters()
      setBtPrinters(printers)
      setScanning(false)
      if (printers.length === 0)
        toast.error('Không tìm thấy máy in Bluetooth đã pair. Vào Settings Android để pair trước.')
      else
        toast.success(`Tìm thấy ${printers.length} máy in`)
    }, 1200)
  }

  useEffect(() => {
    if (isAndroid) scan()
  }, [isAndroid])

  const select = (addr: string, name: string) => {
    printerPrefs.setAddress(addr)
    setSelectedAddr(addr)
    toast.success(`✅ Đã chọn máy in: ${name}`)
  }

  const testPrint = () => {
    if (!window.MonacoPrinter?.printText) {
      toast.error('Chưa kết nối Android bridge')
      return
    }
    const txt = [
      'MONACO COFFEE',
      '========================',
      'TEST IN - KIEM TRA KET NOI',
      '------------------------',
      'Neu ban doc duoc dong nay',
      'may in da hoat dong tot!',
      '========================',
      new Date().toLocaleString('vi-VN'),
      '',
    ].join('\n')
    if (selectedAddr && window.MonacoPrinter.printToAddress) {
      window.MonacoPrinter.printToAddress(selectedAddr, txt)
    } else {
      window.MonacoPrinter.printText(txt)
    }
    toast.success('Đã gửi lệnh in thử')
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#1a0a00' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            <Printer size={28} style={{ color: '#c9a97a' }} />
            Cài Đặt Máy In
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Kết nối máy in nhiệt cho iPOS Android
          </p>
        </div>

        {/* Android status */}
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: isAndroid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isAndroid ? '#10b981' : '#f59e0b'}40` }}>
          <div className="flex items-center gap-3">
            <Wifi size={20} style={{ color: isAndroid ? '#10b981' : '#f59e0b' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: isAndroid ? '#6ee7b7' : '#fcd34d' }}>
                {isAndroid ? '✅ Đang chạy trên Android iPOS' : '⚠️ Đang chạy trên trình duyệt'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isAndroid
                  ? 'Kết nối trực tiếp USB/Bluetooth — không cần RawBT'
                  : 'Trên browser sẽ dùng window.print() thay thế'}
              </p>
            </div>
          </div>
        </div>

        {/* USB section */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Usb size={18} style={{ color: '#c9a97a' }} />
            <h2 className="font-bold text-white">Máy In USB</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px]"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
              Tự động
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Cắm máy in vào cổng USB OTG của máy iPOS. App sẽ tự động nhận diện và
            in không cần cấu hình thêm.
          </p>
          <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.4)' }}>
            💡 Lần đầu cắm USB sẽ có hộp thoại xin quyền → nhấn <b style={{ color: '#c9a97a' }}>OK</b>
          </div>
        </div>

        {/* Bluetooth section */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bluetooth size={18} style={{ color: '#c9a97a' }} />
              <h2 className="font-bold text-white">Máy In Bluetooth</h2>
            </div>
            <button
              onClick={scan}
              disabled={scanning || !isAndroid}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'rgba(201,169,122,0.15)',
                color: '#c9a97a',
                opacity: scanning || !isAndroid ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Đang quét...' : 'Quét'}
            </button>
          </div>

          {!isAndroid && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Cần chạy trên Android để quét máy in Bluetooth.
            </p>
          )}

          {isAndroid && btPrinters.length === 0 && !scanning && (
            <div className="text-center py-6">
              <Bluetooth size={32} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Chưa tìm thấy máy in đã pair
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Vào Cài đặt Android → Bluetooth → Pair thiết bị trước
              </p>
            </div>
          )}

          <div className="space-y-2">
            {btPrinters.map(p => {
              const isSelected = selectedAddr === p.address
              return (
                <button
                  key={p.address}
                  onClick={() => select(p.address, p.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? 'rgba(201,169,122,0.15)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isSelected ? '#c9a97a' : 'transparent'}`,
                  }}
                >
                  <Bluetooth size={16} style={{ color: isSelected ? '#c9a97a' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.name || 'Không rõ tên'}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.address}</p>
                  </div>
                  {isSelected && <CheckCircle size={16} style={{ color: '#c9a97a', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {selectedAddr && (
            <button
              onClick={() => { printerPrefs.clear(); setSelectedAddr(''); toast.success('Đã xóa cấu hình') }}
              className="mt-3 text-xs underline"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Xóa lựa chọn (dùng máy in mặc định)
            </button>
          )}
        </div>

        {/* Test print */}
        <button
          onClick={testPrint}
          className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'linear-gradient(135deg, #c9a97a, #6b3f2a)', color: 'white' }}
        >
          <Printer size={18} />
          In thử kiểm tra kết nối
        </button>

        {/* Instructions */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#c9a97a' }}>
            📋 Hướng dẫn kết nối máy in
          </h3>
          <div className="space-y-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <div className="flex gap-2"><span style={{ color: '#c9a97a' }}>1.</span><span>Cắm máy in USB vào cổng OTG của iPOS <b style={{ color: 'rgba(255,255,255,0.7)' }}>HOẶC</b> bật Bluetooth và pair máy in</span></div>
            <div className="flex gap-2"><span style={{ color: '#c9a97a' }}>2.</span><span>Nếu dùng Bluetooth: nhấn <b style={{ color: 'rgba(255,255,255,0.7)' }}>Quét</b> → chọn máy in</span></div>
            <div className="flex gap-2"><span style={{ color: '#c9a97a' }}>3.</span><span>Nhấn <b style={{ color: 'rgba(255,255,255,0.7)' }}>In thử</b> để kiểm tra</span></div>
            <div className="flex gap-2"><span style={{ color: '#c9a97a' }}>4.</span><span>Vào màn hình POS và order — phiếu bếp & hóa đơn sẽ in tự động</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
