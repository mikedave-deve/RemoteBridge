/** Formats US phone input as (555) 123-4567, dropping a leading country code. */
export const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
// US area codes never start with 0 or 1.
export const validPhone = (v) => /^\(\d{3}\) \d{3}-\d{4}$/.test(v) && !/^\([01]/.test(v)
export const validEmail = (v) => /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(v.trim())
