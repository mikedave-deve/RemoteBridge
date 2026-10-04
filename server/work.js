import crypto from 'node:crypto'
import { config } from './config.js'
import { col } from './db.js'
import { PLANS } from '../src/lib/benefits.js'
import { k401Limit, num, r2 } from '../src/lib/payroll.js'

// ---------- Dates: the company runs on Eastern time ----------
export const TZ = 'America/New_York'
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
export const dayKey = (d = new Date()) => dayFmt.format(d) // YYYY-MM-DD
export const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`))
export const addDays = (key, n) => { const d = new Date(`${key}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
/** Monday of the week that contains this day. */
export const weekOf = (key) => addDays(key, -((new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7))
export const fmtDay = (key, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
export const weekLabel = (start) => `${fmtDay(start, { month: 'short', day: 'numeric' })} – ${fmtDay(addDays(start, 6))}`

// ---------- Timesheet: turn clock punches into days ----------
export const PUNCH = { in: 'Clocked in', break: 'Started meal break', back: 'Ended meal break', out: 'Clocked out' }
export const clockState = (last) => (!last || last.type === 'out' ? 'out' : last.type === 'break' ? 'break' : 'in')
const NEXT = { out: ['in'], in: ['break', 'out'], break: ['back'] }
export const canPunch = (state, type) => NEXT[state].includes(type)

/** Days Monday to Sunday with first clock-in, last clock-out, break minutes and hours worked. */
export function buildWeek(start, punches, now = new Date()) {
  const days = Array.from({ length: 7 }, (_, i) => ({ date: addDays(start, i), in: null, out: null, breakMin: 0, ms: 0, open: false }))
  const byKey = Object.fromEntries(days.map((d) => [d.date, d]))
  let workFrom = null, breakFrom = null, day = null
  for (const p of punches) {
    const at = new Date(p.at)
    if (p.type === 'in') { day = byKey[dayKey(at)]; if (day && !day.in) day.in = at; workFrom = at }
    if (!day) continue
    if ((p.type === 'break' || p.type === 'out') && workFrom) { day.ms += at - workFrom; workFrom = null }
    if (p.type === 'break') breakFrom = at
    if (p.type === 'back') { if (breakFrom) day.breakMin += Math.round((at - breakFrom) / 60000); breakFrom = null; workFrom = at }
    if (p.type === 'out') { day.out = at; breakFrom = null }
  }
  if (day && (workFrom || breakFrom)) {
    day.open = true
    if (workFrom) day.ms += now - workFrom
  }
  const list = days.map(({ ms, ...d }) => ({ ...d, hours: r2(ms / 3600000) }))
  const total = r2(list.reduce((s, d) => s + d.hours, 0))
  return { days: list, total, overtime: r2(Math.max(0, total - 40)) }
}

// ---------- Benefits on an employee record ----------
export function benefitsOf(user) {
  const b = user.benefits || {}
  const plans = PLANS.map((p) => {
    const e = b.plans?.[p.name] || {}
    return { name: p.name, enrolled: !!e.enrolled, tier: e.tier || p.tiers[0], perCheck: e.enrolled ? num(e.perCheck) : 0, employer: e.enrolled ? num(e.employer) : 0, memberId: e.memberId || '', label: p.name === 'Medical' ? `Medical (${p.plan})` : p.name }
  })
  const k = b.k401 || {}
  const k401 = { enrolled: !!k.enrolled, pct: num(k.pct), matchPct: num(k.matchPct), catchUp: k.catchUp || 'none', roth: !!k.roth, openingBalance: num(k.openingBalance), changedAt: k.changedAt || null }
  return { plans, k401, limit: k401Limit(k401.catchUp), beneficiaries: b.beneficiaries || [], updatedAt: b.updatedAt || null }
}

// ---------- Year-to-date totals from saved pay stubs ----------
export async function ytdBefore(userId, payDate, excludeId) {
  const year = payDate.slice(0, 4)
  const stubs = await col('payStubs').find({ userId, payDate: { $gte: `${year}-01-01`, $lt: payDate }, ...(excludeId && { _id: { $ne: excludeId } }) }).toArray()
  const sum = (f) => r2(stubs.reduce((s, x) => s + (f(x) || 0), 0))
  const fica = sum((x) => x.ficaWages)
  return { ssWages: fica, medicareWages: fica, k401: sum((x) => x.k401) }
}

export const publicStub = (s) => ({
  id: String(s._id), number: s.number, payDate: s.payDate, start: s.start, end: s.end, earnings: s.earnings, taxes: s.taxes, deductions: s.deductions,
  gross: s.gross, totalTax: s.totalTax, totalDed: s.totalDed, net: s.net, match: s.match, k401: s.k401, hours: s.hours, deposits: s.deposits || [],
  note: s.note || '', frequency: s.frequency, createdAt: s.createdAt, updatedAt: s.updatedAt,
})

/** Split net pay across the employee's deposit accounts: fixed amounts first, the primary takes the rest. */
export function depositSplit(accounts = [], net) {
  const fixed = accounts.filter((a) => !a.primary && num(a.amount) > 0)
  let left = net
  const out = []
  for (const a of fixed) { const amt = r2(Math.min(num(a.amount), Math.max(0, left))); left = r2(left - amt); out.push({ label: `${a.type} ••••${a.last4}`, amount: amt }) }
  const primary = accounts.find((a) => a.primary)
  if (primary) out.unshift({ label: `${primary.type} ••••${primary.last4}`, amount: r2(left) })
  return out
}

// ---------- Bank account numbers are encrypted at rest ----------
const key = () => crypto.createHash('sha256').update(`${config.secret}:bank-accounts`).digest()
export function seal(text) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const body = Buffer.concat([c.update(String(text), 'utf8'), c.final()])
  return [iv, c.getAuthTag(), body].map((b) => b.toString('base64')).join('.')
}
export function unseal(sealed) {
  try {
    const [iv, tag, body] = String(sealed).split('.').map((s) => Buffer.from(s, 'base64'))
    const d = crypto.createDecipheriv('aes-256-gcm', key(), iv)
    d.setAuthTag(tag)
    return Buffer.concat([d.update(body), d.final()]).toString('utf8')
  } catch { return '' }
}
export const validRouting = (r) => {
  if (!/^\d{9}$/.test(r)) return false
  const d = r.split('').map(Number)
  return (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0
}
export const publicAccount = (a) => ({ id: a.id, type: a.type, last4: a.last4, routingLast4: a.routingLast4, primary: !!a.primary, amount: a.amount || 0, status: a.status, addedAt: a.addedAt })

// Running number per kind: PS-2026-0001, TO-1001, …
export async function nextNumber(kind) {
  const { seq } = await col('counters').findOneAndUpdate({ _id: kind }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  return seq
}
