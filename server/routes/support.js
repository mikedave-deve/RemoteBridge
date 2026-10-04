import crypto from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { col } from '../db.js'
import { send, templates } from '../mail.js'
import { clean, cleanText, formLimit, oid, requireAdmin, requireUser } from '../security.js'
import { logActivity, notifyAdmin } from '../people.js'
import { shippingLabelPdf } from '../pdf.js'
import { isDay, nextNumber } from '../work.js'
import { SERVICES, SHIP_STEPS, SHIP_SERVICES, EQUIPMENT_TYPES } from '../../src/lib/support.js'

export const meSupport = Router()
meSupport.use(requireUser)
export const adminSupport = Router()
adminSupport.use(requireAdmin)

const who = (u) => (u ? { id: String(u._id), name: `${u.first} ${u.last}`, employeeId: u.employeeId || '', email: u.email } : null)
const withUsers = async (list) => {
  const ids = [...new Set(list.map((x) => String(x.userId)))].map(oid)
  const map = new Map((await col('users').find({ _id: { $in: ids } }).toArray()).map((u) => [String(u._id), u]))
  return (x) => map.get(String(x.userId))
}

// ======================= Name and surname boxes (Benefits, Company phone line) =======================
const BOXES = { benefits: 'Benefits details', phone: 'Company phone line' }
meSupport.post('/details', formLimit(10, 60), async (req, res) => {
  const box = BOXES[req.body?.box]
  const first = clean(req.body?.first, 60), last = clean(req.body?.last, 60)
  if (!box) return res.status(400).json({ error: 'Unknown form.' })
  if (!first || !last) return res.status(400).json({ error: 'Enter both the name and the surname.' })
  const mail = templates.adminDetails(box, req.user, { first, last })
  try { await send({ to: config.notifyEmail, ...mail }) } catch (e) {
    console.error('[mail]', e.message)
    return res.status(502).json({ error: 'We could not send your details right now. Please try again in a few minutes.' })
  }
  await col('detailSubmissions').insertOne({ userId: req.user._id, box, first, last, at: new Date() })
  notifyAdmin(req.user, box, `Submitted ${box.toLowerCase()}`, `${first} ${last}`, '/admin/requests')
  logActivity(req.user._id, box === 'Company phone line' ? 'Services' : 'Benefits', `Submitted ${box.toLowerCase()}`, `${first} ${last}`)
  res.json({ ok: true })
})

adminSupport.get('/details', async (_req, res) => {
  const list = await col('detailSubmissions').find().sort({ at: -1 }).limit(300).toArray()
  const user = await withUsers(list)
  res.json({ submissions: list.map((d) => ({ id: String(d._id), box: d.box, first: d.first, last: d.last, at: d.at, employee: who(user(d)) })) })
})

// ======================= Company services requests =======================
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 20 } })
const takeFile = (req, res, next) => upload.single('receipt')(req, res, (err) => (err ? res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'That file is over 8 MB.' : 'The upload could not be read.' }) : next()))
const fileType = (buf) => { const h = buf.subarray(0, 4).toString('hex'); return h === '25504446' ? 'application/pdf' : h.startsWith('ffd8ff') ? 'image/jpeg' : h === '89504e47' ? 'image/png' : null }
const publicService = (r, u) => ({
  id: String(r._id), number: r.number, service: r.service, serviceTitle: SERVICES[r.service]?.title || r.service, subject: r.subject, details: r.details,
  amount: r.amount ?? null, hasReceipt: !!r.receipt, receiptName: r.receipt?.name || '', status: r.status, reply: r.reply || '', createdAt: r.createdAt, updatedAt: r.updatedAt,
  ...(u !== undefined && { employee: who(u) }),
})

meSupport.get('/service-requests', async (req, res) => {
  const list = await col('serviceRequests').find({ userId: req.user._id }, { projection: { 'receipt.data': 0 } }).sort({ createdAt: -1 }).toArray()
  res.json({ requests: list.map((r) => publicService(r)) })
})

meSupport.post('/service-requests', formLimit(20, 60), takeFile, async (req, res) => {
  const b = req.body || {}
  const svc = SERVICES[b.service]
  if (!svc || !svc.request) return res.status(400).json({ error: 'Choose a service.' })
  const subject = clean(b.subject, 120), details = cleanText(b.details, 2000)
  if (!subject || !details) return res.status(400).json({ error: 'Add a subject and the details of your request.' })
  let amount, receipt
  if (b.service === 'reimburse') {
    amount = Math.round(Number(b.amount) * 100) / 100
    if (!(amount > 0 && amount < 100000)) return res.status(400).json({ error: 'Enter the amount to reimburse.' })
    const type = req.file && fileType(req.file.buffer)
    if (!type) return res.status(400).json({ error: 'Attach the receipt as a PDF, JPG or PNG.' })
    receipt = { name: clean(req.file.originalname, 120) || 'receipt', type, size: req.file.size, data: req.file.buffer }
  }
  const doc = { userId: req.user._id, number: `SR-${8900 + await nextNumber('serviceRequest')}`, service: b.service, subject, details, ...(amount && { amount }), ...(receipt && { receipt }), status: 'Open', createdAt: new Date() }
  const { insertedId } = await col('serviceRequests').insertOne(doc)
  notifyAdmin(req.user, 'Company services', `New ${svc.title.toLowerCase()} request`, `${doc.number} · ${subject}`, '/admin/requests')
  logActivity(req.user._id, 'Services', `Opened request ${doc.number}`, `${svc.title} · ${subject}`)
  res.json({ request: publicService({ ...doc, _id: insertedId }) })
})

adminSupport.get('/service-requests', async (req, res) => {
  const filter = ['Open', 'In progress', 'Resolved', 'Declined'].includes(req.query.status) ? { status: req.query.status } : {}
  const list = await col('serviceRequests').find(filter, { projection: { 'receipt.data': 0 } }).sort({ createdAt: -1 }).limit(300).toArray()
  const user = await withUsers(list)
  res.json({ requests: list.map((r) => publicService(r, user(r) || null)) })
})

adminSupport.post('/service-requests/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const r = _id && await col('serviceRequests').findOne({ _id }, { projection: { 'receipt.data': 0 } })
  if (!r) return res.status(404).json({ error: 'Request not found.' })
  const status = ['Open', 'In progress', 'Resolved', 'Declined'].includes(req.body?.status) ? req.body.status : r.status
  const reply = cleanText(req.body?.reply, 1000)
  await col('serviceRequests').updateOne({ _id }, { $set: { status, reply, updatedAt: new Date(), updatedBy: req.user.email } })
  logActivity(r.userId, 'Services', `Request ${r.number} is ${status.toLowerCase()}`, reply || SERVICES[r.service]?.title || '')
  res.json({ ok: true })
})

adminSupport.get('/service-requests/:id/receipt', async (req, res) => {
  const _id = oid(req.params.id)
  const r = _id && await col('serviceRequests').findOne({ _id })
  if (!r?.receipt) return res.status(404).json({ error: 'No receipt on this request.' })
  res.set({ 'Content-Type': r.receipt.type, 'Content-Disposition': `attachment; filename="${r.receipt.name.replace(/[^\w.-]/g, '_')}"`, 'Cache-Control': 'private, no-store' })
  res.send(r.receipt.data.buffer)
})

// ======================= Equipment requests =======================
const publicEquip = (r, u) => ({ id: String(r._id), number: r.number, type: r.type, item: r.item, details: r.details, status: r.status, reply: r.reply || '', createdAt: r.createdAt, updatedAt: r.updatedAt, ...(u !== undefined && { employee: who(u) }) })

meSupport.get('/equipment-requests', async (req, res) => {
  const list = await col('equipmentRequests').find({ userId: req.user._id }).sort({ createdAt: -1 }).toArray()
  res.json({ requests: list.map((r) => publicEquip(r)) })
})

meSupport.post('/equipment-requests', formLimit(20, 60), async (req, res) => {
  const b = req.body || {}
  if (!EQUIPMENT_TYPES.includes(b.type)) return res.status(400).json({ error: 'Choose the request type.' })
  const item = clean(b.item, 120), details = cleanText(b.details, 1000)
  if (!item || !details) return res.status(400).json({ error: 'Tell us the item and what you need.' })
  const doc = { userId: req.user._id, number: `EQ-${1000 + await nextNumber('equipmentRequest')}`, type: b.type, item, details, status: 'Open', createdAt: new Date() }
  const { insertedId } = await col('equipmentRequests').insertOne(doc)
  notifyAdmin(req.user, 'Equipment', /lost|stolen/i.test(doc.type) ? 'Reported a lost or stolen device (urgent)' : `New equipment request: ${doc.type.toLowerCase()}`, `${doc.number} · ${item}`, '/admin/requests?tab=equipment')
  logActivity(req.user._id, 'Equipment', `Opened request ${doc.number}`, `${doc.type} · ${item}`)
  res.json({ request: publicEquip({ ...doc, _id: insertedId }) })
})

adminSupport.get('/equipment-requests', async (req, res) => {
  const filter = ['Open', 'In progress', 'Resolved', 'Declined'].includes(req.query.status) ? { status: req.query.status } : {}
  const list = await col('equipmentRequests').find(filter).sort({ createdAt: -1 }).limit(300).toArray()
  const user = await withUsers(list)
  res.json({ requests: list.map((r) => publicEquip(r, user(r) || null)) })
})

adminSupport.post('/equipment-requests/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const r = _id && await col('equipmentRequests').findOne({ _id })
  if (!r) return res.status(404).json({ error: 'Request not found.' })
  const status = ['Open', 'In progress', 'Resolved', 'Declined'].includes(req.body?.status) ? req.body.status : r.status
  const reply = cleanText(req.body?.reply, 1000)
  await col('equipmentRequests').updateOne({ _id }, { $set: { status, reply, updatedAt: new Date(), updatedBy: req.user.email } })
  logActivity(r.userId, 'Equipment', `Request ${r.number} is ${status.toLowerCase()}`, reply || r.item)
  res.json({ ok: true })
})

// ======================= Shipments and tracking =======================
const ALNUM = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
const newTracking = () => `PR${crypto.randomInt(10, 99)}${Array.from({ length: 14 }, () => ALNUM[crypto.randomInt(ALNUM.length)]).join('')}`
const normTracking = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40)
const addr = (a = {}) => ({ name: clean(a.name, 80), company: clean(a.company, 80), street: clean(a.street, 120), street2: clean(a.street2, 120), city: clean(a.city, 60), state: clean(a.state, 40), zip: clean(a.zip, 12), country: clean(a.country, 40) || 'US', phone: clean(a.phone, 20) })
const num = (v, max) => { const n = Math.round(Number(v) * 100) / 100; return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0 }

const publicShipment = (s, u) => ({
  id: String(s._id), tracking: s.tracking, reference: s.reference, carrier: s.carrier, service: s.service, contents: s.contents, from: s.from, to: s.to,
  weight: s.weight, weightUnit: s.weightUnit, dims: s.dims, packages: s.packages, eta: s.eta, window: s.window, status: s.status, paused: !!s.paused, pauseReason: s.pauseReason || '',
  events: [...(s.events || [])].sort((a, b) => new Date(b.at) - new Date(a.at)), shipDate: s.shipDate, deliveredAt: s.deliveredAt, createdAt: s.createdAt, updatedAt: s.updatedAt || s.createdAt,
  ...(u !== undefined && { employee: who(u) }),
})

function shipmentFields(b) {
  const service = SHIP_SERVICES.includes(b.service) ? b.service : SHIP_SERVICES[0]
  return {
    reference: clean(b.reference, 40), carrier: clean(b.carrier, 60) || 'PremierRemoteBridge Logistics', service, contents: clean(b.contents, 160),
    from: addr(b.from), to: addr(b.to), weight: num(b.weight, 2000), weightUnit: b.weightUnit === 'kgs' ? 'kgs' : 'lbs',
    dims: { l: num(b.dims?.l, 200), w: num(b.dims?.w, 200), h: num(b.dims?.h, 200), unit: b.dims?.unit === 'cm' ? 'cm' : 'in' },
    packages: Math.max(1, Math.min(99, Math.round(Number(b.packages) || 1))), eta: isDay(b.eta) ? b.eta : '', window: clean(b.window, 40), shipDate: isDay(b.shipDate) ? b.shipDate : '',
  }
}
const missing = (f) => (!f.to.name || !f.to.street || !f.to.city || !f.to.state || !f.to.zip ? 'Fill in the ship-to name, street, city, state and ZIP.'
  : !f.from.street || !f.from.city ? 'Fill in the ship-from address.' : !(f.weight > 0) ? 'Enter the package weight.' : '')

meSupport.get('/shipments', async (req, res) => {
  const list = await col('shipments').find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20).toArray()
  res.json({ shipments: list.map((s) => ({ tracking: s.tracking, contents: s.contents, status: s.status, paused: !!s.paused })) })
})

meSupport.get('/shipments/:tracking', async (req, res) => {
  const tracking = normTracking(req.params.tracking)
  const s = tracking && await col('shipments').findOne({ tracking, userId: req.user._id })
  if (!s) return res.status(404).json({ error: 'We could not find a shipment with that tracking number on your account. Check the number and try again.' })
  res.json({ shipment: publicShipment(s) })
})

adminSupport.get('/shipments', async (_req, res) => {
  const list = await col('shipments').find().sort({ createdAt: -1 }).limit(300).toArray()
  const user = await withUsers(list)
  res.json({ shipments: list.map((s) => publicShipment(s, user(s) || null)) })
})

adminSupport.post('/shipments', async (req, res) => {
  const _uid = oid(req.body?.userId)
  const user = _uid && await col('users').findOne({ _id: _uid, status: 'approved' })
  if (!user) return res.status(400).json({ error: 'Choose the employee this shipment is for.' })
  const f = shipmentFields(req.body || {})
  const err = missing(f); if (err) return res.status(400).json({ error: err })
  let tracking = normTracking(req.body.tracking)
  if (tracking && await col('shipments').findOne({ tracking })) return res.status(409).json({ error: 'That tracking number is already used by another shipment.' })
  if (!tracking) do tracking = newTracking(); while (await col('shipments').findOne({ tracking }))
  const now = new Date()
  const doc = { userId: user._id, tracking, ...f, status: SHIP_STEPS[0], paused: false, events: [{ at: now, status: SHIP_STEPS[0], location: [f.from.city, f.from.state].filter(Boolean).join(', '), text: 'Shipping label created. The package will be handed to the carrier soon.' }], createdAt: now, createdBy: req.user.email }
  const { insertedId } = await col('shipments').insertOne(doc)
  logActivity(user._id, 'Equipment', 'A shipment is on its way to you', `${f.contents || 'Package'} · tracking ${tracking}`)
  res.json({ shipment: publicShipment({ ...doc, _id: insertedId }, user) })
})

async function loadShipment(req, res) {
  const _id = oid(req.params.id)
  const s = _id && await col('shipments').findOne({ _id })
  if (!s) res.status(404).json({ error: 'Shipment not found.' })
  return s
}
const reply = async (res, _id) => { const s = await col('shipments').findOne({ _id }); res.json({ shipment: publicShipment(s, await col('users').findOne({ _id: s.userId })) }) }

adminSupport.patch('/shipments/:id', async (req, res) => {
  const s = await loadShipment(req, res); if (!s) return
  const f = shipmentFields({ ...s, ...req.body })
  const err = missing(f); if (err) return res.status(400).json({ error: err })
  const tracking = normTracking(req.body.tracking) || s.tracking
  if (tracking !== s.tracking && await col('shipments').findOne({ tracking })) return res.status(409).json({ error: 'That tracking number is already used by another shipment.' })
  const now = new Date()
  const $set = { ...f, tracking, updatedAt: now }
  const $push = []
  if (f.eta !== s.eta && s.eta) $push.push({ at: now, status: s.status, location: '', text: `Delivery date changed to ${new Date(`${f.eta}T12:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.` })
  if (JSON.stringify(f.to) !== JSON.stringify(s.to)) $push.push({ at: now, status: s.status, location: '', text: `Delivery address updated to ${[f.to.street, f.to.city, f.to.state].filter(Boolean).join(', ')}.` })
  await col('shipments').updateOne({ _id: s._id }, { $set, ...($push.length && { $push: { events: { $each: $push } } }) })
  if ($push.length) logActivity(s.userId, 'Equipment', 'Your delivery was updated', `${tracking} · ${$push.map((e) => e.text).join(' ')}`)
  return reply(res, s._id)
})

// Move the package along: a new status and/or a scan event with a location.
adminSupport.post('/shipments/:id/events', async (req, res) => {
  const s = await loadShipment(req, res); if (!s) return
  const status = SHIP_STEPS.includes(req.body?.status) ? req.body.status : s.status
  const location = clean(req.body?.location, 80)
  const text = cleanText(req.body?.text, 300) || (status !== s.status ? {
    'On the way': 'Departed from facility. On the way to the destination.', 'Out for delivery': 'Out for delivery today.', Delivered: 'Delivered. Left at the front door.', 'Label created': 'Shipping label created.',
  }[status] : '')
  if (!text && status === s.status) return res.status(400).json({ error: 'Add an update or choose a new status.' })
  const at = req.body?.at && !Number.isNaN(Date.parse(req.body.at)) ? new Date(req.body.at) : new Date()
  await col('shipments').updateOne({ _id: s._id }, { $set: { status, updatedAt: new Date(), ...(status === 'Delivered' && { deliveredAt: at, paused: false, pauseReason: '' }) }, $push: { events: { at, status, location, text } } })
  logActivity(s.userId, 'Equipment', status === 'Delivered' ? 'Your package was delivered' : `Shipment update: ${status.toLowerCase()}`, `${s.tracking} · ${text}`)
  return reply(res, s._id)
})

adminSupport.post('/shipments/:id/pause', async (req, res) => {
  const s = await loadShipment(req, res); if (!s) return
  const reason = cleanText(req.body?.reason, 300)
  if (!reason) return res.status(400).json({ error: 'Say why the delivery is paused. The employee sees this reason.' })
  if (s.status === 'Delivered') return res.status(400).json({ error: 'This package was already delivered.' })
  const at = new Date()
  await col('shipments').updateOne({ _id: s._id }, { $set: { paused: true, pauseReason: reason, updatedAt: at }, $push: { events: { at, status: s.status, location: '', text: `Delivery paused: ${reason}`, alert: true } } })
  logActivity(s.userId, 'Equipment', 'Your delivery is paused', `${s.tracking} · ${reason}`)
  return reply(res, s._id)
})

adminSupport.post('/shipments/:id/resume', async (req, res) => {
  const s = await loadShipment(req, res); if (!s) return
  const at = new Date()
  const note = cleanText(req.body?.note, 300)
  await col('shipments').updateOne({ _id: s._id }, { $set: { paused: false, pauseReason: '', updatedAt: at }, $push: { events: { at, status: s.status, location: '', text: note || 'Delivery resumed. The package is moving again.' } } })
  logActivity(s.userId, 'Equipment', 'Your delivery is moving again', `${s.tracking}${note ? ` · ${note}` : ''}`)
  return reply(res, s._id)
})

adminSupport.delete('/shipments/:id', async (req, res) => {
  const s = await loadShipment(req, res); if (!s) return
  await col('shipments').deleteOne({ _id: s._id })
  res.json({ ok: true })
})

adminSupport.get('/shipments/:id/label', async (req, res) => {
  const s = await loadShipment(req, res); if (!s) return
  shippingLabelPdf(res, s)
})
