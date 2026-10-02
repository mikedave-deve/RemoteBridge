import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { ObjectId } from 'mongodb'
import { config } from './config.js'
import { col } from './db.js'

const scrypt = promisify(crypto.scrypt)
export const COOKIE = 'prb_session'

// ---------- Passwords (scrypt, per-password salt) ----------
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16)
  const key = await scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}
export async function verifyPassword(pw, stored) {
  const [, salt, key] = String(stored).split('$')
  if (!salt || !key) return false
  const derived = await scrypt(pw, Buffer.from(salt, 'base64'), 64, { N: 16384, r: 8, p: 1 })
  const expected = Buffer.from(key, 'base64')
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived)
}
// Used when the email doesn't exist, so a wrong email takes as long as a wrong password.
export const DUMMY_HASH = await hashPassword(crypto.randomBytes(12).toString('hex'))

// ---------- Sessions (random token in an HttpOnly cookie; only its hash is stored) ----------
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

export async function createSession(res, user, remember = false) {
  const days = remember ? config.rememberDays : config.sessionDays
  const token = crypto.randomBytes(32).toString('base64url')
  await col('sessions').insertOne({ tokenHash: sha256(token), userId: user._id, createdAt: new Date(), expiresAt: new Date(Date.now() + days * 864e5) })
  res.cookie(COOKIE, token, { ...cookieOpts(), maxAge: days * 864e5 })
}
// In production the website and API may live on different domains, which needs SameSite=None (always with Secure).
const cookieOpts = () => ({ httpOnly: true, secure: config.isProd, sameSite: config.isProd ? 'none' : 'lax', path: '/' })

export async function destroySession(req, res) {
  const token = req.cookies[COOKIE]
  if (token) await col('sessions').deleteOne({ tokenHash: sha256(token) })
  res.clearCookie(COOKIE, cookieOpts())
}

export async function loadUser(req, _res, next) {
  try {
    const token = req.cookies[COOKIE]
    if (token) {
      const s = await col('sessions').findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } })
      if (s) {
        const u = await col('users').findOne({ _id: s.userId })
        if (u && u.status === 'approved') req.user = u
      }
    }
    next()
  } catch (e) { next(e) }
}

export const requireUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Please log in to continue.' }))
export const requireAdmin = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(req.user ? 403 : 401).json({ error: 'Admins only.' }))

// Minimal cookie parser so we don't need another dependency.
export function cookies(req, _res, next) {
  req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]))
  next()
}

export const allowedOrigins = () => new Set([...config.origins, ...(config.isProd ? [] : ['http://localhost:5173', 'http://localhost:5179'])])

// Let the website call the API from its own domain, with cookies.
export function cors(req, res, next) {
  const origin = req.headers.origin
  if (origin && allowedOrigins().has(origin)) {
    res.set({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' })
    if (req.method === 'OPTIONS') {
      res.set({ 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' })
      return res.sendStatus(204)
    }
  }
  next()
}

// Reject state-changing requests that come from another website (CSRF defence alongside SameSite cookies).
export function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.headers.origin
  if (!origin) return next() // same-origin form posts and server-to-server calls
  return allowedOrigins().has(origin) || origin === `${req.protocol}://${req.headers.host}` ? next() : res.status(403).json({ error: 'Request blocked.' })
}

// ---------- Signed, expiring tokens for links in admin emails ----------
export function signToken(payload, days = 7) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + days * 864e5 })).toString('base64url')
  const sig = crypto.createHmac('sha256', config.secret).update(body).digest('base64url')
  return `${body}.${sig}`
}
export function verifyToken(token) {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', config.secret).update(body).digest('base64url')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const data = JSON.parse(Buffer.from(body, 'base64url').toString())
  return data.exp > Date.now() ? data : null
}

// ---------- Rate limiting backed by MongoDB, so it survives restarts ----------
export async function tooManyAttempts(key, max, windowMin) {
  const since = new Date(Date.now() - windowMin * 60e3)
  return (await col('loginAttempts').countDocuments({ key, at: { $gt: since } })) >= max
}
export const recordAttempt = (key) => col('loginAttempts').insertOne({ key, at: new Date() })
export const clearAttempts = (key) => col('loginAttempts').deleteMany({ key })

// Simple in-memory limiter for public forms (per IP).
const hits = new Map()
export const formLimit = (max, windowMin) => (req, res, next) => {
  const k = `${req.path}|${req.ip}`, now = Date.now()
  const list = (hits.get(k) || []).filter((t) => now - t < windowMin * 60e3)
  if (list.length >= max) return res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' })
  list.push(now); hits.set(k, list); next()
}

// ---------- Validation helpers ----------
export const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
export const cleanText = (v, max = 4000) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max)
export const isEmail = (v) => /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(v) && v.length <= 120
export const isPhone = (v) => /^\(\d{3}\) \d{3}-\d{4}$/.test(v) && !/^\([01]/.test(v)
export const strongPassword = (pw, personal = []) => {
  const lower = pw.toLowerCase()
  return pw.length >= 8 && pw.length <= 128 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)
    && !personal.filter((p) => p && p.length >= 3).some((p) => lower.includes(p.toLowerCase()))
}
export const oid = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null)
export const publicUser = (u) => u && ({ id: String(u._id), first: u.first, last: u.last, email: u.email, phone: u.phone, role: u.role, status: u.status, profile: u.profile || {} })
