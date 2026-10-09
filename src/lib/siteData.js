import { useSyncExternalStore } from 'react'
import { API_BASE } from './api'
import { announcements } from '../data/portal'

// Editable site text. Defaults match the built-in copy; values saved on the server override them.
export const site = {
  heroTitle: 'Work from home for America’s best employers.',
  heroSubtitle: 'PremierRemoteBridge places US-based professionals in fully remote roles: data entry, customer support, bookkeeping, payroll, admin, accounting and more. Real employers, pay on every listing, and a recruiter who replies.',
  ctaTitle: 'The best job you have had might be the one you do from home.',
  contactEmail: 'hello@premierremotebridge.com',
  contactPhone: '(859) 316-5113',
  address: '201 E Main St, Lexington, KY 40507',
}

let version = 0
const listeners = new Set()
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

/** Components that show site text call this so they re-render if the server sends newer text. */
export const useSite = () => useSyncExternalStore(subscribe, () => version)

/**
 * Fetch the saved site text in the background. The page renders straight away with the built-in
 * text, so a slow or unreachable API never delays loading (or reloading) any page.
 */
export function hydrateSiteData() {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  fetch(`${API_BASE}/api/settings`, { credentials: 'include', signal: ctrl.signal })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.settings) return
      const { announcements: list, ...rest } = data.settings
      Object.assign(site, rest)
      if (Array.isArray(list)) announcements.splice(0, announcements.length, ...list)
      version++
      listeners.forEach((fn) => fn())
    })
    .catch(() => {})
    .finally(() => clearTimeout(timer))
}
