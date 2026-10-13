import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Asks the server who is signed in. The session itself lives in an HttpOnly cookie. */
export function useSession() {
  const [state, setState] = useState({ loading: true, user: null, impersonating: null })
  useEffect(() => {
    const ctrl = new AbortController()
    api('/auth/me', { signal: ctrl.signal })
      .then(({ user, impersonating }) => setState({ loading: false, user, impersonating: impersonating || null }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ loading: false, user: null, impersonating: null }) })
    return () => ctrl.abort()
  }, [])
  return state
}

export const signOut = () => api('/auth/logout', { method: 'POST' }).catch(() => {})

/** End an admin "log in as employee" session; restores the admin's own session. */
export const stopImpersonating = () => api('/auth/stop-impersonating', { method: 'POST' })
