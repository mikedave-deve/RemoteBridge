// All settings come from .env (see .env.example).
const env = process.env

// Values like "http://localhost:5173, " may carry stray commas or spaces.
const list = (v) => String(v || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
const one = (v) => list(v)[0] || ''

// Database name: MONGODB_DB, else the one in the URI path, else a default.
function dbNameFrom(uri) {
  if (env.MONGODB_DB) return env.MONGODB_DB
  try { return decodeURIComponent(new URL(uri.replace(/,[^/]+/, '')).pathname.slice(1)) || 'premierremotebridge' } catch { return 'premierremotebridge' }
}

const origins = list(env.FRONTEND_ORIGIN).length ? list(env.FRONTEND_ORIGIN) : ['http://localhost:5173']
const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/premierremotebridge'

export const config = {
  port: Number(env.PORT || 4000),
  isProd: env.NODE_ENV === 'production' || process.argv.includes('--production'),
  origins,
  siteUrl: origins[0],
  loginUrl: one(env.FRONTEND_LOGIN_URL) || `${origins[0]}/login`,
  mongoUri,
  dbName: dbNameFrom(mongoUri),
  secret: env.JWT_SECRET || '',
  sessionDays: Number(env.JWT_EXPIRES_IN_DAYS || 7),
  rememberDays: Number(env.JWT_EXPIRES_IN_DAYS_REMEMBER || 30),
  notifyEmail: env.COMPANY_NOTIFY_EMAIL || env.HOSTINGER_MAILBOX_ADDRESS || '',
  // Optional: create the first admin account on startup (or run `npm run create-admin`).
  adminEmail: env.ADMIN_EMAIL || '',
  adminPassword: env.ADMIN_PASSWORD || '',
  adminName: env.ADMIN_NAME || 'Site Admin',
  // Email goes through Hostinger's HTTP Mail API (HTTPS), not SMTP.
  hostinger: {
    apiToken: env.HOSTINGER_API_TOKEN || '',
    apiBase: env.HOSTINGER_MAIL_API_URL || 'https://api.mail.hostinger.com', // override only for tests
    mailbox: env.HOSTINGER_MAILBOX_ADDRESS || '',
    displayName: env.EMAIL_DISPLAY_NAME || 'PremierRemoteBridge',
  },
}

export function checkConfig() {
  const problems = []
  if (config.secret.length < 32) problems.push('JWT_SECRET must be at least 32 random characters.')
  if (!config.notifyEmail) problems.push('COMPANY_NOTIFY_EMAIL is not set; submissions and approvals have nowhere to go.')
  if (config.hostinger.apiToken && !config.hostinger.mailbox) problems.push('HOSTINGER_MAILBOX_ADDRESS is required when HOSTINGER_API_TOKEN is set.')
  if (!config.hostinger.apiToken) problems.push('HOSTINGER_API_TOKEN is empty, so emails are saved to server/outbox instead of being sent.')
  if (config.isProd && problems.some((p) => !p.includes('server/outbox'))) throw new Error(problems.join(' '))
  problems.forEach((p) => console.warn(`[config] ${p}`))
  if (!config.secret) config.secret = 'dev-only-insecure-secret-change-me-dev-only-insecure'
}
