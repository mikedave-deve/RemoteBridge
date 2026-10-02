import { Router } from 'express'
import { config } from '../config.js'
import { col } from '../db.js'
import { actionPage, send, sendAll, templates } from '../mail.js'
import {
  DUMMY_HASH, clean, clearAttempts, createSession, destroySession, formLimit, hashPassword, isEmail, isPhone,
  oid, publicUser, recordAttempt, signToken, strongPassword, tooManyAttempts, verifyPassword, verifyToken,
} from '../security.js'

export const auth = Router()

auth.post('/register', formLimit(5, 30), async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.json({ ok: true }) // honeypot: pretend success for bots
  const user = {
    first: clean(b.first, 50), last: clean(b.last, 50), email: clean(b.email, 120).toLowerCase(), phone: clean(b.phone, 20),
  }
  const errors = {}
  if (!user.first) errors.first = 'Enter your first name.'
  if (!user.last) errors.last = 'Enter your last name.'
  if (!isEmail(user.email)) errors.email = 'Enter an email address like name@example.com.'
  if (!isPhone(user.phone)) errors.phone = 'Enter a 10-digit US phone number.'
  if (!strongPassword(String(b.password || ''), [user.first, user.last, user.email.split('@')[0]])) errors.password = 'Your password does not meet the requirements.'
  if (b.password !== b.confirm) errors.confirm = 'Passwords do not match.'
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  const existing = await col('users').findOne({ email: user.email })
  // Same response whether or not the email exists, so the form can't be used to discover accounts.
  if (existing) return res.json({ ok: true })

  const doc = { ...user, passwordHash: await hashPassword(b.password), role: 'employee', status: 'pending', profile: {}, createdAt: new Date() }
  const { insertedId } = await col('users').insertOne(doc)
  doc._id = insertedId
  // Links point at the API itself, wherever it is hosted.
  const api = `${req.protocol}://${req.get('host')}`
  const approve = `${api}/api/auth/review?t=${signToken({ uid: String(insertedId), act: 'approve' })}`
  const decline = `${api}/api/auth/review?t=${signToken({ uid: String(insertedId), act: 'decline' })}`
  await sendAll([
    send({ to: config.notifyEmail, ...templates.adminRegistration(doc, approve, decline) }),
    send({ to: user.email, ...templates.userRegistered(doc) }),
  ])
  res.json({ ok: true })
})

auth.post('/login', async (req, res) => {
  const email = clean(req.body?.email, 120).toLowerCase()
  const password = String(req.body?.password || '').slice(0, 128)
  const key = `login:${email}`, ipKey = `login-ip:${req.ip}`
  if (await tooManyAttempts(key, 5, 15) || await tooManyAttempts(ipKey, 25, 15)) {
    return res.status(429).json({ error: 'Too many attempts. For your security, sign-in is paused for 15 minutes.' })
  }
  const user = email ? await col('users').findOne({ email }) : null
  const ok = await verifyPassword(password, user?.passwordHash || DUMMY_HASH)
  if (!user || !ok) {
    await Promise.all([recordAttempt(key), recordAttempt(ipKey)])
    return res.status(401).json({ error: 'The email or password is incorrect.' })
  }
  // Only reveal account status once the password is proven correct.
  if (user.status === 'pending') return res.status(403).json({ error: 'Your account is waiting for approval. We will email you as soon as an admin approves it.', code: 'pending' })
  if (user.status !== 'approved') return res.status(403).json({ error: 'This account is not active. Please contact hello@premierremotebridge.com.', code: user.status })
  await clearAttempts(key)
  await createSession(res, user, req.body?.remember === true)
  await col('users').updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } })
  res.json({ user: publicUser(user) })
})

auth.post('/logout', async (req, res) => { await destroySession(req, res); res.json({ ok: true }) })

auth.get('/me', (req, res) => (req.user ? res.json({ user: publicUser(req.user) }) : res.status(401).json({ error: 'Not signed in.' })))

// ---------- One-click review links from the admin email ----------
// GET only shows a confirmation page (email scanners prefetch links); the change happens on POST.
auth.get('/review', async (req, res) => {
  const data = verifyToken(req.query.t)
  const user = data && await col('users').findOne({ _id: oid(data.uid) })
  if (!user) return res.status(400).send(actionPage({ title: 'This link has expired', body: 'Open the admin portal to review this account.' }))
  if (user.status !== 'pending') return res.send(actionPage({ title: 'Already reviewed', body: `${user.first} ${user.last} is already ${user.status}.` }))
  const approve = data.act === 'approve'
  res.send(actionPage({
    title: approve ? `Approve ${user.first} ${user.last}?` : `Decline ${user.first} ${user.last}?`,
    body: approve ? `They will get an email saying they can now log in with ${user.email}.` : 'They will get a polite email saying their request was not approved.',
    form: `<form method="post" action="/api/auth/review"><input type="hidden" name="t" value="${String(req.query.t).replace(/"/g, '')}"><button style="padding:13px 26px;border:0;border-radius:999px;background:${approve ? '#1F7A8C' : '#14282E'};color:#fff;font:600 15px Arial,sans-serif;cursor:pointer;">${approve ? 'Yes, approve account' : 'Yes, decline request'}</button></form>`,
  }))
})

auth.post('/review', async (req, res) => {
  const data = verifyToken(req.body?.t)
  const user = data && await col('users').findOne({ _id: oid(data.uid) })
  if (!user) return res.status(400).send(actionPage({ title: 'This link has expired', body: 'Open the admin portal to review this account.' }))
  if (user.status !== 'pending') return res.send(actionPage({ title: 'Already reviewed', body: `${user.first} ${user.last} is already ${user.status}.` }))
  await setStatus(user, data.act === 'approve' ? 'approved' : 'declined', 'email link')
  res.send(actionPage({ title: data.act === 'approve' ? 'Account approved' : 'Request declined', body: `${user.first} ${user.last} has been notified by email.` }))
})

export async function setStatus(user, status, by) {
  await col('users').updateOne({ _id: user._id }, { $set: { status, reviewedAt: new Date(), reviewedBy: by } })
  if (status !== 'approved') await col('sessions').deleteMany({ userId: user._id })
  const tpl = status === 'approved' ? templates.userApproved(user) : status === 'declined' ? templates.userDeclined(user) : null
  if (tpl) await send({ to: user.email, ...tpl }).catch((e) => console.error('[mail]', e.message))
}
