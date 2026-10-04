import crypto from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { col } from '../db.js'
import { clean, cleanText, oid, requireAdmin, requireUser } from '../security.js'
import { logActivity, notifyAdmin } from '../people.js'
import { payStubPdf, taxFormPdf } from '../pdf.js'
import { deleteFile, storeFile, streamFile } from '../storage.js'
import {
  PUNCH, addDays, benefitsOf, buildWeek, canPunch, clockState, dayKey, depositSplit, fmtDay, isDay, nextNumber, publicAccount,
  publicStub, seal, unseal, weekLabel, weekOf, ytdBefore,
} from '../work.js'
import { BALANCE_TYPES, PLANS, RETIREMENT } from '../../src/lib/benefits.js'
import { FORM_BOXES } from '../../src/lib/taxForms.js'
import { FREQUENCIES, LIMITS, buildStub, estimateFederal, k401Limit, num, r2 } from '../../src/lib/payroll.js'

export const meWork = Router()
meWork.use(requireUser)
export const adminWork = Router()
adminWork.use(requireAdmin)

const COMPANY = 'PremierRemoteBridge, Inc.'
const company = async () => ({ name: COMPANY, address: (await col('settings').findOne({ _id: 'site' }))?.address || '' })
const usd = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const userById = async (id) => { const _id = oid(id); return _id && col('users').findOne({ _id, role: { $ne: 'admin' } }) }
const payInfo = (u) => {
  const p = u.profile || {}
  return { type: p.employmentType || '', rate: num(p.payRate), rateText: p.payRate || '', frequency: FREQUENCIES.includes(p.payFrequency) ? p.payFrequency : 'Biweekly' }
}

// ======================= Pay =======================
async function ytdThrough(stub) {
  const year = stub.payDate.slice(0, 4)
  const list = await col('payStubs').find({ userId: stub.userId, payDate: { $gte: `${year}-01-01`, $lte: stub.payDate } }).toArray()
  const sum = (f) => r2(list.reduce((s, x) => s + (f(x) || 0), 0))
  const byLabel = {}
  for (const s of list) for (const l of [...s.earnings, ...s.taxes, ...s.deductions]) byLabel[l.label] = r2((byLabel[l.label] || 0) + l.amount)
  return { gross: sum((x) => x.gross), totalTax: sum((x) => x.totalTax), totalDed: sum((x) => x.totalDed), match: sum((x) => x.match), byLabel }
}

async function makeStub(user, b, excludeId) {
  if (!isDay(b.payDate) || !isDay(b.start) || !isDay(b.end)) throw Object.assign(new Error('Enter the pay date and the pay period dates.'), { status: 400 })
  if (b.end < b.start) throw Object.assign(new Error('The pay period cannot end before it starts.'), { status: 400 })
  const input = {
    earnings: (Array.isArray(b.input?.earnings) ? b.input.earnings : []).slice(0, 20).map((e) => ({ label: clean(e.label, 60), hours: e.hours === '' || e.hours == null ? '' : num(e.hours), rate: e.rate === '' || e.rate == null ? '' : num(e.rate), amount: num(e.amount) })),
    taxes: (Array.isArray(b.input?.taxes) ? b.input.taxes : []).slice(0, 10).map((t) => ({ label: clean(t.label, 60), amount: num(t.amount) })),
    otherDeductions: (Array.isArray(b.input?.otherDeductions) ? b.input.otherDeductions : []).slice(0, 10).map((d) => ({ label: clean(d.label, 60), amount: num(d.amount), pretax: !!d.pretax })),
  }
  const ben = benefitsOf(user)
  const ytd = await ytdBefore(user._id, b.payDate, excludeId)
  const calc = buildStub(input, { plans: ben.plans.filter((p) => p.enrolled), k401: ben.k401 }, ytd)
  return { input, calc, ytd, ben }
}

meWork.get('/pay', async (req, res) => {
  const stubs = await col('payStubs').find({ userId: req.user._id }).sort({ payDate: -1, createdAt: -1 }).toArray()
  res.json({ stubs: stubs.map(publicStub), accounts: (req.user.bank || []).map(publicAccount), pay: payInfo(req.user) })
})

meWork.get('/pay/:id/pdf', async (req, res) => {
  const _id = oid(req.params.id)
  const stub = _id && await col('payStubs').findOne({ _id, userId: req.user._id })
  if (!stub) return res.status(404).json({ error: 'Pay stub not found.' })
  payStubPdf(res, { stub, user: req.user, ytd: await ytdThrough(stub), company: await company() })
})

meWork.post('/pay/accounts', async (req, res) => {
  const b = req.body || {}
  const routing = String(b.routing || '').replace(/\D/g, ''), account = String(b.account || '').replace(/\D/g, '')
  if (!/^\d{9}$/.test(routing)) return res.status(400).json({ error: 'The routing number must be exactly 9 digits.' })
  if (!/^\d{4,17}$/.test(account) || account !== String(b.confirm || '').replace(/\D/g, '')) return res.status(400).json({ error: 'Account numbers must match and contain 4 to 17 digits.' })
  const list = req.user.bank || []
  if (list.length >= 3) return res.status(400).json({ error: 'You can have up to 3 deposit accounts. Remove one first.' })
  const primary = !list.length
  const amount = primary ? 0 : r2(num(b.amount))
  if (!primary && !(amount > 0)) return res.status(400).json({ error: 'Enter how much of each paycheck goes to this account. Your primary account receives the rest.' })
  const acc = {
    id: crypto.randomUUID(), type: b.type === 'Savings' ? 'Savings' : 'Checking', routing: seal(routing), account: seal(account),
    last4: account.slice(-4), routingLast4: routing.slice(-4), primary, amount, status: 'Pending verification', addedAt: new Date(),
  }
  await col('users').updateOne({ _id: req.user._id }, { $push: { bank: acc } })
  logActivity(req.user._id, 'Pay', 'Added a direct deposit account', `${acc.type} ••••${acc.last4} · pending verification`)
  notifyAdmin(req.user, 'Direct deposit', 'Added a direct deposit account', `${acc.type} ••••${acc.last4}`, '/admin/pay')
  res.json({ accounts: [...list, acc].map(publicAccount) })
})

meWork.delete('/pay/accounts/:id', async (req, res) => {
  let list = req.user.bank || []
  const acc = list.find((a) => a.id === req.params.id)
  if (!acc) return res.status(404).json({ error: 'Account not found.' })
  list = list.filter((a) => a.id !== acc.id)
  if (acc.primary && list.length) list[0] = { ...list[0], primary: true, amount: 0 }
  await col('users').updateOne({ _id: req.user._id }, { $set: { bank: list } })
  logActivity(req.user._id, 'Pay', 'Removed a direct deposit account', `${acc.type} ••••${acc.last4}`)
  notifyAdmin(req.user, 'Direct deposit', 'Removed a direct deposit account', `${acc.type} ••••${acc.last4}`, '/admin/pay')
  res.json({ accounts: list.map(publicAccount) })
})

adminWork.get('/pay', async (req, res) => {
  const user = await userById(req.query.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  const stubs = await col('payStubs').find({ userId: user._id }).sort({ payDate: -1, createdAt: -1 }).toArray()
  res.json({
    stubs: stubs.map((s) => ({ ...publicStub(s), input: s.input })),
    accounts: (user.bank || []).map((a) => ({ ...publicAccount(a), routing: unseal(a.routing), account: unseal(a.account) })),
    pay: payInfo(user), benefits: benefitsOf(user), w4: user.tax?.w4 || null,
  })
})

adminWork.post('/pay/preview', async (req, res) => {
  const user = await userById(req.body?.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  const b = { ...req.body, payDate: isDay(req.body.payDate) ? req.body.payDate : dayKey(), start: isDay(req.body.start) ? req.body.start : dayKey(), end: isDay(req.body.end) ? req.body.end : dayKey() }
  const { calc } = await makeStub(user, b, oid(req.body.excludeId))
  res.json({ stub: calc, fedEstimate: estimateFederal(calc.incomeTaxable, user.tax?.w4 || {}, payInfo(user).frequency) })
})

adminWork.post('/pay', async (req, res) => {
  const user = await userById(req.body?.userId)
  if (!user || user.status !== 'approved') return res.status(404).json({ error: 'Choose an approved employee.' })
  const { input, calc } = await makeStub(user, req.body)
  if (!(calc.gross > 0)) return res.status(400).json({ error: 'Add at least one earnings line with an amount.' })
  if (calc.net < 0) return res.status(400).json({ error: 'Taxes and deductions are more than gross pay.' })
  const seq = await nextNumber(`payStub-${req.body.payDate.slice(0, 4)}`)
  const doc = {
    userId: user._id, number: `PS-${req.body.payDate.slice(0, 4)}-${String(seq).padStart(4, '0')}`, payDate: req.body.payDate, start: req.body.start, end: req.body.end,
    input, ...calc, frequency: payInfo(user).frequency, deposits: depositSplit(user.bank, calc.net), note: cleanText(req.body.note, 500), createdBy: req.user.email, createdAt: new Date(),
  }
  const { insertedId } = await col('payStubs').insertOne(doc)
  logActivity(user._id, 'Pay', 'New pay stub available', `Pay date ${fmtDay(doc.payDate)} · net pay ${usd(doc.net)}`)
  res.json({ stub: { ...publicStub({ ...doc, _id: insertedId }), input } })
})

adminWork.patch('/pay/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const stub = _id && await col('payStubs').findOne({ _id })
  if (!stub) return res.status(404).json({ error: 'Pay stub not found.' })
  const user = await col('users').findOne({ _id: stub.userId })
  const { input, calc } = await makeStub(user, req.body, _id)
  if (!(calc.gross > 0)) return res.status(400).json({ error: 'Add at least one earnings line with an amount.' })
  if (calc.net < 0) return res.status(400).json({ error: 'Taxes and deductions are more than gross pay.' })
  const $set = { payDate: req.body.payDate, start: req.body.start, end: req.body.end, input, ...calc, deposits: depositSplit(user.bank, calc.net), note: cleanText(req.body.note, 500), updatedAt: new Date(), updatedBy: req.user.email }
  await col('payStubs').updateOne({ _id }, { $set })
  logActivity(user._id, 'Pay', 'A pay stub was updated by payroll', `Pay date ${fmtDay($set.payDate)} · net pay ${usd($set.net)}`)
  res.json({ stub: { ...publicStub({ ...stub, ...$set }), input } })
})

adminWork.delete('/pay/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const stub = _id && await col('payStubs').findOneAndDelete({ _id })
  if (!stub) return res.status(404).json({ error: 'Pay stub not found.' })
  res.json({ ok: true })
})

adminWork.get('/pay/:id/pdf', async (req, res) => {
  const _id = oid(req.params.id)
  const stub = _id && await col('payStubs').findOne({ _id })
  if (!stub) return res.status(404).json({ error: 'Pay stub not found.' })
  payStubPdf(res, { stub, user: await col('users').findOne({ _id: stub.userId }), ytd: await ytdThrough(stub), company: await company() })
})

adminWork.post('/pay/accounts/:userId/:id/verify', async (req, res) => {
  const user = await userById(req.params.userId)
  const acc = user?.bank?.find((a) => a.id === req.params.id)
  if (!acc) return res.status(404).json({ error: 'Account not found.' })
  await col('users').updateOne({ _id: user._id, 'bank.id': acc.id }, { $set: { 'bank.$.status': 'Verified', 'bank.$.verifiedAt': new Date() } })
  logActivity(user._id, 'Pay', 'Direct deposit account verified', `${acc.type} ••••${acc.last4}`)
  res.json({ ok: true })
})

// ======================= Tax forms =======================
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 60 } })
const publicForm = (f) => ({ id: String(f._id), type: f.type, year: f.year, issued: f.issued, employer: f.employer, ein: f.ein, employerAddress: f.employerAddress, boxes: f.boxes, hasFile: !!f.file, fileName: f.file?.name || '', createdAt: f.createdAt, updatedAt: f.updatedAt })
const FILING = ['Single or married filing separately', 'Married filing jointly', 'Head of household']

meWork.get('/taxes', async (req, res) => {
  const forms = await col('taxForms').find({ userId: req.user._id }, { projection: { 'file.data': 0 } }).sort({ year: -1, createdAt: -1 }).toArray()
  const t = req.user.tax || {}
  res.json({ forms: forms.map(publicForm), w4: t.w4 || null, state: t.state || null, electronic: t.electronic !== false, workCity: req.user.profile?.workCity || '', workState: req.user.profile?.workState || '' })
})

async function sendForm(res, form, user) {
  if (!form) return res.status(404).json({ error: 'Tax form not found.' })
  taxFormPdf(res, { form, user, company: await company() })
}
async function sendFile(res, form) {
  if (!form?.file) return res.status(404).json({ error: 'No uploaded file for this form.' })
  try { await streamFile(res, form.file) } catch { if (!res.headersSent) res.status(502).json({ error: 'Could not read the file.' }) }
}
meWork.get('/taxes/:id/pdf', async (req, res) => { const _id = oid(req.params.id); return sendForm(res, _id && await col('taxForms').findOne({ _id, userId: req.user._id }), req.user) })
meWork.get('/taxes/:id/file', async (req, res) => { const _id = oid(req.params.id); return sendFile(res, _id && await col('taxForms').findOne({ _id, userId: req.user._id })) })

meWork.put('/taxes/w4', async (req, res) => {
  const b = req.body || {}
  if (!FILING.includes(b.filingStatus)) return res.status(400).json({ error: 'Choose a filing status.' })
  if (b.signed !== true) return res.status(400).json({ error: 'Sign the certificate to submit your W-4.' })
  const w4 = { filingStatus: b.filingStatus, multipleJobs: !!b.multipleJobs, dependents: Math.max(0, r2(num(b.dependents))), extra: Math.max(0, r2(num(b.extra))), updatedAt: new Date() }
  await col('users').updateOne({ _id: req.user._id }, { $set: { 'tax.w4': w4 } })
  logActivity(req.user._id, 'Tax', 'Submitted a new Form W-4', w4.filingStatus)
  notifyAdmin(req.user, 'Tax', 'Submitted a new Form W-4', `${w4.filingStatus}${w4.extra ? ` · ${usd(w4.extra)} extra per paycheck` : ''}`, '/admin/taxes')
  res.json({ w4 })
})

meWork.put('/taxes/consent', async (req, res) => {
  const electronic = req.body?.electronic === true
  await col('users').updateOne({ _id: req.user._id }, { $set: { 'tax.electronic': electronic } })
  logActivity(req.user._id, 'Tax', electronic ? 'Chose electronic tax forms' : 'Chose paper tax forms by mail')
  res.json({ electronic })
})

adminWork.get('/taxes', async (req, res) => {
  const user = await userById(req.query.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  const forms = await col('taxForms').find({ userId: user._id }, { projection: { 'file.data': 0 } }).sort({ year: -1, createdAt: -1 }).toArray()
  res.json({ forms: forms.map(publicForm), w4: user.tax?.w4 || null, state: user.tax?.state || null, electronic: user.tax?.electronic !== false, company: await company() })
})

// Year totals from the pay stubs, ready to drop into a W-2.
adminWork.get('/taxes/prefill', async (req, res) => {
  const user = await userById(req.query.userId)
  const year = Number(req.query.year)
  if (!user || !(year > 2000)) return res.status(400).json({ error: 'Choose an employee and a year.' })
  const stubs = await col('payStubs').find({ userId: user._id, payDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } }).toArray()
  const sum = (f) => r2(stubs.reduce((s, x) => s + (f(x) || 0), 0))
  const tax = (re) => sum((x) => x.taxes.filter((t) => re.test(t.label)).reduce((s, t) => s + t.amount, 0))
  const pretaxOther = sum((x) => x.deductions.filter((d) => d.pretax && !/^401\(k\)|^Medical|^Dental|^Vision/.test(d.label)).reduce((s, d) => s + d.amount, 0))
  const fica = sum((x) => x.ficaWages), k401 = sum((x) => (/traditional/.test(x.deductions.find((d) => /^401\(k\)/.test(d.label))?.label || '') ? x.k401 : 0))
  const roth = r2(sum((x) => x.k401) - k401)
  const wages = r2(fica - k401 - pretaxOther)
  const p = user.profile || {}
  const boxes = {
    1: wages, 2: tax(/federal/i), 3: Math.min(fica, LIMITS.ssWageBase), 4: tax(/social security/i), 5: fica, 6: tax(/medicare/i),
    ...(k401 && { '12a': `D ${k401.toFixed(2)}` }), ...(roth && { [k401 ? '12b' : '12a']: `AA ${roth.toFixed(2)}` }), ...((k401 || roth) && { 13: 'Retirement plan' }),
    ...(p.workState && { 15: p.workState }), 16: wages, 17: tax(/state/i),
    ...(tax(/city|local|municipal|school/i) && { 18: fica, 19: tax(/city|local|municipal|school/i), 20: p.workCity || '' }),
  }
  res.json({ boxes, stubs: stubs.length })
})

function formFields(b, type) {
  const boxes = {}
  let raw = b.boxes
  if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { raw = {} } }
  for (const [k] of FORM_BOXES[type]) if (raw?.[k] !== undefined && String(raw[k]).trim() !== '') boxes[k] = clean(raw[k], 80)
  return { type, year: Number(b.year), issued: isDay(b.issued) ? b.issued : dayKey(), employer: clean(b.employer, 120) || COMPANY, ein: clean(b.ein, 20), employerAddress: clean(b.employerAddress, 160), boxes }
}
const takeFile = (req, res, next) => upload.single('file')(req, res, (err) => (err ? res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'That file is over 8 MB.' : 'The upload could not be read.' }) : next()))
const fileOf = async (f) => {
  if (!f) return null
  const h = f.buffer.subarray(0, 4).toString('hex')
  const type = h === '25504446' ? 'application/pdf' : h.startsWith('ffd8ff') ? 'image/jpeg' : h === '89504e47' ? 'image/png' : null
  return type ? storeFile({ buffer: f.buffer, type, name: clean(f.originalname, 120) || 'tax-form' }, 'tax-forms') : null
}

adminWork.post('/taxes', takeFile, async (req, res) => {
  const user = await userById(req.body?.userId)
  if (!user || user.status !== 'approved') return res.status(404).json({ error: 'Choose an approved employee.' })
  if (!FORM_BOXES[req.body.type]) return res.status(400).json({ error: 'Choose a form type.' })
  const f = formFields(req.body, req.body.type)
  if (!(f.year >= 2000 && f.year <= 2100)) return res.status(400).json({ error: 'Enter the tax year.' })
  if (!Object.keys(f.boxes).length) return res.status(400).json({ error: 'Fill in at least one box.' })
  const file = await fileOf(req.file)
  if (req.file && !file) return res.status(400).json({ error: 'Attach a PDF, JPG or PNG file.' })
  const doc = { userId: user._id, ...f, ...(file && { file }), createdBy: req.user.email, createdAt: new Date() }
  const { insertedId } = await col('taxForms').insertOne(doc)
  logActivity(user._id, 'Tax', `Your ${f.year} Form ${f.type} is ready`, 'Download it from Tax forms')
  res.json({ form: publicForm({ ...doc, _id: insertedId }) })
})

adminWork.patch('/taxes/:id', takeFile, async (req, res) => {
  const _id = oid(req.params.id)
  const form = _id && await col('taxForms').findOne({ _id }, { projection: { 'file.data': 0 } })
  if (!form) return res.status(404).json({ error: 'Tax form not found.' })
  const f = formFields(req.body, form.type)
  if (!(f.year >= 2000 && f.year <= 2100)) return res.status(400).json({ error: 'Enter the tax year.' })
  const file = await fileOf(req.file)
  if (req.file && !file) return res.status(400).json({ error: 'Attach a PDF, JPG or PNG file.' })
  if (file || req.body.removeFile === 'true') await deleteFile(form.file)
  const update = { $set: { ...f, ...(file && { file }), updatedAt: new Date() }, ...(req.body.removeFile === 'true' && !file && { $unset: { file: '' } }) }
  await col('taxForms').updateOne({ _id }, update)
  logActivity(form.userId, 'Tax', `Your ${f.year} Form ${form.type} was updated`, 'Download the latest copy from Tax forms')
  res.json({ form: publicForm(await col('taxForms').findOne({ _id }, { projection: { 'file.data': 0 } })) })
})

adminWork.delete('/taxes/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const form = _id && await col('taxForms').findOneAndDelete({ _id })
  if (!form) return res.status(404).json({ error: 'Tax form not found.' })
  await deleteFile(form.file)
  res.json({ ok: true })
})
adminWork.get('/taxes/:id/pdf', async (req, res) => {
  const _id = oid(req.params.id)
  const form = _id && await col('taxForms').findOne({ _id })
  return sendForm(res, form, form && await col('users').findOne({ _id: form.userId }))
})
adminWork.get('/taxes/:id/file', async (req, res) => { const _id = oid(req.params.id); return sendFile(res, _id && await col('taxForms').findOne({ _id })) })

adminWork.put('/taxes/state/:userId', async (req, res) => {
  const user = await userById(req.params.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  const b = req.body || {}
  const state = { form: clean(b.form, 60), exemptions: clean(b.exemptions, 20), localTax: clean(b.localTax, 120), schoolDistrict: clean(b.schoolDistrict, 120), updatedAt: new Date() }
  await col('users').updateOne({ _id: user._id }, { $set: { 'tax.state': state } })
  logActivity(user._id, 'Tax', 'State and local withholding updated by payroll', [state.form, state.localTax].filter(Boolean).join(' · '))
  res.json({ state })
})

// ======================= Timesheet =======================
const punchesFor = (userId, start) => col('punches').find({ userId, at: { $gte: new Date(`${addDays(start, -1)}T00:00:00Z`), $lt: new Date(`${addDays(start, 8)}T12:00:00Z`) } }).sort({ at: 1 }).toArray()
const publicSheet = (t, user) => ({
  id: String(t._id), weekStart: t.weekStart, week: weekLabel(t.weekStart), days: t.days, total: t.total, overtime: t.overtime, status: t.status, note: t.note || '',
  reviewNote: t.reviewNote || '', submittedAt: t.submittedAt, reviewedAt: t.reviewedAt,
  ...(user && { employee: { id: String(user._id), name: `${user.first} ${user.last}`, employeeId: user.employeeId } }),
})

meWork.get('/time', async (req, res) => {
  const thisWeek = weekOf(dayKey())
  const start = isDay(req.query.week) ? weekOf(req.query.week) : thisWeek
  const [punches, last, recent, sheets] = await Promise.all([
    punchesFor(req.user._id, start),
    col('punches').find({ userId: req.user._id }).sort({ at: -1 }).limit(1).next(),
    col('punches').find({ userId: req.user._id, at: { $gte: new Date(`${addDays(thisWeek, -57)}T00:00:00Z`) } }).sort({ at: 1 }).limit(5000).toArray(),
    col('timesheets').find({ userId: req.user._id }).sort({ weekStart: -1 }).limit(60).toArray(),
  ])
  const todayKey = dayKey()
  // Earlier weeks: every submitted week, plus recent weeks with clock punches that were never submitted.
  const submitted = new Set(sheets.map((x) => x.weekStart))
  const unsent = [...new Set(recent.filter((p) => p.type === 'in').map((p) => weekOf(dayKey(p.at))))]
    .filter((w) => w < thisWeek && w >= addDays(thisWeek, -56) && !submitted.has(w))
    .map((w) => ({ weekStart: w, week: weekLabel(w), total: buildWeek(w, recent).total, overtime: buildWeek(w, recent).overtime, status: 'Not submitted' }))
  const previous = [...sheets.filter((x) => x.weekStart !== thisWeek).map((x) => publicSheet(x)), ...unsent].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  res.json({
    week: { start, label: weekLabel(start), current: start === thisWeek }, state: clockState(last),
    today: recent.filter((p) => dayKey(p.at) === todayKey).map((p) => ({ type: p.type, what: PUNCH[p.type], at: p.at })),
    ...buildWeek(start, punches), submission: (() => { const s = sheets.find((x) => x.weekStart === start); return s ? publicSheet(s) : null })(),
    previous, approver: req.user.profile?.manager || 'HR',
  })
})

meWork.post('/time/punch', async (req, res) => {
  const type = req.body?.type
  if (!PUNCH[type]) return res.status(400).json({ error: 'Unknown time clock action.' })
  const last = await col('punches').find({ userId: req.user._id }).sort({ at: -1 }).limit(1).next()
  const state = clockState(last)
  if (!canPunch(state, type)) return res.status(409).json({ error: state === 'out' ? 'You are clocked out. Clock in first.' : state === 'break' ? 'You are on a meal break. End your break first.' : 'You are already clocked in.' })
  const at = new Date()
  await col('punches').insertOne({ userId: req.user._id, type, at })
  const time = at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
  logActivity(req.user._id, 'Time', PUNCH[type], `${time} Eastern`)
  if (type === 'in' || type === 'out') notifyAdmin(req.user, 'Time clock', PUNCH[type], `${fmtDay(dayKey(at))} at ${time} Eastern`, '/admin/time')
  res.json({ ok: true, state: clockState({ type }) })
})

meWork.post('/time/submit', async (req, res) => {
  const thisWeek = weekOf(dayKey())
  const start = isDay(req.body?.week) ? weekOf(req.body.week) : thisWeek
  if (start > thisWeek) return res.status(400).json({ error: 'You cannot submit a future week.' })
  if (req.body?.certify !== true) return res.status(400).json({ error: 'Confirm that the timesheet is accurate.' })
  const existing = await col('timesheets').findOne({ userId: req.user._id, weekStart: start })
  if (existing && existing.status !== 'Returned') return res.status(409).json({ error: `This week was already submitted (${existing.status.toLowerCase()}).` })
  const last = await col('punches').find({ userId: req.user._id }).sort({ at: -1 }).limit(1).next()
  if (start === thisWeek && clockState(last) !== 'out') return res.status(400).json({ error: 'Clock out before you submit this week.' })
  const week = buildWeek(start, await punchesFor(req.user._id, start))
  if (!(week.total > 0)) return res.status(400).json({ error: 'There are no hours to submit for this week.' })
  const days = week.days.map((d) => ({ date: d.date, in: d.in, out: d.out, breakMin: d.breakMin, hours: d.hours }))
  const doc = { userId: req.user._id, weekStart: start, days, total: week.total, overtime: week.overtime, status: 'Pending approval', note: cleanText(req.body.note, 500), submittedAt: new Date() }
  await col('timesheets').updateOne({ userId: req.user._id, weekStart: start }, { $set: doc, $unset: { reviewedAt: '', reviewNote: '', reviewedBy: '' } }, { upsert: true })
  logActivity(req.user._id, 'Time', 'Submitted a timesheet', `${weekLabel(start)} · ${week.total.toFixed(2)} hours`)
  notifyAdmin(req.user, 'Timesheet', 'Submitted a timesheet for approval', `${weekLabel(start)} · ${week.total.toFixed(2)} hours${week.overtime ? ` (${week.overtime.toFixed(2)} overtime)` : ''}`, '/admin/time')
  res.json({ submission: publicSheet(await col('timesheets').findOne({ userId: req.user._id, weekStart: start })) })
})

const withUsers = async (list) => {
  const users = await col('users').find({ _id: { $in: [...new Set(list.map((x) => String(x.userId)))].map(oid) } }).toArray()
  const map = new Map(users.map((u) => [String(u._id), u]))
  return (x) => map.get(String(x.userId))
}

adminWork.get('/timesheets', async (req, res) => {
  const filter = ['Pending approval', 'Approved', 'Returned'].includes(req.query.status) ? { status: req.query.status } : {}
  const list = await col('timesheets').find(filter).sort({ submittedAt: -1 }).limit(300).toArray()
  const who = await withUsers(list)
  res.json({ timesheets: list.filter(who).map((t) => publicSheet(t, who(t))) })
})

adminWork.post('/timesheets/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const t = _id && await col('timesheets').findOne({ _id })
  if (!t) return res.status(404).json({ error: 'Timesheet not found.' })
  const status = { approve: 'Approved', return: 'Returned' }[req.body?.action]
  if (!status) return res.status(400).json({ error: 'Unknown action.' })
  const reviewNote = cleanText(req.body.note, 500)
  await col('timesheets').updateOne({ _id }, { $set: { status, reviewNote, reviewedAt: new Date(), reviewedBy: req.user.email } })
  logActivity(t.userId, 'Time', status === 'Approved' ? 'Timesheet approved' : 'Timesheet returned for changes', `${weekLabel(t.weekStart)}${reviewNote ? ` · ${reviewNote}` : ''}`)
  res.json({ ok: true })
})

adminWork.get('/punches', async (_req, res) => {
  const list = await col('punches').find({ at: { $gte: new Date(Date.now() - 7 * 86400000) } }).sort({ at: -1 }).limit(200).toArray()
  const who = await withUsers(list)
  const lastByUser = new Map()
  for (const p of list) if (!lastByUser.has(String(p.userId))) lastByUser.set(String(p.userId), p)
  res.json({
    punches: list.filter(who).map((p) => ({ what: PUNCH[p.type], type: p.type, at: p.at, employee: { id: String(p.userId), name: `${who(p).first} ${who(p).last}`, employeeId: who(p).employeeId } })),
    working: [...lastByUser.values()].filter((p) => p.type !== 'out' && who(p)).map((p) => ({ id: String(p.userId), name: `${who(p).first} ${who(p).last}`, state: clockState(p), since: p.at })),
  })
})

// ======================= Time off =======================
const PAID = new Set(BALANCE_TYPES)
const TYPES = [...BALANCE_TYPES, 'Unpaid leave', 'Bereavement leave', 'Jury duty']
const shownStatus = (r, today) => (r.status === 'Approved' && r.to < today ? 'Taken' : r.status)
const publicReq = (r, user) => ({
  id: String(r._id), number: r.number, type: r.type, from: r.from, to: r.to, hours: r.hours, note: r.note || '', status: shownStatus(r, dayKey()), reviewNote: r.reviewNote || '',
  submittedAt: r.submittedAt, reviewedAt: r.reviewedAt, ...(user && { employee: { id: String(user._id), name: `${user.first} ${user.last}`, employeeId: user.employeeId } }),
})
async function balancesOf(user) {
  const today = dayKey()
  const list = await col('timeOff').find({ userId: user._id, status: { $in: ['Approved', 'Pending'] } }).toArray()
  return BALANCE_TYPES.map((type) => {
    const mine = list.filter((r) => r.type === type)
    const sum = (f) => r2(mine.filter(f).reduce((s, r) => s + r.hours, 0))
    const accrued = r2(num(user.timeOff?.[type]))
    const used = sum((r) => r.status === 'Approved' && r.to < today)
    const scheduled = sum((r) => r.status === 'Approved' && r.to >= today)
    const pending = sum((r) => r.status === 'Pending')
    return { type, accrued, used, scheduled, pending, available: r2(Math.max(0, accrued - used - scheduled)) }
  })
}

meWork.get('/time-off', async (req, res) => {
  const list = await col('timeOff').find({ userId: req.user._id }).sort({ submittedAt: -1 }).toArray()
  res.json({ balances: await balancesOf(req.user), requests: list.map((r) => publicReq(r)), types: TYPES, approver: req.user.profile?.manager || 'HR', today: dayKey() })
})

meWork.post('/time-off', async (req, res) => {
  const b = req.body || {}
  const type = TYPES.includes(b.type) ? b.type : null, from = b.from, to = b.to || b.from, hours = r2(num(b.hours))
  if (!type) return res.status(400).json({ error: 'Choose the type of time off.' })
  if (!isDay(from)) return res.status(400).json({ error: 'Choose the first day of your time off.' })
  if (!isDay(to) || to < from) return res.status(400).json({ error: 'The last day cannot be before the first day.' })
  if (from < dayKey()) return res.status(400).json({ error: 'The first day cannot be in the past.' })
  const days = Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000) + 1
  if (!(hours > 0)) return res.status(400).json({ error: 'Enter the number of hours you need.' })
  if (hours > days * 24) return res.status(400).json({ error: 'That is more hours than the days you chose.' })
  if (PAID.has(type)) {
    const bal = (await balancesOf(req.user)).find((x) => x.type === type)
    const free = r2(bal.available - bal.pending)
    if (hours > free) return res.status(400).json({ error: `You have ${free} unscheduled hours of ${type.toLowerCase()} available.` })
  }
  const doc = { userId: req.user._id, number: `TO-${1000 + await nextNumber('timeOff')}`, type, from, to, hours, note: cleanText(b.note, 500), status: 'Pending', submittedAt: new Date() }
  const { insertedId } = await col('timeOff').insertOne(doc)
  const dates = from === to ? fmtDay(from) : `${fmtDay(from)} – ${fmtDay(to)}`
  logActivity(req.user._id, 'Time off', `Requested ${type.toLowerCase()}`, `${dates} · ${hours} hours`)
  notifyAdmin(req.user, 'Time off', `Requested ${type.toLowerCase()}`, `${dates} · ${hours} hours`, '/admin/time-off')
  res.json({ request: publicReq({ ...doc, _id: insertedId }), balances: await balancesOf(req.user) })
})

adminWork.get('/time-off', async (req, res) => {
  const filter = ['Pending', 'Approved', 'Declined'].includes(req.query.status) ? { status: req.query.status } : {}
  const list = await col('timeOff').find(filter).sort({ submittedAt: -1 }).limit(300).toArray()
  const who = await withUsers(list)
  res.json({ requests: list.filter(who).map((r) => publicReq(r, who(r))) })
})

adminWork.post('/time-off/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const r = _id && await col('timeOff').findOne({ _id })
  if (!r) return res.status(404).json({ error: 'Request not found.' })
  const status = { approve: 'Approved', decline: 'Declined' }[req.body?.action]
  if (!status) return res.status(400).json({ error: 'Unknown action.' })
  const reviewNote = cleanText(req.body.note, 500)
  await col('timeOff').updateOne({ _id }, { $set: { status, reviewNote, reviewedAt: new Date(), reviewedBy: req.user.email } })
  const dates = r.from === r.to ? fmtDay(r.from) : `${fmtDay(r.from)} – ${fmtDay(r.to)}`
  logActivity(r.userId, 'Time off', `Time off ${status.toLowerCase()}`, `${r.type} · ${dates}${reviewNote ? ` · ${reviewNote}` : ''}`)
  res.json({ ok: true })
})

adminWork.get('/time-off/balances/:userId', async (req, res) => {
  const user = await userById(req.params.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  res.json({ balances: await balancesOf(user) })
})

adminWork.put('/time-off/balances/:userId', async (req, res) => {
  const user = await userById(req.params.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  const timeOff = Object.fromEntries(BALANCE_TYPES.map((t) => [t, Math.max(0, r2(num(req.body?.accrued?.[t])))]))
  await col('users').updateOne({ _id: user._id }, { $set: { timeOff } })
  logActivity(user._id, 'Time off', 'Time off balances updated by HR', BALANCE_TYPES.map((t) => `${t}: ${timeOff[t]} h`).join(' · '))
  res.json({ balances: await balancesOf({ ...user, timeOff }) })
})

// ======================= Benefits =======================
async function retirementStats(user) {
  const year = String(new Date().getFullYear())
  const stubs = await col('payStubs').find({ userId: user._id }).sort({ payDate: -1 }).toArray()
  const sum = (list, f) => r2(list.reduce((s, x) => s + (f(x) || 0), 0))
  const thisYear = stubs.filter((s) => s.payDate.startsWith(year))
  const ben = benefitsOf(user)
  return {
    contributedYtd: sum(thisYear, (s) => s.k401), matchYtd: sum(thisYear, (s) => s.match),
    balance: r2(ben.k401.openingBalance + sum(stubs, (s) => s.k401) + sum(stubs, (s) => s.match)),
    lastGross: stubs[0]?.gross || 0,
  }
}

meWork.get('/benefits', async (req, res) => {
  res.json({ ...benefitsOf(req.user), catalog: PLANS, retirement: RETIREMENT, limits: LIMITS, stats: await retirementStats(req.user), pay: payInfo(req.user) })
})

meWork.put('/benefits/401k', async (req, res) => {
  const ben = benefitsOf(req.user)
  if (!ben.k401.enrolled) return res.status(400).json({ error: 'You are not enrolled in the 401(k) plan yet. Contact HR to enroll.' })
  const pct = Number(req.body?.pct)
  if (!Number.isInteger(pct) || pct < 0 || pct > RETIREMENT.maxPct) return res.status(400).json({ error: `Choose a whole percentage from 0 to ${RETIREMENT.maxPct}.` })
  const pay = payInfo(req.user)
  const stats = await retirementStats(req.user)
  const perYear = (stats.lastGross ? stats.lastGross * ({ Weekly: 52, Biweekly: 26, 'Semi-monthly': 24, Monthly: 12 }[pay.frequency] || 26) : pay.rate * 2080) * pct / 100
  const limit = k401Limit(ben.k401.catchUp)
  if (perYear > limit) return res.status(400).json({ error: `That would exceed the ${LIMITS.year} IRS limit of ${usd(limit)} for employee contributions.` })
  await col('users').updateOne({ _id: req.user._id }, { $set: { 'benefits.k401.pct': pct, 'benefits.k401.changedAt': new Date() } })
  logActivity(req.user._id, 'Benefits', '401(k) contribution changed', `${ben.k401.pct}% → ${pct}% of pay`)
  notifyAdmin(req.user, 'Benefits', 'Changed their 401(k) contribution', `${ben.k401.pct}% → ${pct}% of pay`, '/admin/benefits')
  res.json({ pct })
})

adminWork.get('/benefits/:userId', async (req, res) => {
  const user = await userById(req.params.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  res.json({ ...benefitsOf(user), catalog: PLANS, limits: LIMITS, stats: await retirementStats(user), pay: payInfo(user), dob: user.personal?.dob || '' })
})

adminWork.put('/benefits/:userId', async (req, res) => {
  const user = await userById(req.params.userId)
  if (!user) return res.status(404).json({ error: 'Employee not found.' })
  const b = req.body || {}
  const before = benefitsOf(user)
  const plans = {}
  for (const p of PLANS) {
    const e = b.plans?.[p.name] || {}
    plans[p.name] = { enrolled: !!e.enrolled, tier: p.tiers.includes(e.tier) ? e.tier : p.tiers[0], perCheck: Math.max(0, r2(num(e.perCheck))), employer: Math.max(0, r2(num(e.employer))), memberId: clean(e.memberId, 40) }
  }
  const k = b.k401 || {}
  const k401 = {
    enrolled: !!k.enrolled, pct: Math.min(RETIREMENT.maxPct, Math.max(0, Math.round(num(k.pct)))), matchPct: Math.min(100, Math.max(0, r2(num(k.matchPct)))),
    catchUp: ['none', '50+', '60-63'].includes(k.catchUp) ? k.catchUp : 'none', roth: !!k.roth, openingBalance: Math.max(0, r2(num(k.openingBalance))),
    changedAt: before.k401.changedAt,
  }
  const beneficiaries = (Array.isArray(b.beneficiaries) ? b.beneficiaries : []).slice(0, 8).map((x) => ({ name: clean(x.name, 80), relation: clean(x.relation, 40), type: x.type === 'Contingent' ? 'Contingent' : 'Primary', share: Math.min(100, Math.max(0, Math.round(num(x.share)))) })).filter((x) => x.name)
  for (const t of ['Primary', 'Contingent']) {
    const list = beneficiaries.filter((x) => x.type === t)
    if (list.length && list.reduce((s, x) => s + x.share, 0) !== 100) return res.status(400).json({ error: `${t} beneficiary shares must add up to 100%.` })
  }
  await col('users').updateOne({ _id: user._id }, { $set: { benefits: { plans, k401, beneficiaries, updatedAt: new Date() } } })
  const now = benefitsOf({ benefits: { plans, k401 } })
  const added = now.plans.filter((p, i) => p.enrolled && !before.plans[i].enrolled).map((p) => p.name)
  const removed = now.plans.filter((p, i) => !p.enrolled && before.plans[i].enrolled).map((p) => p.name)
  if (k401.enrolled && !before.k401.enrolled) added.push('401(k)')
  if (!k401.enrolled && before.k401.enrolled) removed.push('401(k)')
  logActivity(user._id, 'Benefits', 'Your benefits were updated by HR', [added.length && `Enrolled: ${added.join(', ')}`, removed.length && `Ended: ${removed.join(', ')}`].filter(Boolean).join(' · ') || 'Coverage details changed')
  res.json({ ...benefitsOf(await col('users').findOne({ _id: user._id })), stats: await retirementStats(user) })
})

// ======================= Admin notifications =======================
adminWork.get('/notifications', async (_req, res) => {
  const [list, unread] = await Promise.all([
    col('notifications').find().sort({ at: -1 }).limit(40).toArray(),
    col('notifications').countDocuments({ read: false }),
  ])
  res.json({ unread, notifications: list.map((n) => ({ id: String(n._id), name: n.name, employeeId: n.employeeId, type: n.type, text: n.text, meta: n.meta, link: n.link, read: n.read, at: n.at })) })
})

adminWork.post('/notifications/read', async (req, res) => {
  const _id = oid(req.body?.id)
  await col('notifications').updateMany(_id ? { _id } : { read: false }, { $set: { read: true } })
  res.json({ ok: true })
})
