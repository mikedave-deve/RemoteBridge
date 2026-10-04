import path from 'node:path'
import express from 'express'
import { checkConfig, config } from './config.js'
import { col, connect } from './db.js'
import { cookies, cors, hashPassword, loadUser, sameOrigin } from './security.js'
import { auth } from './routes/auth.js'
import { pub } from './routes/public.js'
import { admin } from './routes/admin.js'
import { me } from './routes/me.js'
import { adminWork, meWork } from './routes/work.js'
import { adminSupport, meSupport } from './routes/support.js'
import { adminAccount, meAccount } from './routes/account.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (config.isProd) app.set('trust proxy', 1)

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      ...(config.isProd ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
    })
    next()
  })
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: false, limit: '20kb' }))
  app.use(cors, cookies, sameOrigin, loadUser)

  app.use('/api/auth', auth)
  app.use('/api/admin', admin)
  app.use('/api/me', me)
  app.use('/api/admin', adminWork)
  app.use('/api/me', meWork)
  app.use('/api/admin', adminSupport)
  app.use('/api/me', meSupport)
  app.use('/api/admin', adminAccount)
  app.use('/api/me', meAccount)
  app.use('/api', pub)
  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

  // When running as one Node server in production, also serve the built website.
  // On Vercel the static site is served by the CDN and this function only handles /api.
  if (config.isProd && !process.env.VERCEL) {
    const dist = path.resolve('dist')
    app.use(express.static(dist, { maxAge: '7d', index: false }))
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: err.message })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
  })
  return app
}

// First run: create the admin account from .env and the default site text.
export async function seed() {
  if (config.adminEmail && config.adminPassword) {
    const email = config.adminEmail.toLowerCase()
    if (!(await col('users').findOne({ email }))) {
      const [first, ...rest] = config.adminName.split(' ')
      await col('users').insertOne({ first, last: rest.join(' ') || 'Admin', email, phone: '', passwordHash: await hashPassword(config.adminPassword), role: 'admin', status: 'approved', profile: {}, createdAt: new Date() })
      console.log(`[seed] Created admin account ${email}`)
    }
  }
  if (!(await col('settings').findOne({ _id: 'site' }))) {
    const { announcements } = await import('../src/data/portal.js')
    await col('settings').insertOne({
      _id: 'site',
      heroTitle: 'Work from home for America’s best employers.',
      heroSubtitle: 'PremierRemoteBridge places US-based professionals in fully remote roles: data entry, customer support, bookkeeping, payroll, admin, accounting and more. Real employers, pay on every listing, and a recruiter who replies.',
      ctaTitle: 'The best job you have had might be the one you do from home.',
      contactEmail: 'hello@premierremotebridge.com', contactPhone: '(404) 555-0170', address: '1180 Peachtree St NE, Atlanta, GA 30309',
      announcements, updatedAt: new Date(),
    })
  }
}

// Connect, check config and seed once per process (cached for warm serverless invocations).
let readyPromise
export function ready() {
  readyPromise ??= (async () => { checkConfig(); await connect(); await seed() })()
  return readyPromise
}

// Start when run directly (not when imported by tests or the Vercel function).
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('server/index.js')) {
  await ready()
  createApp().listen(config.port, () => console.log(`[server] API listening on http://localhost:${config.port}`))
}
