import { API_BASE } from './api'
import { announcements } from '../data/portal'

// Editable site text. Defaults match the built-in copy; the admin portal can override them.
export const site = {
  heroTitle: 'Work from home for America’s best employers.',
  heroSubtitle: 'PremierRemoteBridge places US-based professionals in fully remote roles: data entry, customer support, bookkeeping, payroll, admin, accounting and more. Real employers, pay on every listing, and a recruiter who replies.',
  ctaTitle: 'The best job you have had might be the one you do from home.',
  contactEmail: 'hello@premierremotebridge.com',
  contactPhone: '(404) 555-0170',
  address: '1180 Peachtree St NE, Atlanta, GA 30309',
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
const get = (path) => fetch(`${API_BASE}/api${path}`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))

/**
 * Load the editable site text before the first render. The built-in text stays in place
 * if the API is slow or unavailable, so the site always renders.
 */
export async function hydrateSiteData() {
  const [s] = await Promise.allSettled([withTimeout(get('/settings'), 2500)])
  if (s.status === 'fulfilled' && s.value.settings) {
    const { announcements: list, ...rest } = s.value.settings
    Object.assign(site, rest)
    if (Array.isArray(list)) announcements.splice(0, announcements.length, ...list)
  }
}
