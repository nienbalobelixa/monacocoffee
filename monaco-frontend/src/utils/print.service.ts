/**
 * Monaco Coffee — Print Service
 * Hỗ trợ: Máy in nhiệt 80mm, máy in A4, PDF
 * Cách hoạt động: Tạo cửa sổ in HTML riêng → window.print()
 */

export interface PrintItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  note?: string
}

export interface KitchenTicketData {
  orderNumber: string
  tableName: string          // "Bàn 3" | "Mang đi"
  type: string
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

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ'

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  QR_CODE: 'QR Code',
  CARD: 'Thẻ',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
}

/** Mở cửa sổ in tự động, đóng sau khi in xong */
function openPrintWindow(html: string) {
  const win = window.open('', '_blank', 'width=400,height=600,scrollbars=yes')
  if (!win) {
    alert('Vui lòng cho phép popup để in. Kiểm tra cài đặt trình duyệt.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.close()
  }, 300)
}

/** CSS dùng chung cho phiếu in */
const baseCss = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 80mm;
    max-width: 80mm;
    padding: 4mm 3mm;
  }
  .center { text-align: center; }
  .right  { text-align: right; }
  .bold   { font-weight: bold; }
  .lg     { font-size: 15px; }
  .xl     { font-size: 18px; }
  .sm     { font-size: 10px; }
  .dashed { border-top: 1px dashed #000; margin: 4px 0; }
  .solid  { border-top: 2px solid #000; margin: 4px 0; }
  table   { width: 100%; border-collapse: collapse; }
  td      { padding: 2px 0; vertical-align: top; }
  .td-name { width: 55%; }
  .td-qty  { width: 10%; text-align: center; }
  .td-price{ width: 35%; text-align: right; }
  .row-total { border-top: 1px dashed #000; }
  .note-box { background: #f0f0f0; padding: 3px 5px; border-radius: 2px; font-style: italic; font-size: 11px; }
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body { width: 80mm; }
  }
`

/**
 * In phiếu bếp / order ticket
 * Gửi cho bếp / quầy pha chế
 */
export function printKitchenTicket(data: KitchenTicketData) {
  const now = data.createdAt ? new Date(data.createdAt) : new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN')

  const itemsHtml = data.items.map(item => `
    <tr>
      <td class="td-name bold">${item.name}</td>
      <td class="td-qty bold lg">x${item.quantity}</td>
      <td class="td-price"></td>
    </tr>
    ${item.note ? `<tr><td colspan="3" class="sm" style="color:#555;padding-left:4px">↳ ${item.note}</td></tr>` : ''}
  `).join('')

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Phiếu Bếp #${data.orderNumber}</title>
    <style>${baseCss}
      .kitchen-header { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
      .table-name { font-size: 20px; font-weight: bold; border: 2px solid #000; padding: 3px 8px; display: inline-block; margin: 4px 0; }
    </style>
  </head><body>
    <div class="center">
      <div class="kitchen-header">☕ BẾP / BAR</div>
      <div class="kitchen-header">MONACO COFFEE</div>
    </div>
    <div class="solid"></div>

    <div class="center">
      <div class="table-name">${data.tableName}</div>
    </div>
    <div style="text-align:center; font-size:11px; margin-bottom:4px">
      ${data.type === 'DINE_IN' ? 'Tại bàn' : data.type === 'TAKEAWAY' ? 'Mang đi' : data.type}
    </div>

    <div class="dashed"></div>
    <div style="display:flex;justify-content:space-between;font-size:11px">
      <span>Đơn: <b>#${data.orderNumber}</b></span>
      <span>${timeStr} - ${dateStr}</span>
    </div>
    ${data.staffName ? `<div style="font-size:11px">NV: ${data.staffName}</div>` : ''}
    <div class="dashed"></div>

    <table>${itemsHtml}</table>

    <div class="dashed"></div>
    <div style="text-align:center; font-size:11px">Tổng: <b>${data.items.length}</b> món</div>

    ${data.note ? `<div class="dashed"></div><div>📝 GHI CHÚ:</div><div class="note-box">${data.note}</div>` : ''}

    <div class="dashed"></div>
    <div class="center sm" style="margin-top:6px">⬆ Vui lòng chế theo thứ tự ⬆</div>
  </body></html>`

  openPrintWindow(html)
}

/**
 * In hóa đơn thanh toán / receipt
 * Đưa cho khách
 */
export function printReceipt(data: ReceiptData) {
  const now = data.paidAt ? new Date(data.paidAt) : new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN')

  const itemsHtml = data.items.map(item => `
    <tr>
      <td class="td-name">${item.name}</td>
      <td class="td-qty">${item.quantity}</td>
      <td class="td-price">${fmt(item.unitPrice)}</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td class="td-price bold">${fmt(item.subtotal)}</td>
    </tr>
    ${item.note ? `<tr><td colspan="3" class="sm" style="color:#555;padding-left:4px">↳ ${item.note}</td></tr>` : ''}
  `).join('')

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Hóa Đơn #${data.orderNumber}</title>
    <style>${baseCss}
      .shop-name { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
      .shop-sub { font-size: 11px; color: #555; }
      .receipt-title { font-size: 14px; font-weight: bold; letter-spacing: 3px; margin: 4px 0; }
      .summary-row { display: flex; justify-content: space-between; padding: 2px 0; }
      .summary-row.total { font-size: 15px; font-weight: bold; border-top: 2px solid #000; margin-top: 4px; padding-top: 4px; }
      .barcode { font-size: 9px; letter-spacing: 3px; margin: 6px 0; }
    </style>
  </head><body>
    <div class="center">
      <div class="shop-name">☕ MONACO COFFEE</div>
      <div class="shop-sub">Địa chỉ: Monaco Coffee, Việt Nam</div>
      <div class="shop-sub">Hotline: 0164-946-0309</div>
    </div>
    <div class="solid"></div>
    <div class="center receipt-title">HÓA ĐƠN THANH TOÁN</div>

    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
      <span>Đơn: <b>#${data.orderNumber}</b></span>
      <span>${timeStr} ${dateStr}</span>
    </div>
    <div style="font-size:11px;margin-bottom:2px">
      Bàn: <b>${data.tableName}</b>
      ${data.cashierName ? ` | Thu ngân: ${data.cashierName}` : ''}
    </div>

    <div class="dashed"></div>
    <table>
      <thead>
        <tr>
          <td class="td-name bold sm">TÊN MÓN</td>
          <td class="td-qty bold sm" style="text-align:center">SL</td>
          <td class="td-price bold sm">ĐƠN GIÁ</td>
        </tr>
      </thead>
      <tbody>
        <tr><td colspan="3"><div class="dashed"></div></td></tr>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="dashed"></div>
    <div class="summary-row"><span>Tạm tính</span><span>${fmt(data.subtotal)}</span></div>
    ${data.discount > 0 ? `<div class="summary-row"><span>Giảm giá</span><span>- ${fmt(data.discount)}</span></div>` : ''}
    <div class="summary-row total"><span>TỔNG CỘNG</span><span>${fmt(data.total)}</span></div>

    <div class="dashed"></div>
    <div class="summary-row sm">
      <span>Hình thức TT</span>
      <span><b>${PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod}</b></span>
    </div>

    ${data.note ? `<div class="dashed"></div><div class="sm">Ghi chú: <i>${data.note}</i></div>` : ''}

    <div class="solid"></div>
    <div class="center" style="margin-top:6px">
      <div class="sm">Cảm ơn quý khách!</div>
      <div class="sm" style="margin-top:2px">Thank you & see you again! ☕</div>
      <div class="barcode" style="margin-top:8px">||||| #${data.orderNumber} |||||</div>
    </div>
  </body></html>`

  openPrintWindow(html)
}
