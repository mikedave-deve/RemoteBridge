import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { col } from '../db.js'
import { send, sendAll, templates } from '../mail.js'
import { clean, cleanText, formLimit, isEmail, isPhone } from '../security.js'

export const pub = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 20 } })
// Trust the file's first bytes, not its name: PDF, DOCX (zip) or legacy DOC (OLE).
const isResume = (buf) => {
  const h = buf.subarray(0, 4).toString('hex')
  return h === '25504446' || h === '504b0304' || h === 'd0cf11e0'
}
const FIELDS = ['Data Entry', 'Customer Support', 'Bookkeeping', 'Accounting', 'Payroll', 'Administrative', 'Virtual Assistant', 'Healthcare Admin', 'HR & Recruiting', 'Sales', 'IT Support', 'Marketing']

pub.post('/resume', formLimit(5, 30), (req, res, next) => upload.single('resume')(req, res, (err) => {
  if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'That file is over 8 MB.' : 'The upload could not be read.' })
  next()
}), async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.json({ ok: true })
  const s = {
    first: clean(b.first, 50), last: clean(b.last, 50), email: clean(b.email, 120).toLowerCase(), phone: clean(b.phone, 20),
    field: clean(b.field, 60), level: clean(b.level, 60), note: cleanText(b.note, 1000), role: clean(b.role, 120),
  }
  const errors = {}
  if (!s.first) errors.first = 'Enter your first name.'
  if (!s.last) errors.last = 'Enter your last name.'
  if (!isEmail(s.email)) errors.email = 'Enter a valid email address.'
  if (!isPhone(s.phone)) errors.phone = 'Enter a 10-digit US phone number.'
  if (!FIELDS.includes(s.field)) errors.field = 'Choose a field of interest.'
  if (!s.level) errors.level = 'Choose your experience level.'
  if (b.consent !== 'true') errors.consent = 'Please agree so we can store your résumé.'
  const f = req.file
  if (!f) errors.file = 'Attach your résumé.'
  else if (!/\.(pdf|docx?)$/i.test(f.originalname) || !isResume(f.buffer)) errors.file = 'Use a real PDF or Word file.'
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  const fileName = clean(f.originalname, 120).replace(/[^\w.\- ]/g, '_')
  await col('submissions').insertOne({ type: 'resume', ...s, fileName, file: f.buffer, fileType: f.mimetype, size: f.size, status: 'new', createdAt: new Date() })
  await sendAll([
    send({ to: config.notifyEmail, ...templates.adminResume({ ...s, fileName }), attachments: [{ filename: fileName, content: f.buffer, contentType: f.mimetype }] }),
    send({ to: s.email, ...templates.confirmResume(s) }),
  ])
  res.json({ ok: true })
})

pub.post('/contact', formLimit(5, 30), async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.json({ ok: true })
  const m = {
    name: clean(b.name, 80), company: clean(b.company, 120), email: clean(b.email, 120).toLowerCase(),
    need: clean(b.need, 60), roles: clean(b.roles, 20), message: cleanText(b.message, 3000),
  }
  const errors = {}
  if (!m.name) errors.name = 'Enter your name.'
  if (!m.company) errors.company = 'Enter your company.'
  if (!isEmail(m.email)) errors.email = 'Enter a valid work email.'
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })
  await col('submissions').insertOne({ type: 'contact', ...m, status: 'new', createdAt: new Date() })
  await send({ to: config.notifyEmail, ...templates.adminContact(m) }).catch((e) => console.error('[mail]', e.message))
  res.json({ ok: true })
})


export const PUBLIC_SETTINGS = ['heroTitle', 'heroSubtitle', 'ctaTitle', 'contactEmail', 'contactPhone', 'address', 'announcements']
pub.get('/settings', async (_req, res) => {
  const doc = await col('settings').findOne({ _id: 'site' })
  res.set('Cache-Control', 'public, max-age=60').json({ settings: Object.fromEntries(PUBLIC_SETTINGS.filter((k) => doc?.[k] !== undefined).map((k) => [k, doc[k]])) })
})
