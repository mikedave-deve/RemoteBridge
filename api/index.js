// Vercel serverless entry: the /api/* rewrite in vercel.json sends every API
// request here, and this runs the Express app. The DB connection, config check
// and seed happen once per warm instance.
import { createApp, ready } from '../server/index.js'

let app

export default async function handler(req, res) {
  // Guarantee Express sees the /api prefix its routes are mounted on, no matter how
  // Vercel passes the path through the rewrite.
  if (req.url && !req.url.startsWith('/api')) req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url

  // A no-dependency ping to prove the function is routing, before any DB/config work.
  if ((req.url || '').replace(/\?.*$/, '').replace(/\/$/, '') === '/api/ping') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ ok: true, fn: true, node: process.version }))
  }
  try {
    await ready()
  } catch (e) {
    console.error('[startup]', e)
    // Config problems only mention env-var names (safe to show). Anything else (usually the
    // database) stays generic so a connection string is never leaked to the browser.
    const configProblem = /JWT_SECRET|COMPANY_NOTIFY_EMAIL|HOSTINGER/.test(e.message || '')
    res.statusCode = configProblem ? 500 : 503
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({
      error: configProblem
        ? `Missing configuration: ${e.message}`
        : 'The server could not reach the database. Check MONGODB_URI and that MongoDB Atlas allows connections from anywhere (0.0.0.0/0) under Network Access.',
    }))
  }
  app ??= createApp()
  return app(req, res)
}
