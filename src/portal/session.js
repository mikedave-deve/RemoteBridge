// Demo session flag. A real portal would rely on an HttpOnly session cookie set by the server.
const KEY = 'rb-portal-session'
export const signIn = () => { try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* storage blocked */ } }
export const signOut = () => { try { sessionStorage.removeItem(KEY) } catch { /* storage blocked */ } }
export const isSignedIn = () => { try { return !!sessionStorage.getItem(KEY) } catch { return false } }
