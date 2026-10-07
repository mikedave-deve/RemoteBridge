import crypto from 'node:crypto'
import { Router } from 'express'
import { config } from '../config.js'
import { col } from '../db.js'
import { actionPage, send, sendAll, templates } from '../mail.js'
import { deviceOf, ensureEmployeeId, logActivity } from '../people.js'
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
  logActivity(insertedId, 'Profile', 'Account created', 'Waiting for admin approval')
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
  if (user.role !== 'admin') await ensureEmployeeId(user)
  logActivity(user._id, 'Security', 'Signed in', deviceOf(req))
  res.json({ user: publicUser(user) })
})

auth.post('/logout', async (req, res) => {
  if (req.user) logActivity(req.user._id, 'Security', 'Signed out', deviceOf(req))
  await destroySession(req, res)
  res.json({ ok: true })
})

// ---------- Forgot / reset password ----------
// A signed, 1-hour link emailed to the user. It carries a key derived from the current
// password, so once the password changes the link stops working (single use).
const resetKey = (u) => crypto.createHash('sha256').update(String(u.passwordHash)).digest('base64url').slice(0, 16)

auth.post('/forgot', formLimit(5, 30), async (req, res) => {
  const email = clean(req.body?.email, 120).toLowerCase()
  const user = isEmail(email) ? await col('users').findOne({ email }) : null
  // Only an active account can reset, but we always return ok so the form can't reveal who has an account.
  if (user && user.status === 'approved') {
    const token = signToken({ uid: String(user._id), k: resetKey(user), act: 'reset' }, 1 / 24)
    const link = `${config.siteUrl}/reset-password?token=${token}`
    send({ to: user.email, ...templates.resetPassword(user, link) }).catch((e) => console.error('[reset mail]', e.message))
  }
  res.json({ ok: true })
})

// Lets the reset page tell a good link from an expired one before showing the form.
auth.get('/reset', async (req, res) => {
  const data = verifyToken(req.query.token)
  const user = data && data.act === 'reset' && await col('users').findOne({ _id: oid(data.uid) })
  const valid = !!(user && data.k === resetKey(user))
  res.json({ valid, email: valid ? user.email : undefined })
})

auth.post('/reset', formLimit(10, 30), async (req, res) => {
  const data = verifyToken(req.body?.token)
  const user = data && data.act === 'reset' ? await col('users').findOne({ _id: oid(data.uid) }) : null
  if (!user || data.k !== resetKey(user)) return res.status(400).json({ error: 'This reset link is invalid, used or expired. Please request a new one.' })
  const password = String(req.body?.password || '')
  if (!strongPassword(password, [user.first, user.last, user.email.split('@')[0]])) return res.status(400).json({ error: 'Use at least 8 characters with upper and lower case letters, a number and a symbol, and not your name.' })
  if (password !== req.body?.confirm) return res.status(400).json({ error: 'The two passwords do not match.' })
  await col('users').updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() } })
  await col('sessions').deleteMany({ userId: user._id })
  logActivity(user._id, 'Security', 'Password reset using an email link')
  res.json({ ok: true })
})

auth.get('/me', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in.' })
  if (req.user.role !== 'admin') await ensureEmployeeId(req.user) // accounts approved before IDs existed get one now
  res.json({ user: publicUser(req.user) })
})

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
  if (status === 'approved') {
    const id = user.role === 'admin' ? null : await ensureEmployeeId(user)
    logActivity(user._id, 'Security', 'Account approved', id ? `Your employee ID is ${id}` : '')
  } else logActivity(user._id, 'Security', `Account ${status}`, 'By an administrator')
  if (status !== 'approved') await col('sessions').deleteMany({ userId: user._id })
  const tpl = status === 'approved' ? templates.userApproved(user) : status === 'declined' ? templates.userDeclined(user) : null
  if (tpl) await send({ to: user.email, ...tpl }).catch((e) => console.error('[mail]', e.message))
}
