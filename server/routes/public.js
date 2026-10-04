import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { col } from '../db.js'
import { send, sendAll, templates } from '../mail.js'
import { clean, cleanText, formLimit, isEmail, isPhone } from '../security.js'
import { UPLOAD_TYPES, storeFile, usingBlob } from '../storage.js'

export const pub = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 20 } })
// Trust the file's first bytes, not its name: PDF, DOCX (zip) or legacy DOC (OLE).
const isResume = (buf) => {
  const h = buf.subarray(0, 4).toString('hex')
  return h === '25504446' || h === '504b0304' || h === 'd0cf11e0'
}
const FIELDS = ['Data Entry', 'Customer Support', 'Bookkeeping', 'Accounting', 'Payroll', 'Administrative', 'Virtual Assistant', 'Healthcare Admin', 'HR & Recruiting', 'Sales', 'IT Support', 'Marketing']

pub.post('/resume', formLimit(5, 30), (req, res, next) => upload.single('resume')(req, res, (err) => {
  if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'That file is over 4 MB. Please upload a smaller résumé.' : 'The upload could not be read.' })
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
  const stored = await storeFile({ buffer: f.buffer, type: f.mimetype, name: fileName }, 'resumes')
  await col('submissions').insertOne({ type: 'resume', ...s, fileName, file: stored, fileType: f.mimetype, size: f.size, status: 'new', createdAt: new Date() })
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


// Tells the browser whether to upload files straight to Vercel Blob or via the server.
pub.get('/upload/config', (_req, res) => res.json({ blob: usingBlob() }))

// Issues a short-lived token so the browser can upload one file directly to Blob.
// Only signed-in users, only the known upload kinds, only PDF/JPG/PNG, up to 15 MB.
const UPLOAD_FOLDERS = { identity: 'identity', tax: 'tax-forms', document: 'documents', receipt: 'receipts' }
pub.post('/upload/token', formLimit(60, 60), async (req, res) => {
  if (!usingBlob()) return res.status(400).json({ error: 'Direct upload is not enabled.' })
  try {
    const { handleUpload } = await import('@vercel/blob/client')
    const result = await handleUpload({
      body: req.body,
      request: { headers: { get: (k) => req.headers[String(k).toLowerCase()] } },
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!req.user) throw new Error('Please log in to upload.')
        let kind
        try { kind = JSON.parse(clientPayload || '{}').kind } catch { kind = '' }
        if (!UPLOAD_FOLDERS[kind]) throw new Error('Unknown upload type.')
        if ((kind === 'tax' || kind === 'document') && req.user.role !== 'admin') throw new Error('Admins only.')
        return { allowedContentTypes: kind === 'document' ? UPLOAD_TYPES.document : UPLOAD_TYPES.image, maximumSizeInBytes: 15 * 1024 * 1024, addRandomSuffix: true }
      },
      onUploadCompleted: async () => {}, // the browser reports the URL to the create endpoint; no webhook needed
    })
    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e.message || 'Upload could not be authorized.' })
  }
})

export const PUBLIC_SETTINGS = ['heroTitle', 'heroSubtitle', 'ctaTitle', 'contactEmail', 'contactPhone', 'address', 'announcements']
pub.get('/settings', async (_req, res) => {
  const doc = await col('settings').findOne({ _id: 'site' })
  res.set('Cache-Control', 'public, max-age=60').json({ settings: Object.fromEntries(PUBLIC_SETTINGS.filter((k) => doc?.[k] !== undefined).map((k) => [k, doc[k]])) })
})
