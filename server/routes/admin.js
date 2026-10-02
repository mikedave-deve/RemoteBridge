import { Router } from 'express'
import { col } from '../db.js'
import { clean, cleanText, isPhone, oid, publicUser, requireAdmin } from '../security.js'
import { setStatus } from './auth.js'
import { PUBLIC_SETTINGS } from './public.js'

export const admin = Router()
admin.use(requireAdmin)

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const adminUser = (u) => ({ ...publicUser(u), createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, reviewedAt: u.reviewedAt })

admin.get('/stats', async (_req, res) => {
  const [users, subs] = await Promise.all([
    col('users').aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray(),
    col('submissions').aggregate([{ $group: { _id: { type: '$type', status: '$status' }, n: { $sum: 1 } } }]).toArray(),
  ])
  const u = Object.fromEntries(users.map((x) => [x._id, x.n]))
  const count = (type, status) => subs.filter((s) => s._id.type === type && (!status || s._id.status === status)).reduce((a, s) => a + s.n, 0)
  res.json({
    users: { pending: u.pending || 0, approved: u.approved || 0, declined: u.declined || 0, suspended: u.suspended || 0 },
    resumes: { total: count('resume'), new: count('resume', 'new') },
    messages: { total: count('contact'), new: count('contact', 'new') },
  })
})

// ---------- Employees ----------
admin.get('/users', async (req, res) => {
  const q = clean(req.query.q, 60)
  const filter = {}
  if (['pending', 'approved', 'declined', 'suspended'].includes(req.query.status)) filter.status = req.query.status
  if (q) filter.$or = ['first', 'last', 'email'].map((k) => ({ [k]: { $regex: escRe(q), $options: 'i' } }))
  const list = await col('users').find(filter).sort({ createdAt: -1 }).limit(500).toArray()
  res.json({ users: list.map(adminUser) })
})

const PROFILE = ['title', 'client', 'department', 'manager', 'employmentType', 'payRate', 'startDate', 'workCity', 'workState', 'address', 'notes']
admin.patch('/users/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const user = _id && await col('users').findOne({ _id })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const b = req.body || {}
  const $set = {}
  if (b.first !== undefined) $set.first = clean(b.first, 50)
  if (b.last !== undefined) $set.last = clean(b.last, 50)
  if (b.phone !== undefined) {
    if (b.phone && !isPhone(b.phone)) return res.status(400).json({ error: 'Phone must look like (555) 123-4567.' })
    $set.phone = clean(b.phone, 20)
  }
  for (const k of PROFILE) if (b.profile?.[k] !== undefined) $set[`profile.${k}`] = k === 'notes' ? cleanText(b.profile[k], 2000) : clean(b.profile[k], 120)
  if (b.role !== undefined) {
    if (!['employee', 'admin'].includes(b.role)) return res.status(400).json({ error: 'Unknown role.' })
    if (String(user._id) === String(req.user._id) && b.role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own admin access.' })
    $set.role = b.role
  }
  $set.updatedAt = new Date()
  await col('users').updateOne({ _id }, { $set })
  res.json({ user: adminUser(await col('users').findOne({ _id })) })
})

admin.post('/users/:id/status', async (req, res) => {
  const _id = oid(req.params.id)
  const user = _id && await col('users').findOne({ _id })
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const status = req.body?.status
  if (!['approved', 'declined', 'suspended'].includes(status)) return res.status(400).json({ error: 'Unknown status.' })
  if (String(user._id) === String(req.user._id)) return res.status(400).json({ error: 'You cannot change your own status.' })
  await setStatus(user, status, req.user.email)
  res.json({ user: adminUser(await col('users').findOne({ _id })) })
})

// ---------- Submissions inbox ----------
admin.get('/submissions', async (req, res) => {
  const filter = ['resume', 'contact'].includes(req.query.type) ? { type: req.query.type } : {}
  const list = await col('submissions').find(filter, { projection: { file: 0 } }).sort({ createdAt: -1 }).limit(500).toArray()
  res.json({ submissions: list.map((s) => ({ ...s, id: String(s._id), _id: undefined })) })
})
admin.patch('/submissions/:id', async (req, res) => {
  const _id = oid(req.params.id)
  if (!_id || !['new', 'reviewed', 'archived'].includes(req.body?.status)) return res.status(400).json({ error: 'Invalid request.' })
  await col('submissions').updateOne({ _id }, { $set: { status: req.body.status } })
  res.json({ ok: true })
})
admin.get('/submissions/:id/file', async (req, res) => {
  const s = oid(req.params.id) && await col('submissions').findOne({ _id: oid(req.params.id), type: 'resume' })
  if (!s?.file) return res.status(404).json({ error: 'File not found.' })
  res.set({ 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${s.fileName.replace(/"/g, '')}"`, 'X-Content-Type-Options': 'nosniff' })
  res.send(s.file.buffer ? Buffer.from(s.file.buffer) : s.file)
})


// ---------- Site content ----------
admin.get('/settings', async (_req, res) => res.json({ settings: (await col('settings').findOne({ _id: 'site' })) || {} }))
admin.put('/settings', async (req, res) => {
  const b = req.body || {}
  const $set = { updatedAt: new Date(), updatedBy: req.user.email }
  for (const k of PUBLIC_SETTINGS) {
    if (b[k] === undefined) continue
    $set[k] = k === 'announcements'
      ? (Array.isArray(b[k]) ? b[k] : []).slice(0, 10).map((a) => ({ date: clean(a.date, 40), title: clean(a.title, 120), body: cleanText(a.body, 600) })).filter((a) => a.title)
      : cleanText(b[k], k.startsWith('hero') || k === 'ctaTitle' ? 400 : 200)
  }
  await col('settings').updateOne({ _id: 'site' }, { $set }, { upsert: true })
  res.json({ settings: await col('settings').findOne({ _id: 'site' }) })
})
