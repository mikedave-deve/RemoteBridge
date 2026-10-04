import { col } from './db.js'

// ---------- Activity history (only real events, newest first) ----------
export const logActivity = (userId, type, text, meta = '') =>
  col('activity').insertOne({ userId, type, text, meta, at: new Date() }).catch((e) => console.error('[activity]', e.message))

// ---------- Admin notifications (shown under the bell in the admin portal) ----------
export const notifyAdmin = (user, type, text, meta = '', link = '') =>
  col('notifications').insertOne({ userId: user._id, name: `${user.first} ${user.last}`, employeeId: user.employeeId || '', type, text, meta, link, read: false, at: new Date() })
    .catch((e) => console.error('[notify]', e.message))

/** "Chrome on Windows" from the browser's user-agent string. */
export function deviceOf(req) {
  const ua = String(req.headers['user-agent'] || '')
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /iPhone|iPad/.test(ua) ? (/iPad/.test(ua) ? 'iPad' : 'iPhone') : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'unknown device'
  return `${browser} on ${os}`
}

// ---------- Unique employee IDs: PRB-200001, PRB-200002, … from an atomic counter ----------
export async function ensureEmployeeId(user) {
  if (user.employeeId) return user.employeeId
  const { seq } = await col('counters').findOneAndUpdate({ _id: 'employeeId' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  const employeeId = `PRB-${200000 + seq}`
  // Only set it if no other request assigned one in the meantime.
  await col('users').updateOne({ _id: user._id, employeeId: { $exists: false } }, { $set: { employeeId } })
  const fresh = await col('users').findOne({ _id: user._id }, { projection: { employeeId: 1 } })
  user.employeeId = fresh.employeeId
  return user.employeeId
}

// ---------- Missions ----------
export const missionStatus = (steps) => (steps.length && steps.every((s) => s.done) ? 'Completed' : steps.some((s) => s.done) ? 'In progress' : 'Not started')
export const publicMission = (m, user) => ({
  id: String(m._id), title: m.title, client: m.client, priority: m.priority, due: m.due, summary: m.summary,
  steps: m.steps.map(({ text, done, doneAt }) => ({ text, done: !!done, doneAt })), instructions: m.instructions,
  status: missionStatus(m.steps), assignedBy: m.assignedBy, createdAt: m.createdAt, completedAt: m.completedAt,
  ...(user && { employee: { id: String(user._id), name: `${user.first} ${user.last}`, employeeId: user.employeeId } }),
})
