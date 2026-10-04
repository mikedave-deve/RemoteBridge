import { Router } from 'express'
import { col } from '../db.js'
import { clean, oid, requireUser } from '../security.js'
import { logActivity, missionStatus, publicMission } from '../people.js'

// Signed-in employee's own live data.
export const me = Router()
me.use(requireUser)

const rank = { 'In progress': 0, 'Not started': 1, Completed: 2 }

me.get('/missions', async (req, res) => {
  const list = await col('missions').find({ userId: req.user._id }).sort({ createdAt: -1 }).toArray()
  const missions = list.map((m) => publicMission(m)).sort((a, b) => rank[a.status] - rank[b.status] || String(a.due || '9').localeCompare(String(b.due || '9')))
  res.json({ missions })
})

me.patch('/missions/:id/steps/:i', async (req, res) => {
  const _id = oid(req.params.id), i = Number(req.params.i)
  const m = _id && await col('missions').findOne({ _id, userId: req.user._id })
  if (!m || !Number.isInteger(i) || !m.steps[i]) return res.status(404).json({ error: 'Mission step not found.' })
  const done = req.body?.done === true
  if (!!m.steps[i].done === done) return res.json({ mission: publicMission(m) })
  const wasComplete = missionStatus(m.steps) === 'Completed'
  m.steps[i] = { ...m.steps[i], done, doneAt: done ? new Date() : null }
  const nowComplete = missionStatus(m.steps) === 'Completed'
  await col('missions').updateOne({ _id }, { $set: { steps: m.steps, updatedAt: new Date(), completedAt: nowComplete ? new Date() : null } })
  logActivity(req.user._id, 'Missions', `${done ? 'Completed' : 'Reopened'} “${clean(m.steps[i].text, 160)}”`, m.title)
  if (nowComplete && !wasComplete) logActivity(req.user._id, 'Missions', `Completed mission “${m.title}”`, 'All steps done')
  res.json({ mission: publicMission({ ...m, completedAt: nowComplete ? new Date() : null }) })
})

me.get('/activity', async (req, res) => {
  const list = await col('activity').find({ userId: req.user._id }).sort({ at: -1 }).limit(Math.min(Number(req.query.limit) || 200, 500)).toArray()
  res.json({ activity: list.map(({ type, text, meta, at }) => ({ type, text, meta, at })) })
})
