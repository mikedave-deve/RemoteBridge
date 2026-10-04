import { useState } from 'react'
import { Download, Trash2, UploadCloud } from 'lucide-react'
import { api, fileUrl } from '../../lib/api'
import { prepareUpload } from '../../lib/upload'
import { Badge, Card, Notice, PageHead, statusTone } from '../../portal/ui'
import { useEmployees } from '../EmployeePicker'
import { useApi, when } from '../useApi'

const CATEGORIES = ['Employment', 'Policies', 'Tax', 'Payroll', 'Benefits', 'Training', 'Other']
const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export default function Documents() {
  const { employees } = useEmployees()
  const [filter, setFilter] = useState('')
  const data = useApi(`/admin/documents${filter ? `?userId=${filter}` : ''}`)
  const [msg, setMsg] = useState({ text: '' })
  const [busy, setBusy] = useState(false)

  const upload = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('requiresAck', form.ack.checked ? 'true' : 'false')
    const picked = form.file.files[0]
    setBusy(true)
    try {
      // Send the file straight to Blob when available; otherwise it stays in the form as multipart.
      const prepared = await prepareUpload(picked, 'document')
      if (prepared.fileRef) { fd.delete('file'); fd.append('fileRef', prepared.fileRef) }
      await api('/admin/documents', { method: 'POST', form: fd }); form.reset(); setMsg({ text: 'Document uploaded. It is now in the employee’s Documents page.', tone: 'green' }); data.reload()
    } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  const remove = async (d) => {
    if (!window.confirm(`Delete “${d.name}”? Employees will no longer see it.`)) return
    try { await api(`/admin/documents/${d.id}`, { method: 'DELETE' }); data.reload() } catch (e) { setMsg({ text: e.message, tone: 'red' }) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Documents" sub="Upload paperwork and policies to one employee or to everyone. Mark a document as needing acknowledgement and you can see who has read it." />
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card title="Upload a document">
        <form onSubmit={upload} className="grid gap-4 md:grid-cols-2">
          <div><label className="field-label" htmlFor="d-user">Share with</label>
            <select id="d-user" name="userId" required className="field"><option value="">Choose…</option><option value="all">All employees</option>
              {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}{u.employeeId ? ` · ${u.employeeId}` : ''}</option>)}</select></div>
          <div><label className="field-label" htmlFor="d-cat">Category</label><select id="d-cat" name="category" className="field">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="md:col-span-2"><label className="field-label" htmlFor="d-name">Document name</label><input id="d-name" name="name" required maxLength={140} placeholder="e.g. Employee handbook 2026" className="field" /></div>
          <div><label className="field-label" htmlFor="d-file">File (up to 10 MB)</label><input id="d-file" name="file" type="file" required className="field pt-2.5 text-[14px]" /></div>
          <label className="flex items-center gap-3 self-end pb-3 text-[14.5px]"><input name="ack" type="checkbox" className="h-4 w-4 accent-bridge-600" />Employee must read and acknowledge it</label>
          <div><button disabled={busy} className="btn-dark disabled:opacity-60"><UploadCloud size={17} /> Upload</button></div>
        </form>
      </Card>

      <label className="block md:w-[420px]"><span className="field-label">Show documents for</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field"><option value="">All documents</option>
          {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}</option>)}</select></label>

      <Card pad={false}>
        <ul className="divide-y divide-line">
          {(data.data?.documents || []).map((d) => (
            <li key={d.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{d.name}</p>
                <p className="text-[13.5px] text-slate">{d.employee} · {d.category} · {d.fileName} ({size(d.size)}) · uploaded {when(d.createdAt)}</p>
              </div>
              <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              <a href={fileUrl(`/admin/documents/${d.id}/file`)} download className="btn-ghost h-9 px-3 text-[14px]"><Download size={15} /> File</a>
              <button onClick={() => remove(d)} className="grid h-9 w-9 place-items-center rounded-full text-red-700 ring-1 ring-line hover:bg-red-50" aria-label={`Delete ${d.name}`}><Trash2 size={15} /></button>
            </li>
          ))}
          {data.data && !data.data.documents.length && <li className="px-6 py-10 text-center text-slate">No documents uploaded yet.</li>}
        </ul>
      </Card>
    </div>
  )
}
