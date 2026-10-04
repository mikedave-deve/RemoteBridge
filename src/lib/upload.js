import { API_BASE, api } from './api'

// Where files go: straight to Vercel Blob in production (no 4.5 MB function limit),
// or through the server as multipart in local dev. The server tells us which, and
// which access level the store uses (private by default).
let cfg
async function uploadConfig() {
  if (cfg === undefined) {
    try { const c = await api('/upload/config'); cfg = { blob: !!c.blob, access: c.access === 'public' ? 'public' : 'private' } }
    catch { cfg = { blob: false, access: 'private' } }
  }
  return cfg
}

/**
 * Prepare one file for a create endpoint.
 * kind: 'identity' | 'tax' | 'document' | 'receipt'
 * Returns { fileRef } when uploaded directly to Blob, or { file } to send as multipart.
 */
export async function prepareUpload(file, kind) {
  if (!file) return {}
  const { blob: on, access } = await uploadConfig()
  if (on) {
    const { upload } = await import('@vercel/blob/client')
    const safe = (file.name || 'file').replace(/[^\w.-]/g, '_')
    const blob = await upload(`${kind}/${Date.now()}-${safe}`, file, {
      access,
      handleUploadUrl: `${API_BASE}/api/upload/token`,
      clientPayload: JSON.stringify({ kind }),
    })
    return { fileRef: JSON.stringify({ url: blob.url, name: file.name, type: file.type, size: file.size }) }
  }
  return { file }
}

/** Append a prepared upload to a FormData under the given field names. */
export function appendUpload(fd, prepared, { fileField, refField }) {
  if (prepared.fileRef) fd.append(refField, prepared.fileRef)
  else if (prepared.file) fd.append(fileField, prepared.file)
  return fd
}
