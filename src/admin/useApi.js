import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Load data from the API, with loading and error states and a reload function. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!path) { setState({ data: null, error: '', loading: false }); return undefined }
    const ctrl = new AbortController()
    // A reload keeps showing the current data; a different path starts empty.
    setState((s) => ({ ...s, data: s.path === path ? s.data : null, loading: true }))
    api(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: '', loading: false, path }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ data: null, error: e.message, loading: false, path }) })
    return () => ctrl.abort()
  }, [path, tick])
  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) }
}

export const when = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')
