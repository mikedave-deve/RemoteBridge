import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import { FORM_BOXES, FORM_NAMES, isMoneyBox } from '../src/lib/taxForms.js'

// PDFs in the website's style: Hanken Grotesk + Newsreader, the teal palette and the two-circle logo mark.
const C = { ink: '#14282E', slate: '#4A6066', soft: '#6B8086', line: '#D7E2E3', mist: '#EDF3F3', paper: '#F8FAFA', b50: '#EEF6F7', b400: '#4C99A7', b600: '#196676', b700: '#145361', b800: '#0F424D', b950: '#06242B' }
// Fonts are vendored into server/fonts so they ship with the serverless bundle.
const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts')
const FONTS = {
  sans: path.join(FONT_DIR, 'hanken-grotesk-latin-400-normal.woff'),
  semi: path.join(FONT_DIR, 'hanken-grotesk-latin-600-normal.woff'),
  serif: path.join(FONT_DIR, 'newsreader-latin-400-normal.woff'),
}
const usd = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const day = (k, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => (k ? new Date(`${k}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' }) : '')

function start(res, filename, title) {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 44, bottom: 44, left: 48, right: 48 }, info: { Title: title, Author: 'PremierRemoteBridge' }, bufferPages: true })
  for (const [k, f] of Object.entries(FONTS)) doc.registerFont(k, f)
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' })
  doc.pipe(res)
  return doc
}

const W = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right
const L = (doc) => doc.page.margins.left

function logo(doc, x, y) {
  doc.save().translate(x - 4 * 0.9, y - 8 * 0.9).scale(0.9)
  doc.circle(17, 24, 11).fill(C.b800)
  doc.circle(31, 24, 11).fill(C.b400)
  doc.path('M24 15.515A11 11 0 0 1 24 32.485A11 11 0 0 1 24 15.515Z').fill(C.b950)
  doc.restore()
  doc.font('semi').fontSize(17).fillColor(C.ink).text('PremierRemoteBridge', x + 42, y + 7, { lineBreak: false, characterSpacing: -0.4 })
}

function header(doc, company, kicker, title, sub) {
  const x = L(doc), w = W(doc)
  logo(doc, x, doc.page.margins.top)
  doc.font('sans').fontSize(8.5).fillColor(C.slate)
  doc.text(company.name, x, doc.page.margins.top + 2, { width: w, align: 'right' })
  if (company.address) doc.text(company.address, { width: w, align: 'right' })
  doc.moveTo(x, 92).lineTo(x + w, 92).lineWidth(1).strokeColor(C.line).stroke()
  doc.font('semi').fontSize(8).fillColor(C.b700).text(kicker.toUpperCase(), x, 108, { characterSpacing: 1.4 })
  doc.font('serif').fontSize(25).fillColor(C.ink).text(title, x, 122)
  if (sub) doc.font('sans').fontSize(9.5).fillColor(C.slate).text(sub, x, doc.y + 2, { width: w })
  doc.y += 14
}

function party(doc, x, y, w, label, lines) {
  doc.font('semi').fontSize(7.5).fillColor(C.soft).text(label.toUpperCase(), x, y, { width: w, characterSpacing: 1 })
  lines.filter(Boolean).forEach((t, i) => doc.font(i ? 'sans' : 'semi').fontSize(i ? 9 : 10.5).fillColor(i ? C.slate : C.ink).text(t, x, doc.y + (i ? 1 : 3), { width: w }))
  return doc.y
}

function tiles(doc, items, highlight) {
  const x = L(doc), w = W(doc), gap = 8, tw = (w - gap * (items.length - 1)) / items.length, y = doc.y, h = 56
  items.forEach(([k, v], i) => {
    const tx = x + i * (tw + gap)
    doc.roundedRect(tx, y, tw, h, 8).fillAndStroke(k === highlight ? C.b50 : C.paper, C.line)
    doc.font('sans').fontSize(8.5).fillColor(C.slate).text(k, tx + 12, y + 11, { width: tw - 24 })
    doc.font('serif').fontSize(18).fillColor(k === highlight ? C.b700 : C.ink).text(v, tx + 12, y + 26, { width: tw - 24 })
  })
  doc.y = y + h + 18
}

function ensure(doc, h) { if (doc.y + h > doc.page.height - doc.page.margins.bottom - 22) { doc.addPage(); doc.y = doc.page.margins.top } }

/** cols: [{ label, width (fraction), align }]; rows: arrays of strings; total: optional array. */
function table(doc, cols, rows, total) {
  const x = L(doc), w = W(doc)
  const xs = []; let acc = x
  for (const c of cols) { xs.push(acc); acc += c.width * w }
  const cell = (vals, f, size, color, y) => vals.forEach((v, i) => doc.font(f).fontSize(size).fillColor(color).text(String(v ?? ''), xs[i] + (i ? 0 : 0), y, { width: cols[i].width * w - (i === cols.length - 1 ? 0 : 8), align: cols[i].align || 'left', lineBreak: false, ellipsis: true }))
  ensure(doc, 40)
  let y = doc.y
  cell(cols.map((c) => c.label.toUpperCase()), 'semi', 7.5, C.slate, y)
  y += 14; doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.8).strokeColor(C.line).stroke(); y += 6
  for (const r of rows) {
    if (y > doc.page.height - doc.page.margins.bottom - 50) { doc.addPage(); y = doc.page.margins.top }
    cell(r, 'sans', 9.5, C.ink, y); y += 15
    doc.moveTo(x, y - 3).lineTo(x + w, y - 3).lineWidth(0.5).strokeColor(C.mist).stroke()
  }
  if (total) { cell(total, 'semi', 9.5, C.ink, y + 1); y += 17 }
  doc.y = y + 12
}

function box(doc, x, y, w, title, lines) {
  const h = 18 + lines.length * 13 + 10
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(C.paper, C.line)
  doc.font('semi').fontSize(9).fillColor(C.ink).text(title, x + 12, y + 10, { width: w - 24 })
  lines.forEach((t, i) => doc.font('sans').fontSize(8.5).fillColor(C.slate).text(t, x + 12, y + 26 + i * 13, { width: w - 24, lineBreak: false, ellipsis: true }))
  return y + h
}

function footer(doc, note) {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const y = doc.page.height - doc.page.margins.bottom - 8, x = L(doc), w = W(doc)
    doc.moveTo(x, y - 8).lineTo(x + w, y - 8).lineWidth(0.8).strokeColor(C.line).stroke()
    const bottom = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    doc.font('sans').fontSize(7.5).fillColor(C.soft).text(note, x, y, { width: w - 60, lineBreak: false, ellipsis: true })
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, x, y, { width: w, align: 'right', lineBreak: false })
    doc.page.margins.bottom = bottom
  }
}

// ---------- Pay stub ----------
export function payStubPdf(res, { stub, user, ytd, company }) {
  const doc = start(res, `PremierRemoteBridge-pay-stub-${stub.payDate}.pdf`, `Earnings statement ${stub.payDate}`)
  header(doc, company, 'Earnings statement', `Pay date ${day(stub.payDate)}`, `Pay period ${day(stub.start, { month: 'short', day: 'numeric' })} – ${day(stub.end)}  ·  Statement no. ${stub.number}`)
  const x = L(doc), w = W(doc), y0 = doc.y
  const p = user.profile || {}
  party(doc, x, y0, w / 2 - 10, 'Employee', [`${user.first} ${user.last}`, `Employee ID ${user.employeeId || '—'}`, p.title, p.address])
  const yl = doc.y
  party(doc, x + w / 2 + 10, y0, w / 2 - 10, 'Employer', [company.name, company.address, [p.employmentType, stub.frequency && `Paid ${stub.frequency.toLowerCase()}`].filter(Boolean).join(' · ')])
  doc.y = Math.max(yl, doc.y) + 16
  tiles(doc, [['Gross pay', usd(stub.gross)], ['Taxes', usd(stub.totalTax)], ['Deductions', usd(stub.totalDed)], ['Net pay', usd(stub.net)]], 'Net pay')

  const y = (label) => usd(ytd.byLabel[label] || 0)
  const hasHours = stub.earnings.some((e) => e.hours !== undefined)
  table(doc, hasHours
    ? [{ label: 'Earnings', width: 0.34 }, { label: 'Hours', width: 0.14, align: 'right' }, { label: 'Rate', width: 0.14, align: 'right' }, { label: 'Current', width: 0.19, align: 'right' }, { label: 'Year to date', width: 0.19, align: 'right' }]
    : [{ label: 'Earnings', width: 0.62 }, { label: 'Current', width: 0.19, align: 'right' }, { label: 'Year to date', width: 0.19, align: 'right' }],
  stub.earnings.map((e) => (hasHours ? [e.label, e.hours !== undefined ? e.hours.toFixed(2) : '', e.rate !== undefined ? usd(e.rate) : '', usd(e.amount), y(e.label)] : [e.label, usd(e.amount), y(e.label)])),
  hasHours ? ['Total', '', '', usd(stub.gross), usd(ytd.gross)] : ['Total', usd(stub.gross), usd(ytd.gross)])
  const three = [{ label: '', width: 0.62 }, { label: 'Current', width: 0.19, align: 'right' }, { label: 'Year to date', width: 0.19, align: 'right' }]
  table(doc, [{ ...three[0], label: 'Taxes withheld' }, three[1], three[2]], stub.taxes.map((t) => [t.label, usd(t.amount), y(t.label)]), ['Total', usd(stub.totalTax), usd(ytd.totalTax)])
  if (stub.deductions.length) table(doc, [{ ...three[0], label: 'Deductions' }, three[1], three[2]], stub.deductions.map((d) => [`${d.label}${d.pretax ? '  (pre-tax)' : ''}`, usd(d.amount), y(d.label)]), ['Total', usd(stub.totalDed), usd(ytd.totalDed)])

  ensure(doc, 18 + Math.max(2, stub.deposits.length) * 13 + 10)
  const by = doc.y, half = (w - 10) / 2
  const a = box(doc, x, by, half, 'Employer contributions', [stub.match ? `401(k) match: ${usd(stub.match)} this period · ${usd(ytd.match)} this year` : 'No employer 401(k) match this period', 'Not deducted from your pay'])
  const b = box(doc, x + half + 10, by, half, 'Net pay distribution', stub.deposits.length ? stub.deposits.map((d) => `${d.label}: ${usd(d.amount)}`) : ['Paid by check'])
  doc.y = Math.max(a, b) + 14
  if (stub.note) doc.font('sans').fontSize(9).fillColor(C.slate).text(stub.note, x, doc.y, { width: w })
  footer(doc, `${company.name} · Questions about this statement? Contact payroll from Help & HR in your employee portal.`)
  doc.end()
}

// ---------- Tax forms ----------
export function taxFormPdf(res, { form, user, company }) {
  const doc = start(res, `PremierRemoteBridge-${form.type}-${form.year}.pdf`, `Form ${form.type} ${form.year}`)
  header(doc, company, `Tax year ${form.year}`, `Form ${form.type} · ${FORM_NAMES[form.type]}`, `Employee copy${form.issued ? ` · Issued ${day(form.issued)}` : ''}`)
  const x = L(doc), w = W(doc), y0 = doc.y, p = user.profile || {}
  party(doc, x, y0, w / 2 - 10, form.type === 'W-2' ? 'Employer' : 'Payer', [form.employer || company.name, form.employerAddress || company.address, form.ein && `EIN ${form.ein}`])
  const yl = doc.y
  party(doc, x + w / 2 + 10, y0, w / 2 - 10, form.type === 'W-2' ? 'Employee' : 'Recipient', [`${user.first} ${user.last}`, p.address, `Employee ID ${user.employeeId || '—'}`])
  doc.y = Math.max(yl, doc.y) + 18

  const boxes = FORM_BOXES[form.type].filter(([b]) => form.boxes?.[b] !== undefined && form.boxes[b] !== '')
  const col = (w - 10) / 2, rh = 36
  let rowY = doc.y
  boxes.forEach(([b, label], i) => {
    if (i % 2 === 0) { doc.y = rowY; ensure(doc, rh + 6); rowY = doc.y }
    const cx = x + (i % 2) * (col + 10), cy = rowY
    doc.roundedRect(cx, cy, col, rh, 7).fillAndStroke('#FFFFFF', C.line)
    doc.roundedRect(cx + 10, cy + 10.5, 26, 15, 4).fill(C.mist)
    doc.font('semi').fontSize(8).fillColor(C.ink).text(b, cx + 10, cy + 14, { width: 26, align: 'center', lineBreak: false })
    doc.font('sans').fontSize(7.5).fillColor(C.slate).text(label, cx + 44, cy + 6, { width: col - 54, height: 10, lineBreak: false, ellipsis: true })
    const v = form.boxes[b]
    doc.font('semi').fontSize(10.5).fillColor(C.ink).text(isMoneyBox(form.type, b) && !Number.isNaN(Number(v)) ? usd(v) : String(v), cx + 44, cy + 18, { width: col - 54, height: 14, lineBreak: false, ellipsis: true })
    if (i % 2 === 1 || i === boxes.length - 1) rowY = cy + rh + 6
  })
  doc.y = rowY
  doc.y += 10
  doc.font('sans').fontSize(8.5).fillColor(C.slate).text(form.type === 'W-2'
    ? 'This is your copy of Form W-2 from PremierRemoteBridge. Keep it with your tax records and use these amounts on your federal and state returns. If any amount looks wrong, contact payroll before you file.'
    : 'This is your copy of Form 1099-NEC from PremierRemoteBridge. Keep it with your tax records. You may be required to pay self-employment tax on this income.', x, doc.y, { width: w })
  footer(doc, `${company.name} · Form ${form.type} · Tax year ${form.year}`)
  doc.end()
}

// ---------- Shipping label (4 × 6 in) with a scannable Code 128 barcode ----------
const CODE128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232']
const STOP = '2331112'
/** Bar/space module widths for a Code 128 (set B) barcode. */
export function code128(text) {
  const vals = [...String(text)].map((c) => c.charCodeAt(0) - 32).filter((v) => v >= 0 && v < 95)
  const check = (104 + vals.reduce((s, v, i) => s + v * (i + 1), 0)) % 103
  return [CODE128[104], ...vals.map((v) => CODE128[v]), CODE128[check], STOP].join('')
}
function barcode(doc, text, x, y, w, h) {
  const widths = code128(text).split('').map(Number)
  const unit = w / widths.reduce((s, n) => s + n, 0)
  let cx = x
  widths.forEach((n, i) => { if (i % 2 === 0) doc.rect(cx, y, n * unit, h).fill('#000000'); cx += n * unit })
}

export function shippingLabelPdf(res, s) {
  const doc = new PDFDocument({ size: [288, 432], margin: 0, info: { Title: `Shipping label ${s.tracking}`, Author: 'PremierRemoteBridge' } })
  for (const [k, f] of Object.entries(FONTS)) doc.registerFont(k, f)
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="label-${s.tracking}.pdf"`, 'Cache-Control': 'private, no-store' })
  doc.pipe(res)
  const X = 12, Wd = 264
  const lines = (a) => [a.name, a.company, a.street, a.street2, `${a.city}, ${a.state} ${a.zip}`, a.country && a.country !== 'US' ? a.country : ''].filter(Boolean)
  doc.rect(6, 6, 276, 420).lineWidth(1.4).strokeColor('#000000').stroke()

  // From + weight
  doc.font('semi').fontSize(6.5).fillColor('#000').text('FROM', X, 14)
  doc.font('sans').fontSize(7.5).text(lines(s.from).join('\n'), X, 23, { width: 160, lineGap: -0.5 })
  doc.font('semi').fontSize(13).text(`${s.weight} ${s.weightUnit.toUpperCase()}`, 180, 14, { width: 96, align: 'right' })
  doc.font('sans').fontSize(7.5).text(`${s.packages > 1 ? `1 OF ${s.packages}` : '1 OF 1'}`, 180, 31, { width: 96, align: 'right' })
  if (s.dims?.l) doc.text(`${s.dims.l} × ${s.dims.w} × ${s.dims.h} ${s.dims.unit}`, 180, 42, { width: 96, align: 'right' })
  doc.moveTo(6, 86).lineTo(282, 86).lineWidth(1).stroke()

  // Ship to
  doc.font('semi').fontSize(7).text('SHIP TO', X, 93)
  doc.font('semi').fontSize(12).text(lines(s.to).join('\n').toUpperCase(), X + 18, 104, { width: Wd - 18, lineGap: 0 })
  doc.moveTo(6, 186).lineTo(282, 186).lineWidth(1).stroke()

  // Service band in the brand's dark teal
  doc.rect(6, 186, 276, 40).fill(C.b950)
  doc.font('semi').fontSize(18).fillColor('#FFFFFF').text(s.service.toUpperCase(), X, 197, { width: 200, lineBreak: false })
  doc.save().translate(236, 192).scale(0.75)
  doc.circle(17, 24, 11).fill(C.b400); doc.circle(31, 24, 11).fill('#FFFFFF'); doc.path('M24 15.515A11 11 0 0 1 24 32.485A11 11 0 0 1 24 15.515Z').fill(C.b800)
  doc.restore()

  // Tracking barcode
  doc.fillColor('#000').font('semi').fontSize(8).text(`TRACKING #: ${s.tracking.replace(/(.{4})/g, '$1 ').trim()}`, X, 236, { width: Wd })
  barcode(doc, s.tracking, 22, 252, 244, 78)
  doc.moveTo(6, 342).lineTo(282, 342).lineWidth(1).stroke()

  // Details
  const row = (k, v, y) => { doc.font('semi').fontSize(6.5).text(k, X, y); doc.font('sans').fontSize(8).text(v || '—', X + 70, y - 1, { width: Wd - 70, lineBreak: false, ellipsis: true }) }
  row('REFERENCE', s.reference, 350)
  row('CONTENTS', s.contents, 362)
  row('SHIP DATE', s.shipDate ? day(s.shipDate) : day(new Date(s.createdAt).toISOString().slice(0, 10)), 374)
  row('EST. DELIVERY', s.eta ? `${day(s.eta)}${s.window ? ` ${s.window}` : ''}` : '', 386)
  doc.font('sans').fontSize(6.5).fillColor(C.slate).text(`${s.carrier} · PremierRemoteBridge`, X, 406, { width: Wd, align: 'center' })
  doc.end()
}
