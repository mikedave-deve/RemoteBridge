import crypto from 'node:crypto'

// File storage. On Vercel we keep uploaded files in Vercel Blob; everywhere else
// (local dev, tests) we keep the bytes in MongoDB so nothing extra is needed.
// Blob URLs are unguessable but public, so sensitive files (identity selfies, tax
// forms, receipts) are never handed to the browser directly — the server fetches
// the bytes and streams them through the same authenticated routes as before.

const token = () => process.env.BLOB_READ_WRITE_TOKEN || ''
export const usingBlob = () => !!token()
const safeName = (name) => String(name || 'file').replace(/[^\w.\- ]/g, '_').slice(0, 120) || 'file'
const EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/msword': 'doc' }
const extname = (type, name) => {
  if (EXT[type]) return EXT[type]
  const e = String(name || '').split('.').pop()
  return /^[a-z0-9]{1,5}$/i.test(e) ? e.toLowerCase() : 'bin'
}

/** Save bytes and return the record to store in Mongo: {name,type,size, url?,key? | data?}. */
export async function storeFile({ buffer, type, name }, folder = 'uploads') {
  const base = { name: safeName(name), type: type || 'application/octet-stream', size: buffer.length }
  if (usingBlob()) {
    const { put } = await import('@vercel/blob')
    const key = `${folder}/${crypto.randomUUID()}.${extname(type, name)}`
    const { url } = await put(key, buffer, { access: 'public', contentType: base.type, addRandomSuffix: false, token: token() })
    return { ...base, url, key }
  }
  return { ...base, data: buffer }
}

/** Read the bytes of a stored file back (for streaming or email attachments). */
export async function readFile(file) {
  if (!file) return null
  if (file.url) {
    const r = await fetch(file.url)
    if (!r.ok) throw new Error(`Blob fetch failed (${r.status})`)
    return { buffer: Buffer.from(await r.arrayBuffer()), type: file.type, name: file.name }
  }
  const d = file.data
  const buffer = d?.buffer ? Buffer.from(d.buffer) : Buffer.from(d)
  return { buffer, type: file.type, name: file.name }
}

/** Remove a stored file (blob only; Mongo bytes go away with the document). */
export async function deleteFile(file) {
  if (file?.url && usingBlob()) {
    try { const { del } = await import('@vercel/blob'); await del(file.url, { token: token() }) }
    catch (e) { console.error('[blob] delete failed:', e.message) }
  }
}

// ---- Direct browser-to-Blob uploads (files bypass the 4.5 MB function limit) ----
// A file uploaded by the browser is referenced by its Blob URL. We confirm the URL
// belongs to our store and sniff the first bytes to verify the real type before saving.
const BLOB_HOST = /(^|\.)public\.blob\.vercel-storage\.com$/
const blobBase = () => (process.env.BLOB_PUBLIC_BASE || '').replace(/\/$/, '')
const sniffType = (buf) => {
  const h = buf.subarray(0, 4).toString('hex')
  return h === '25504446' ? 'application/pdf' : buf.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : h === '89504e47' ? 'image/png' : null
}

const OFFICE_TYPES = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.ms-excel', 'text/plain', 'text/csv']

/** Turn a client-provided Blob reference into a file record, validating origin, type and size. */
export async function refToFile(fileRef, { allowed, maxBytes = 15 * 1024 * 1024, docs = false } = {}) {
  let r
  try { r = typeof fileRef === 'string' ? JSON.parse(fileRef) : fileRef } catch { return null }
  if (!r?.url || typeof r.url !== 'string') return null
  let u
  try { u = new URL(r.url) } catch { return null }
  const base = blobBase()
  // Vercel Blob is always https; an explicitly configured base is trusted as the operator set it.
  const okHost = (u.protocol === 'https:' && BLOB_HOST.test(u.hostname)) || (base && r.url.startsWith(base + '/'))
  if (!okHost) return null
  const size = Number(r.size) || 0
  if (size > maxBytes) return null
  // Read only the first bytes to verify the real file type.
  const head = await fetch(r.url, { headers: { Range: 'bytes=0-15' } }).catch(() => null)
  if (!head || !(head.ok || head.status === 206)) return null
  const buf = Buffer.from(await head.arrayBuffer())
  let type = sniffType(buf)
  if (!type && docs) {
    // Admin documents may be Office or text files, which don't sniff to one MIME type.
    const h = buf.subarray(0, 4).toString('hex')
    const declared = String(r.type || '')
    if ((h === '504b0304' || h === 'd0cf11e0' || /^text\//.test(declared)) && OFFICE_TYPES.includes(declared)) type = declared
  }
  if (!type || (allowed && !allowed.includes(type))) return null
  return { name: safeName(r.name), type, size: size || undefined, url: r.url, key: decodeURIComponent(u.pathname.replace(/^\//, '')) }
}

export const UPLOAD_TYPES = { image: ['application/pdf', 'image/jpeg', 'image/png'], document: ['application/pdf', 'image/jpeg', 'image/png', ...OFFICE_TYPES] }

/** Stream a stored file to the response with download/inline headers. */
export async function streamFile(res, file, { inline = false } = {}) {
  const f = await readFile(file)
  res.set({
    'Content-Type': f.type || 'application/octet-stream',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName(f.name)}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.send(f.buffer)
}
