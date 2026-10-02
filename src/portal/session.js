import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Asks the server who is signed in. The session itself lives in an HttpOnly cookie. */
export function useSession() {
  const [state, setState] = useState({ loading: true, user: null })
  useEffect(() => {
    const ctrl = new AbortController()
    api('/auth/me', { signal: ctrl.signal })
      .then(({ user }) => setState({ loading: false, user }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ loading: false, user: null }) })
    return () => ctrl.abort()
  }, [])
  return state
}

export const signOut = () => api('/auth/logout', { method: 'POST' }).catch(() => {})
