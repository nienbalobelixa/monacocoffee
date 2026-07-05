/**
 * Monaco Coffee — Print Service
 * ──────────────────────────────
 * Tự động phát hiện môi trường:
 *   • Android iPOS WebView → gọi MonacoPrinter Java bridge (USB/Bluetooth trực tiếp)
 *   • Browser thông thường  → window.print() qua popup HTML
 *
 * ESC/POS text formatting được thực hiện ở đây (plain text),
 * Android bridge nhận text và convert sang ESC/POS bytes.
 */

// ── Type declarations ──────────────────────────────────────────────
export interface PrintItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  note?: string
}

export interface KitchenTicketData {
  orderNumber: string
  tableName: string   // "Bàn 3" | "Mang đi"
  type: string        // DINE_IN | TAKEAWAY
  items: PrintItem[]
  note?: string
  createdAt?: Date
  staffName?: string
}

export interface ReceiptData {
  orderNumber: string
  tableName: string
  items: PrintItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  note?: string
  paidAt?: Date
  cashierName?: string
}

export interface BtPrinter {
  name: string
  address: string
}

// ── Extend Window với Android bridge ──────────────────────────────
declare global {
  interface Window {
    MonacoPrinter?: {
      isAvailable(): boolean
      printText(text: string): void
      printToAddress(address: string, text: string): void
      getBluetoothPrinters(): string   // JSON string
      getUsbPrinters(): string          // JSON string
      setPrintContent(text: string): void  // Lưu nội dung → hiện FAB
    }
    __MONACO_ANDROID__?: boolean
    __monacoPrintCurrent?: () => string
  }
}

// ── Detect Android WebView ─────────────────────────────────────────
export function isAndroidWebView(): boolean {
  return typeof window !== 'undefined' && !!window.__MONACO_ANDROID__
    || (typeof window !== 'undefined' && typeof window.MonacoPrinter !== 'undefined')
}

// ── Get paired Bluetooth printers ────────────────────────────────
export function getBluetoothPrinters(): BtPrinter[] {
  if (!window.MonacoPrinter?.getBluetoothPrinters) return []
  try {
    return JSON.parse(window.MonacoPrinter.getBluetoothPrinters()) || []
  } catch {
    return []
  }
}

// ── Preferred printer address (stored in localStorage) ────────────
const PREF_KEY = 'monaco_printer_address'
export const printerPrefs = {
  getAddress: (): string => localStorage.getItem(PREF_KEY) || '',
  setAddress: (addr: string) => localStorage.setItem(PREF_KEY, addr),
  clear: () => localStorage.removeItem(PREF_KEY),
}

// ── Helpers ────────────────────────────────────────────────────────
const fmt   = (n: number) => n.toLocaleString('vi-VN') + 'đ'
const line  = (char = '-', w = 42) => char.repeat(w)
const strip = (s?: string) => (s || '').replace(/\s+/g, ' ').trim()

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tien mat', BANK_TRANSFER: 'Chuyen khoan',
  QR_CODE: 'QR Code', CARD: 'The', MOMO: 'MoMo', ZALOPAY: 'ZaloPay',
}

// ── Build plain-text kitchen ticket ───────────────────────────────
export function buildKitchenText(data: KitchenTicketData): string {
  const now = data.createdAt ? new Date(data.createdAt) : new Date()
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('vi-VN')

  const rows = [
    'MONACO COFFEE',
    'BEP / BAR',
    line('='),
    data.tableName.toUpperCase(),
    data.type === 'DINE_IN' ? 'TAI BAN' : 'MANG DI',
    line('-'),
    `Don: #${data.orderNumber}`,
    `${time}  ${date}`,
    data.staffName ? `NV: ${strip(data.staffName)}` : '',
    line('-'),
    ...data.items.flatMap(i => [
      strip(i.name),
      `  x${i.quantity}`,
      i.note ? `  >> ${strip(i.note)}` : '',
    ]),
    line('-'),
    `Tong: ${data.items.length} mon`,
    data.note ? '' : '',
    data.note ? `Ghi chu: ${strip(data.note)}` : '',
    line('='),
    '',
  ]
  return rows.filter(r => r !== undefined).join('\n')
}

// ── Build plain-text receipt ───────────────────────────────────────
export function buildReceiptText(data: ReceiptData): string {
  const now = data.paidAt ? new Date(data.paidAt) : new Date()
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('vi-VN')

  const rows = [
    'MONACO COFFEE',
    'Hotline: 0164-946-0309',
    line('='),
    'HOA DON THANH TOAN',
    line('-'),
    `Don: #${data.orderNumber}`,
    `${time}  ${date}`,
    `Ban: ${data.tableName}`,
    data.cashierName ? `Thu ngan: ${strip(data.cashierName)}` : '',
    line('-'),
    ...data.items.flatMap(i => [
      strip(i.name),
      `  ${i.quantity} x ${fmt(i.unitPrice)}`,
      `  = ${fmt(i.subtotal)}`,
      i.note ? `  >> ${strip(i.note)}` : '',
    ]),
    line('-'),
    `Tam tinh  : ${fmt(data.subtotal)}`,
    data.discount > 0 ? `Giam gia  : -${fmt(data.discount)}` : '',
    line('-'),
    `TONG CONG : ${fmt(data.total)}`,
    `Thanh toan: ${PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod}`,
    data.note ? `Ghi chu   : ${strip(data.note)}` : '',
    line('='),
    'Cam on quy khach!',
    'Thank you & see you again!',
    '',
  ]
  return rows.filter(r => r !== undefined).join('\n')
}

// ── Core print dispatcher ──────────────────────────────────────────
function doPrint(text: string, htmlFallback: () => void) {
  // 1. Android WebView bridge
  if (window.MonacoPrinter?.printText) {
    // Lưu nội dung → FAB nút in trên Android luôn có sẵn để in lại
    if (window.MonacoPrinter.setPrintContent) {
      window.MonacoPrinter.setPrintContent(text)
    }
    // Đăng ký hàm lấy nội dung hiện tại (FAB dùng)
    window.__monacoPrintCurrent = () => text

    const savedAddr = printerPrefs.getAddress()
    if (savedAddr && window.MonacoPrinter.printToAddress) {
      window.MonacoPrinter.printToAddress(savedAddr, text)
    } else {
      window.MonacoPrinter.printText(text)
    }
    return
  }
  // 2. Browser fallback
  htmlFallback()
}

/** Chỉ lưu nội dung vào FAB (không in ngay) — dùng khi muốn hiện nút in trước */
export function savePrintContent(text: string) {
  if (window.MonacoPrinter?.setPrintContent) {
    window.MonacoPrinter.setPrintContent(text)
  }
  window.__monacoPrintCurrent = () => text
}

/** Export để PosPage build text và lưu vào FAB */
export { buildKitchenText, buildReceiptText }

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/** In phiếu bếp */
export function printKitchenTicket(data: KitchenTicketData) {
  doPrint(buildKitchenText(data), () => printKitchenHtml(data))
}

/** In hóa đơn thanh toán */
export function printReceipt(data: ReceiptData) {
  doPrint(buildReceiptText(data), () => printReceiptHtml(data))
}

// ── HTML fallback (browser window.print) ─────────────────────────
function openPrintWindow(html: string) {
  const win = window.open('', '_blank', 'width=420,height=640,scrollbars=yes')
  if (!win) { alert('Cho phép popup để in. Kiểm tra cài đặt trình duyệt.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

const BASE_CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Courier New',Courier,monospace; font-size:12px; color:#000; background:#fff; width:80mm; padding:4mm 3mm; }
.c { text-align:center; } .r { text-align:right; } .b { font-weight:bold; } .lg { font-size:15px; } .sm { font-size:10px; }
.dash { border-top:1px dashed #000; margin:4px 0; } .solid { border-top:2px solid #000; margin:4px 0; }
table { width:100%; } td { padding:2px 0; vertical-align:top; }
.n { width:56%; } .q { width:10%; text-align:center; } .p { width:34%; text-align:right; }
@media print { @page { size:80mm auto; margin:0; } body { width:80mm; } }
`

function printKitchenHtml(d: KitchenTicketData) {
  const now = d.createdAt ? new Date(d.createdAt) : new Date()
  const rows = d.items.map(i => `
    <tr><td class="n b">${i.name}</td><td class="q b lg">x${i.quantity}</td><td></td></tr>
    ${i.note ? `<tr><td colspan="3" class="sm" style="color:#555">↳ ${i.note}</td></tr>` : ''}
  `).join('')
  openPrintWindow(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE_CSS}
    .bh{font-size:20px;font-weight:bold;letter-spacing:2px;} .bn{font-size:18px;font-weight:bold;border:2px solid #000;padding:2px 8px;display:inline-block;}
  </style></head><body>
  <div class="c"><div class="bh">☕ BẾP / BAR</div><div class="bh">MONACO COFFEE</div></div>
  <div class="solid"></div>
  <div class="c"><div class="bn">${d.tableName}</div></div>
  <div class="c sm">${d.type === 'DINE_IN' ? 'Tại bàn' : 'Mang đi'}</div>
  <div class="dash"></div>
  <div style="display:flex;justify-content:space-between;font-size:11px">
    <span>Đơn: <b>#${d.orderNumber}</b></span>
    <span>${now.toLocaleTimeString('vi-VN')} ${now.toLocaleDateString('vi-VN')}</span>
  </div>
  ${d.staffName ? `<div class="sm">NV: ${d.staffName}</div>` : ''}
  <div class="dash"></div>
  <table>${rows}</table>
  <div class="dash"></div>
  <div class="c sm">Tổng: <b>${d.items.length}</b> món</div>
  ${d.note ? `<div class="dash"></div><div class="sm">📝 ${d.note}</div>` : ''}
  <div class="dash"></div><div class="c sm">⬆ Vui lòng pha chế theo thứ tự ⬆</div>
  </body></html>`)
}

function printReceiptHtml(d: ReceiptData) {
  const now = d.paidAt ? new Date(d.paidAt) : new Date()
  const rows = d.items.map(i => `
    <tr><td class="n">${i.name}</td><td class="q">${i.quantity}</td><td class="p">${fmt(i.unitPrice)}</td></tr>
    <tr><td colspan="2"></td><td class="p b">${fmt(i.subtotal)}</td></tr>
    ${i.note ? `<tr><td colspan="3" class="sm" style="color:#555">↳ ${i.note}</td></tr>` : ''}
  `).join('')
  openPrintWindow(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE_CSS}
    .sn{font-size:18px;font-weight:bold;} .rt{font-size:13px;font-weight:bold;letter-spacing:3px;}
    .row{display:flex;justify-content:space-between;padding:2px 0;}
    .tot{font-size:14px;font-weight:bold;border-top:2px solid #000;margin-top:4px;padding-top:4px;}
  </style></head><body>
  <div class="c"><div class="sn">☕ MONACO COFFEE</div><div class="sm">Hotline: 0164-946-0309</div></div>
  <div class="solid"></div><div class="c rt">HÓA ĐƠN THANH TOÁN</div>
  <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
    <span>Đơn: <b>#${d.orderNumber}</b></span>
    <span>${now.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })} ${now.toLocaleDateString('vi-VN')}</span>
  </div>
  <div class="sm">Bàn: <b>${d.tableName}</b>${d.cashierName ? ' | Thu ngân: ' + d.cashierName : ''}</div>
  <div class="dash"></div>
  <table><thead><tr><td class="n b sm">TÊN MÓN</td><td class="q b sm">SL</td><td class="p b sm">ĐƠN GIÁ</td></tr></thead>
  <tbody><tr><td colspan="3"><div class="dash"></div></td></tr>${rows}</tbody></table>
  <div class="dash"></div>
  <div class="row"><span>Tạm tính</span><span>${fmt(d.subtotal)}</span></div>
  ${d.discount > 0 ? `<div class="row"><span>Giảm giá</span><span>-${fmt(d.discount)}</span></div>` : ''}
  <div class="row tot"><span>TỔNG CỘNG</span><span>${fmt(d.total)}</span></div>
  <div class="dash"></div>
  <div class="row sm"><span>Hình thức TT</span><span><b>${PAYMENT_LABELS[d.paymentMethod] || d.paymentMethod}</b></span></div>
  ${d.note ? `<div class="sm">Ghi chú: <i>${d.note}</i></div>` : ''}
  <div class="solid"></div>
  <div class="c sm" style="margin-top:6px">Cảm ơn quý khách! ☕<br>Thank you &amp; see you again!</div>
  <div class="c sm" style="letter-spacing:3px;margin-top:8px">||||| #${d.orderNumber} |||||</div>
  </body></html>`)
}
