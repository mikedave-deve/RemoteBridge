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
