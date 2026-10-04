import crypto from 'node:crypto'

// File storage. On Vercel we keep uploaded files in Vercel Blob; everywhere else
// (local dev, tests) we keep the bytes in MongoDB so nothing extra is needed.
// The Blob store is private by default, so files are never readable from their URL:
// the server reads them with the store token and streams them through the same
// authenticated routes as before. Set BLOB_ACCESS=public only for a public store.

const token = () => process.env.BLOB_READ_WRITE_TOKEN || ''
export const usingBlob = () => !!token()
const blobAccess = () => (process.env.BLOB_ACCESS === 'public' ? 'public' : 'private')
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
    const { url } = await put(key, buffer, { access: blobAccess(), contentType: base.type, addRandomSuffix: false, token: token() })
    return { ...base, url, key }
  }
  return { ...base, data: buffer }
}

/** Read the bytes of a stored file back (for streaming or email attachments). */
export async function readFile(file) {
  if (!file) return null
  if (file.url) {
    // A plain fetch works for public blobs and local test bases; private blobs need the token.
    const direct = await fetch(file.url).catch(() => null)
    if (direct && direct.ok) return { buffer: Buffer.from(await direct.arrayBuffer()), type: file.type, name: file.name }
    if (usingBlob()) {
      const { get } = await import('@vercel/blob')
      const g = await get(file.url, { access: blobAccess(), token: token() })
      if (!g) throw new Error('Blob not found')
      return { buffer: Buffer.from(await new Response(g.stream).arrayBuffer()), type: file.type, name: file.name }
    }
    throw new Error(`Could not read file (${direct?.status || 'no response'})`)
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
// The browser uploads straight to Blob and sends us the URL. We confirm it is a blob
// in our store, read its first bytes to verify the real type, and check the size.
const BLOB_HOST = /(^|\.)blob\.vercel-storage\.com$/
const blobBase = () => (process.env.BLOB_PUBLIC_BASE || '').replace(/\/$/, '')
const sniffType = (buf) => {
  const h = buf.subarray(0, 4).toString('hex')
  return h === '25504446' ? 'application/pdf' : buf.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : h === '89504e47' ? 'image/png' : null
}
const OFFICE_TYPES = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.ms-excel', 'text/plain', 'text/csv']

// Metadata and first bytes of a blob, via the token (works for private blobs).
async function blobHead(url) { try { const { head } = await import('@vercel/blob'); return await head(url, { token: token() }) } catch { return null } }
async function blobFirstBytes(url) {
  try {
    const { get } = await import('@vercel/blob')
    const g = await get(url, { access: blobAccess(), token: token() })
    if (!g) return null
    const reader = g.stream.getReader()
    const { value } = await reader.read()
    reader.cancel().catch(() => {})
    return value ? Buffer.from(value) : null
  } catch { return null }
}

/** Turn a client-provided Blob reference into a file record, validating origin, type and size. */
export async function refToFile(fileRef, { allowed, maxBytes = 15 * 1024 * 1024, docs = false } = {}) {
  let r
  try { r = typeof fileRef === 'string' ? JSON.parse(fileRef) : fileRef } catch { return null }
  if (!r?.url || typeof r.url !== 'string') return null
  let u
  try { u = new URL(r.url) } catch { return null }
  const base = blobBase()
  const okHost = (u.protocol === 'https:' && BLOB_HOST.test(u.hostname)) || (base && r.url.startsWith(base + '/'))
  if (!okHost) return null

  let firstBytes, size = Number(r.size) || 0, declared = String(r.type || '')
  // Public blobs and local test bases are readable directly; a private store needs the token.
  const ranged = await fetch(r.url, { headers: { Range: 'bytes=0-15' } }).catch(() => null)
  if (ranged && (ranged.ok || ranged.status === 206)) {
    firstBytes = Buffer.from(await ranged.arrayBuffer())
  } else if (usingBlob()) {
    const meta = await blobHead(r.url)
    if (!meta) return null // head only succeeds for a blob in our store
    size = meta.size
    declared = meta.contentType || declared
    firstBytes = await blobFirstBytes(r.url)
  }
  if (!firstBytes) return null
  if (size > maxBytes) return null

  let type = sniffType(firstBytes)
  if (!type && docs) {
    // Admin documents may be Office or text files, which don't sniff to one MIME type;
    // trust the store-verified content type for those.
    const h = firstBytes.subarray(0, 4).toString('hex')
    if (((h === '504b0304' || h === 'd0cf11e0') || /^text\//.test(declared)) && OFFICE_TYPES.includes(declared)) type = declared
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
