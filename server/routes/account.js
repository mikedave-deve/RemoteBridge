import crypto from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { col } from '../db.js'
import { send, templates } from '../mail.js'
import {
  clean, cleanText, formLimit, hashPassword, isEmail, isPhone, oid, publicUser, requireAdmin, requireUser, sessionHash, strongPassword, verifyPassword,
} from '../security.js'
import { logActivity, notifyAdmin } from '../people.js'
import { benefitsOf, seal, unseal } from '../work.js'
import { UPLOAD_TYPES, deleteFile, readFile, refToFile, storeFile, streamFile } from '../storage.js'

export const meAccount = Router()
meAccount.use(requireUser)
export const adminAccount = Router()
adminAccount.use(requireAdmin)

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 2, fields: 20 } })
const files = (fields) => (req, res, next) => upload.fields(fields)(req, res, (err) => (err ? res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'A file is over 10 MB.' : 'The upload could not be read.' }) : next()))
const kind = (buf) => { const h = buf.subarray(0, 4).toString('hex'); return h === '25504446' ? 'application/pdf' : h.startsWith('ffd8ff') ? 'image/jpeg' : h === '89504e47' ? 'image/png' : null }
const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }
const fileOf = (f, { docs = false, folder = 'uploads' } = {}) => {
  if (!f) return null
  const type = kind(f.buffer)
  if (!type && !docs) return null
  return storeFile({ buffer: f.buffer, type: type || 'application/octet-stream', name: clean(f.originalname, 120) || 'file' }, folder)
}
const sendFile = async (res, file, inline = false) => {
  try { await streamFile(res, file, { inline }) } catch { if (!res.headersSent) res.status(502).json({ error: 'Could not read the file.' }) }
}
const nowET = () => new Date()
const fail = (res, error, status = 400) => res.status(status).json({ error })

// ======================= Help & HR =======================
const TOPICS = ['Payroll and pay stubs', 'Benefits and enrollment', 'Time off and leave', 'Taxes and W-2', 'Equipment and IT', 'Something else']
meAccount.post('/help', formLimit(10, 60), async (req, res) => {
  const topic = TOPICS.includes(req.body?.topic) ? req.body.topic : null
  const message = cleanText(req.body?.message, 2000)
  if (!topic) return fail(res, 'Choose a topic.')
  if (!message) return fail(res, 'Tell us how we can help.')
  const { seq } = await col('counters').findOneAndUpdate({ _id: 'helpRequest' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  const r = { userId: req.user._id, number: `HR-${10000 + seq}`, topic, message, createdAt: new Date() }
  try { await send({ to: config.notifyEmail, ...templates.adminHelp(req.user, r) }) } catch (e) {
    console.error('[mail]', e.message); return fail(res, 'We could not send your request right now. Please try again in a few minutes.', 502)
  }
  await col('helpRequests').insertOne(r)
  notifyAdmin(req.user, 'Help & HR', `Sent a request: ${topic.toLowerCase()}`, `${r.number} · ${message.slice(0, 80)}`, '')
  logActivity(req.user._id, 'Help', `Sent request ${r.number}`, topic)
  res.json({ number: r.number })
})

// ======================= Profile & security =======================
meAccount.put('/profile', async (req, res) => {
  const b = req.body || {}
  const preferred = clean(b.preferred, 50), phone = clean(b.phone, 20), email = clean(b.email, 120).toLowerCase()
  const street = clean(b.street, 120), cityState = clean(b.cityState, 80), zip = clean(b.zip, 10)
  const dob = /^\d{4}-\d{2}-\d{2}$/.test(b.dob || '') ? b.dob : '', ssnLast4 = /^\d{4}$/.test(b.ssnLast4 || '') ? b.ssnLast4 : ''
  if (phone && !isPhone(phone)) return fail(res, 'Phone must look like (555) 123-4567.')
  if (!isEmail(email)) return fail(res, 'Enter a valid email address.')
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) return fail(res, 'ZIP code must be 5 digits.')
  if (b.ssnLast4 && !ssnLast4) return fail(res, 'Enter only the last 4 digits of your Social Security number.')
  if (dob && (dob > new Date().toISOString().slice(0, 10) || dob < '1900-01-01')) return fail(res, 'Enter a valid date of birth.')
  if (email !== req.user.email && await col('users').findOne({ email })) return fail(res, 'That email is already used by another account.', 409)
  const address = street ? [street, [cityState, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ') : ''
  const $set = { phone, email, personal: { ...(req.user.personal || {}), preferred, street, cityState, zip, dob, ssnLast4: ssnLast4 || req.user.personal?.ssnLast4 || '' }, 'profile.address': address, updatedAt: new Date() }
  await col('users').updateOne({ _id: req.user._id }, { $set })
  logActivity(req.user._id, 'Profile', 'Updated your personal information')
  if (address !== (req.user.profile?.address || '')) notifyAdmin(req.user, 'Profile', 'Changed their home address', address, `/admin/users?status=approved`)
  res.json({ user: publicUser(await col('users').findOne({ _id: req.user._id })) })
})

// Profile picture: a small JPEG/PNG data URL made in the browser (resized to 320 px).
meAccount.put('/photo', async (req, res) => {
  const photo = String(req.body?.photo || '')
  const m = photo.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/)
  if (!m || photo.length > 400_000) return fail(res, 'Choose a JPG or PNG picture.')
  if (!kind(Buffer.from(m[2], 'base64'))) return fail(res, 'That file is not a real picture.')
  await col('users').updateOne({ _id: req.user._id }, { $set: { photo } })
  logActivity(req.user._id, 'Profile', 'Changed your profile picture')
  res.json({ user: publicUser(await col('users').findOne({ _id: req.user._id })) })
})
meAccount.delete('/photo', async (req, res) => {
  await col('users').updateOne({ _id: req.user._id }, { $unset: { photo: '' } })
  res.json({ user: publicUser(await col('users').findOne({ _id: req.user._id })) })
})

meAccount.get('/emergency', (req, res) => res.json({ contacts: req.user.emergency || [] }))
meAccount.put('/emergency', async (req, res) => {
  const list = (Array.isArray(req.body?.contacts) ? req.body.contacts : []).slice(0, 5).map((c) => ({ name: clean(c.name, 80), relation: clean(c.relation, 40), phone: clean(c.phone, 20) })).filter((c) => c.name)
  if (list.some((c) => !c.phone || !isPhone(c.phone))) return fail(res, 'Each contact needs a phone number like (555) 123-4567.')
  await col('users').updateOne({ _id: req.user._id }, { $set: { emergency: list } })
  logActivity(req.user._id, 'Profile', 'Updated your emergency contacts', `${list.length} on file`)
  res.json({ contacts: list })
})

meAccount.get('/security', async (req, res) => {
  const [signIns, sessions] = await Promise.all([
    col('activity').find({ userId: req.user._id, text: 'Signed in' }).sort({ at: -1 }).limit(5).toArray(),
    col('sessions').find({ userId: req.user._id, expiresAt: { $gt: new Date() } }).toArray(),
  ])
  res.json({ signIns: signIns.map((s, i) => ({ device: s.meta, at: s.at, current: i === 0 })), otherSessions: sessions.filter((s) => s.tokenHash !== sessionHash(req)).length, passwordChangedAt: req.user.passwordChangedAt || req.user.createdAt })
})

meAccount.post('/password', formLimit(10, 30), async (req, res) => {
  const { current = '', next = '', confirm = '' } = req.body || {}
  if (!await verifyPassword(String(current), req.user.passwordHash)) return fail(res, 'Your current password is not correct.')
  if (!strongPassword(String(next), [req.user.first, req.user.last, req.user.email.split('@')[0]])) return fail(res, 'Use at least 8 characters with upper and lower case letters, a number and a symbol, and not your name.')
  if (next !== confirm) return fail(res, 'The new passwords do not match.')
  if (next === current) return fail(res, 'Choose a password you have not just used.')
  await col('users').updateOne({ _id: req.user._id }, { $set: { passwordHash: await hashPassword(next), passwordChangedAt: new Date() } })
  // Keep this device signed in; sign out everywhere else.
  await col('sessions').deleteMany({ userId: req.user._id, tokenHash: { $ne: sessionHash(req) } })
  logActivity(req.user._id, 'Security', 'Changed your password')
  res.json({ ok: true })
})

meAccount.post('/sessions/others/logout', async (req, res) => {
  const r = await col('sessions').deleteMany({ userId: req.user._id, tokenHash: { $ne: sessionHash(req) } })
  logActivity(req.user._id, 'Security', 'Signed out of all other devices', `${r.deletedCount} session${r.deletedCount === 1 ? '' : 's'} ended`)
  res.json({ ended: r.deletedCount })
})

// ======================= Identity verification =======================
const SSN = 'Social Security number'
export const DOC_TYPES = ['Driver’s license', SSN]
const CHECKS = { background: 'Criminal background check', employment: 'Employment history verification', education: 'Education verification' }
function identityOf(u, docs) {
  const id = u.identity || {}
  const i9 = id.i9 || {}, ev = id.everify || {}
  const screening = Object.entries(CHECKS).map(([key, name]) => ({ key, name, status: id.screening?.[key]?.status || 'Pending', at: id.screening?.[key]?.at || null }))
  const documents = docs.map((d) => ({ id: String(d._id), type: d.type, last4: d.last4 || '', hasPhotos: !!d.front, status: d.status, submittedAt: d.submittedAt, reviewedAt: d.reviewedAt, note: d.note || '' }))
  const i9Status = i9.status || (documents.length ? 'Pending review' : 'Not started')
  const allVerified = i9Status === 'Verified' && ev.status === 'Authorized' && screening.every((s) => s.status !== 'Pending')
  return {
    overall: allVerified ? 'Verified' : documents.length || i9.status ? 'In progress' : 'Not started',
    i9: { status: i9Status, section1At: i9.section1At || documents[documents.length - 1]?.submittedAt || null, section2At: i9.section2At || null },
    everify: { status: ev.status || 'Not started', case: ev.case || '', closedAt: ev.closedAt || null },
    screening, documents,
  }
}
const docsFor = (userId) => col('identityDocs').find({ userId }, { projection: { 'front.data': 0, 'back.data': 0, number: 0 } }).sort({ submittedAt: -1 }).toArray()

meAccount.get('/identity', async (req, res) => res.json({ ...identityOf(req.user, await docsFor(req.user._id)), types: DOC_TYPES }))

meAccount.post('/identity', formLimit(6, 60), files([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), async (req, res) => {
  const type = DOC_TYPES.includes(req.body?.type) ? req.body.type : null
  if (!type) return fail(res, 'Choose the document type.')
  let doc, mail, attachments = []
  if (type === SSN) {
    // Social Security number: typed digits only, no pictures.
    const number = String(req.body?.number || '').replace(/\D/g, '')
    if (!/^\d{9}$/.test(number) || /^(000|666|9)/.test(number) || number.slice(3, 5) === '00' || number.slice(5) === '0000') return fail(res, 'Enter your 9-digit Social Security number.')
    const shown = `${number.slice(0, 3)}-${number.slice(3, 5)}-${number.slice(5)}`
    doc = { userId: req.user._id, type, number: seal(shown), last4: number.slice(5), status: 'Pending review', submittedAt: new Date() }
    mail = templates.adminIdentity(req.user, { type, number: shown }, [])
  } else {
    // Driver's license: a selfie with the front and one with the back.
    const front = req.body.frontRef ? await refToFile(req.body.frontRef, { allowed: UPLOAD_TYPES.image }) : await fileOf(req.files?.front?.[0], { folder: 'identity' })
    const back = req.body.backRef ? await refToFile(req.body.backRef, { allowed: UPLOAD_TYPES.image }) : await fileOf(req.files?.back?.[0], { folder: 'identity' })
    if (!front) return fail(res, 'Add your front selfie as a JPG, PNG or PDF.')
    if (!back) return fail(res, 'Add your back selfie as a JPG, PNG or PDF.')
    const names = [`front-selfie.${ext[front.type]}`, `back-selfie.${ext[back.type]}`]
    doc = { userId: req.user._id, type, front, back, status: 'Pending review', submittedAt: new Date() }
    mail = templates.adminIdentity(req.user, { type }, names)
    const [fb, bb] = await Promise.all([readFile(front), readFile(back)])
    attachments = [{ filename: names[0], content: fb.buffer, contentType: front.type }, { filename: names[1], content: bb.buffer, contentType: back.type }]
  }
  try { await send({ to: config.notifyEmail, ...mail, attachments }) } catch (e) {
    console.error('[mail]', e.message); return fail(res, 'We could not send your documents right now. Please try again in a few minutes.', 502)
  }
  await col('identityDocs').insertOne(doc)
  const update = { 'identity.i9.section1At': req.user.identity?.i9?.section1At || new Date() }
  if (req.user.identity?.i9?.status !== 'Verified') update['identity.i9.status'] = 'Pending review'
  await col('users').updateOne({ _id: req.user._id }, { $set: update })
  const what = doc.last4 ? `${type} ending ${doc.last4}` : `${type} (front and back selfies)`
  notifyAdmin(req.user, 'Identity', 'Submitted an identity document for review', what, `/admin/identity?user=${req.user._id}`)
  logActivity(req.user._id, 'Identity', 'Submitted an identity document', what)
  const u = await col('users').findOne({ _id: req.user._id })
  res.json({ ...identityOf(u, await docsFor(u._id)), types: DOC_TYPES })
})

adminAccount.get('/identity/:userId', async (req, res) => {
  const _id = oid(req.params.userId)
  const u = _id && await col('users').findOne({ _id })
  if (!u) return fail(res, 'Employee not found.', 404)
  const docs = await col('identityDocs').find({ userId: u._id }, { projection: { 'front.data': 0, 'back.data': 0 } }).sort({ submittedAt: -1 }).toArray()
  const view = identityOf(u, docs)
  view.documents = view.documents.map((d, i) => ({ ...d, number: unseal(docs[i].number), front: docs[i].front?.name, back: docs[i].back?.name }))
  res.json(view)
})

adminAccount.get('/identity/doc/:id/:side', async (req, res) => {
  const _id = oid(req.params.id)
  const d = _id && ['front', 'back'].includes(req.params.side) && await col('identityDocs').findOne({ _id })
  if (!d?.[req.params.side]) return fail(res, 'File not found.', 404)
  sendFile(res, d[req.params.side], true)
})

adminAccount.post('/identity/doc/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const d = _id && await col('identityDocs').findOne({ _id })
  if (!d) return fail(res, 'Document not found.', 404)
  const status = { verify: 'Verified', reject: 'Rejected' }[req.body?.action]
  if (!status) return fail(res, 'Unknown action.')
  const note = cleanText(req.body?.note, 300)
  await col('identityDocs').updateOne({ _id }, { $set: { status, note, reviewedAt: new Date(), reviewedBy: req.user.email } })
  logActivity(d.userId, 'Identity', `Your ${d.type} was ${status.toLowerCase()}`, note || `ending ${d.last4}`)
  res.json({ ok: true })
})

// Verify (or reset) one box: Form I-9, E-Verify or a screening check. "all" verifies everything at once.
adminAccount.post('/identity/:userId/verify', async (req, res) => {
  const _id = oid(req.params.userId)
  const u = _id && await col('users').findOne({ _id })
  if (!u) return fail(res, 'Employee not found.', 404)
  const item = req.body?.item, undo = req.body?.undo === true, now = new Date()
  const items = item === 'all' ? ['i9', 'everify', ...Object.keys(CHECKS)] : [item]
  if (!items.every((x) => x === 'i9' || x === 'everify' || CHECKS[x])) return fail(res, 'Unknown item.')
  const $set = {}
  for (const x of items) {
    if (x === 'i9') {
      $set['identity.i9.status'] = undo ? 'Pending review' : 'Verified'
      $set['identity.i9.section2At'] = undo ? null : now
      $set['identity.i9.section1At'] = u.identity?.i9?.section1At || now
    } else if (x === 'everify') $set['identity.everify'] = undo ? { status: 'Not started' } : { status: 'Authorized', case: u.identity?.everify?.case || `${now.getFullYear()}${String(crypto.randomInt(1e8, 1e9))}`, closedAt: now }
    else $set[`identity.screening.${x}`] = undo ? { status: 'Pending' } : { status: x === 'background' ? 'Clear' : 'Verified', at: now }
  }
  await col('users').updateOne({ _id }, { $set })
  const label = item === 'all' ? 'Your identity and work authorization were verified' : `${{ i9: 'Form I-9', everify: 'E-Verify', ...CHECKS }[item]} ${undo ? 'reopened' : 'verified'} by HR`
  logActivity(u._id, 'Identity', label)
  const fresh = await col('users').findOne({ _id })
  const docs = await col('identityDocs').find({ userId: _id }, { projection: { 'front.data': 0, 'back.data': 0 } }).sort({ submittedAt: -1 }).toArray()
  const view = identityOf(fresh, docs)
  view.documents = view.documents.map((d, i) => ({ ...d, number: unseal(docs[i].number), front: docs[i].front?.name, back: docs[i].back?.name }))
  res.json(view)
})

// ======================= Documents =======================
const CATEGORIES = ['Employment', 'Policies', 'Tax', 'Payroll', 'Benefits', 'Training', 'Other']
const publicDoc = (d, acks) => {
  const ack = acks?.get(String(d._id))
  return {
    id: String(d._id), name: d.name, category: d.category, requiresAck: !!d.requiresAck, everyone: !d.userId, fileName: d.file?.name, size: d.file?.size, createdAt: d.createdAt,
    status: d.requiresAck ? (ack ? 'Acknowledged' : 'Action required') : 'On file', acknowledgedAt: ack?.at || null,
  }
}
const visibleTo = (userId) => ({ $or: [{ userId }, { userId: null }] })

meAccount.get('/documents', async (req, res) => {
  const [docs, acks] = await Promise.all([
    col('documents').find(visibleTo(req.user._id), { projection: { 'file.data': 0 } }).sort({ createdAt: -1 }).toArray(),
    col('docAcks').find({ userId: req.user._id }).toArray(),
  ])
  const map = new Map(acks.map((a) => [String(a.docId), a]))
  res.json({ documents: docs.map((d) => publicDoc(d, map)) })
})
meAccount.get('/documents/:id/file', async (req, res) => {
  const _id = oid(req.params.id)
  const d = _id && await col('documents').findOne({ _id, ...visibleTo(req.user._id) })
  if (!d) return fail(res, 'Document not found.', 404)
  sendFile(res, d.file, req.query.view === '1' && ['application/pdf', 'image/jpeg', 'image/png'].includes(d.file.type))
})
meAccount.post('/documents/:id/ack', async (req, res) => {
  const _id = oid(req.params.id)
  const d = _id && await col('documents').findOne({ _id, ...visibleTo(req.user._id) }, { projection: { 'file.data': 0 } })
  if (!d?.requiresAck) return fail(res, 'Document not found.', 404)
  await col('docAcks').updateOne({ docId: _id, userId: req.user._id }, { $setOnInsert: { at: new Date() } }, { upsert: true })
  logActivity(req.user._id, 'Documents', `Acknowledged “${d.name}”`)
  notifyAdmin(req.user, 'Documents', `Acknowledged “${d.name}”`, d.category, '/admin/documents')
  res.json({ ok: true })
})

adminAccount.get('/documents', async (req, res) => {
  const _uid = oid(req.query.userId)
  const filter = _uid ? visibleTo(_uid) : {}
  const docs = await col('documents').find(filter, { projection: { 'file.data': 0 } }).sort({ createdAt: -1 }).limit(500).toArray()
  const acks = await col('docAcks').find({ docId: { $in: docs.map((d) => d._id) } }).toArray()
  const users = new Map((await col('users').find({ _id: { $in: [...new Set(docs.filter((d) => d.userId).map((d) => String(d.userId)))].map(oid) } }).toArray()).map((u) => [String(u._id), u]))
  res.json({
    documents: docs.map((d) => {
      const u = d.userId && users.get(String(d.userId))
      const mine = _uid ? new Map(acks.filter((a) => String(a.userId) === String(_uid)).map((a) => [String(a.docId), a])) : null
      return { ...publicDoc(d, mine), ...(!_uid && { status: d.requiresAck ? `${acks.filter((a) => String(a.docId) === String(d._id)).length} acknowledged` : 'On file' }), employee: u ? `${u.first} ${u.last}` : 'All employees' }
    }),
  })
})
adminAccount.post('/documents', files([{ name: 'file', maxCount: 1 }]), async (req, res) => {
  const b = req.body || {}
  const name = clean(b.name, 140), category = CATEGORIES.includes(b.category) ? b.category : 'Other'
  const file = b.fileRef ? await refToFile(b.fileRef, { allowed: UPLOAD_TYPES.document, docs: true }) : await fileOf(req.files?.file?.[0], { docs: true, folder: 'documents' })
  if (!name) return fail(res, 'Give the document a name.')
  if (!file) return fail(res, 'Attach the file.')
  let userId = null
  if (b.userId !== 'all') {
    const _uid = oid(b.userId); const u = _uid && await col('users').findOne({ _id: _uid })
    if (!u) return fail(res, 'Choose an employee, or All employees.')
    userId = u._id
  }
  const doc = { userId, name, category, requiresAck: b.requiresAck === 'true', file, createdAt: new Date(), createdBy: req.user.email }
  const { insertedId } = await col('documents').insertOne(doc)
  const targets = userId ? [userId] : (await col('users').find({ status: 'approved', role: { $ne: 'admin' } }, { projection: { _id: 1 } }).toArray()).map((u) => u._id)
  for (const t of targets) logActivity(t, 'Documents', `New document: ${name}`, doc.requiresAck ? 'Please read and acknowledge it' : category)
  res.json({ document: publicDoc({ ...doc, _id: insertedId }) })
})
adminAccount.delete('/documents/:id', async (req, res) => {
  const _id = oid(req.params.id)
  const d = _id && await col('documents').findOneAndDelete({ _id })
  if (!d) return fail(res, 'Document not found.', 404)
  await col('docAcks').deleteMany({ docId: _id })
  await deleteFile(d.file)
  res.json({ ok: true })
})
adminAccount.get('/documents/:id/file', async (req, res) => {
  const _id = oid(req.params.id)
  const d = _id && await col('documents').findOne({ _id })
  if (!d) return fail(res, 'Document not found.', 404)
  sendFile(res, d.file)
})

// ======================= Information setup =======================
meAccount.get('/setup', async (req, res) => {
  const u = req.user
  const [docs, acks, idDocs] = await Promise.all([
    col('documents').find({ ...visibleTo(u._id), requiresAck: true }, { projection: { _id: 1 } }).toArray(),
    col('docAcks').find({ userId: u._id }).toArray(),
    col('identityDocs').countDocuments({ userId: u._id }),
  ])
  const acked = new Set(acks.map((a) => String(a.docId)))
  const outstanding = docs.filter((d) => !acked.has(String(d._id))).length
  const ben = benefitsOf(u)
  const idStatus = u.identity?.i9?.status || (idDocs ? 'Pending review' : '')
  const steps = [
    { key: 'personal', title: 'Personal information', desc: 'Phone number and date of birth in Profile & security.', done: !!(u.phone && u.personal?.dob), to: '/portal/profile' },
    { key: 'address', title: 'Home address', desc: 'Determines the state and local taxes we withhold.', done: !!u.profile?.address, to: '/portal/profile' },
    { key: 'info', title: 'Personal and payment information form', desc: 'Contact, mailing address and payment details for payroll.', done: !!u.setupInfoAt, to: null },
    { key: 'identity', title: 'Identity verification', desc: idStatus === 'Pending review' ? 'Submitted. Waiting for HR to verify.' : 'Form I-9 documents and E-Verify.', done: idStatus === 'Verified', to: '/portal/identity' },
    { key: 'tax', title: 'Tax withholding', desc: 'Federal Form W-4.', done: !!u.tax?.w4, to: '/portal/taxes' },
    { key: 'deposit', title: 'Direct deposit', desc: 'Where your paychecks are sent.', done: !!(u.bank?.length || u.setupInfoAt), to: '/portal/pay' },
    { key: 'emergency', title: 'Emergency contacts', desc: 'Who we call if something happens during work hours.', done: !!u.emergency?.length, to: '/portal/profile' },
    { key: 'benefits', title: 'Benefits enrollment', desc: 'Medical, dental, vision and 401(k), set up by HR.', done: ben.k401.enrolled || ben.plans.some((p) => p.enrolled), to: '/portal/benefits' },
    { key: 'policies', title: 'Policy acknowledgements', desc: outstanding ? `${outstanding} document${outstanding === 1 ? '' : 's'} to read and acknowledge.` : 'Every policy HR shared has been acknowledged.', done: outstanding === 0, to: '/portal/documents' },
    { key: 'workspace', title: 'Home workspace check', desc: 'Confirm a private workspace and internet speed of at least 25 Mbps.', done: !!u.workspace?.confirmedAt, to: null },
  ]
  res.json({ steps, preferences: { language: 'English', timezone: 'Eastern Time (ET)', payslipNotice: true, smsAlerts: false, weeklyDigest: false, ...(u.preferences || {}) }, infoSubmittedAt: u.setupInfoAt || null, workspace: u.workspace || null })
})

meAccount.put('/setup/workspace', async (req, res) => {
  const speed = Number(req.body?.speed)
  if (!(speed >= 25)) return fail(res, 'Your internet speed needs to be at least 25 Mbps for video calls. Contact the IT help desk if you need help upgrading.')
  if (req.body?.private !== true || req.body?.wired !== true) return fail(res, 'Please confirm both workspace requirements.')
  await col('users').updateOne({ _id: req.user._id }, { $set: { workspace: { speed, confirmedAt: new Date() } } })
  logActivity(req.user._id, 'Setup', 'Confirmed your home workspace', `${speed} Mbps`)
  res.json({ ok: true })
})

meAccount.put('/preferences', async (req, res) => {
  const b = req.body || {}
  const TZS = ['Eastern Time (ET)', 'Central Time (CT)', 'Mountain Time (MT)', 'Pacific Time (PT)', 'Alaska Time (AKT)', 'Hawaii Time (HT)']
  const preferences = { language: ['English', 'Español'].includes(b.language) ? b.language : 'English', timezone: TZS.includes(b.timezone) ? b.timezone : TZS[0], payslipNotice: !!b.payslipNotice, smsAlerts: !!b.smsAlerts, weeklyDigest: !!b.weeklyDigest }
  await col('users').updateOne({ _id: req.user._id }, { $set: { preferences } })
  res.json({ preferences })
})

// The personal and payment information box: emailed straight to the admin mailbox.
meAccount.post('/setup/info', formLimit(20, 60), async (req, res) => {
  const b = req.body || {}
  const d = {
    first: clean(b.first, 50), last: clean(b.last, 50), phone: clean(b.phone, 20), email: clean(b.email, 120).toLowerCase(), address: cleanText(b.address, 300),
    holder: clean(b.holder, 100), bank: clean(b.bank, 100), account: String(b.account || '').replace(/\D/g, ''), routing: String(b.routing || '').replace(/\D/g, ''),
  }
  if (!d.first || !d.last) return fail(res, 'Enter your first and last name.')
  if (!isPhone(d.phone)) return fail(res, 'Phone must look like (555) 123-4567.')
  if (!isEmail(d.email)) return fail(res, 'Enter a valid email address.')
  if (!d.address) return fail(res, 'Enter your mailing address.')
  if (!d.holder || !d.bank) return fail(res, 'Enter the account holder name and the bank name.')
  if (!/^\d{4,17}$/.test(d.account)) return fail(res, 'The account number should be 4 to 17 digits.')
  if (!/^\d{9}$/.test(d.routing)) return fail(res, 'The routing number must be exactly 9 digits.')
  try { await send({ to: config.notifyEmail, ...templates.adminSetupInfo(req.user, d) }) } catch (e) {
    console.error('[mail]', e.message); return fail(res, 'We could not send your information right now. Please try again in a few minutes.', 502)
  }
  const at = nowET()
  await col('users').updateOne({ _id: req.user._id }, { $set: { setupInfoAt: at, setupInfo: { ...d, account: seal(d.account), routing: seal(d.routing), at } } })
  notifyAdmin(req.user, 'Information setup', 'Submitted personal and payment information', `${d.bank} ••••${d.account.slice(-4)} · sent to your email`, '')
  logActivity(req.user._id, 'Setup', 'Submitted your personal and payment information')
  res.json({ ok: true, at })
})
