// Thin wrapper around fetch for our own API. Cookies carry the session; errors become thrown ApiErrors.
export class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data || {} }
}

// Empty when the API is served from the same domain (or proxied in development).
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/** Link to a file the API serves, like a pay stub PDF. The session cookie goes along with the download. */
export const fileUrl = (path) => `${API_BASE}/api${path}`

export async function api(path, { method = 'GET', body, form, signal } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method, signal, credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('We could not reach the server. Check your connection and try again.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data)
  return data
}
