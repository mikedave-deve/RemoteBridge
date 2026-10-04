// Vercel serverless entry: every /api/* request runs the Express app.
// The DB connection, config check and seed happen once per warm instance.
import { createApp, ready } from '../server/index.js'

let app
export default async function handler(req, res) {
  try {
    await ready()
  } catch (e) {
    console.error('[startup]', e.message)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'The server is not configured yet. Set the required environment variables in Vercel, then redeploy.' }))
  }
  app ??= createApp()
  return app(req, res)
}
