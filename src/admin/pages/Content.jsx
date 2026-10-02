import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { Card, Notice, PageHead } from '../../portal/ui'
import { useApi, when } from '../useApi'

export default function Content() {
  const { data, error } = useApi('/admin/settings')
  const [f, setF] = useState(null)
  const [msg, setMsg] = useState({ text: '', tone: 'green' })
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (data) setF({ announcements: [], ...data.settings }) }, [data])

  if (error) return <Notice tone="red">{error}</Notice>
  if (!f) return <p className="text-slate">Loading…</p>

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setA = (i, k) => (e) => setF({ ...f, announcements: f.announcements.map((a, j) => (j === i ? { ...a, [k]: e.target.value } : a)) })
  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const { settings } = await api('/admin/settings', { method: 'PUT', body: f })
      setF({ announcements: [], ...settings }); setMsg({ text: 'Saved. Visitors see the new content the next time they load the site.', tone: 'green' })
    } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  const field = (k, label, rows) => (
    <div>
      <label className="field-label" htmlFor={`s-${k}`}>{label}</label>
      {rows ? <textarea id={`s-${k}`} rows={rows} value={f[k] || ''} onChange={set(k)} maxLength={400} className="field-area" /> : <input id={`s-${k}`} value={f[k] || ''} onChange={set(k)} maxLength={200} className="field" />}
    </div>
  )

  return (
    <form onSubmit={save} className="space-y-6">
      <PageHead title="Site content" sub={f.updatedAt ? `Last updated ${when(f.updatedAt)}${f.updatedBy ? ` by ${f.updatedBy}` : ''}.` : 'Edit the main text on the website and the announcements employees see.'}
        actions={<button disabled={busy} className="btn-dark h-11 disabled:opacity-60">Save changes</button>} />
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Home page">
          <div className="space-y-4">
            {field('heroTitle', 'Hero headline', 2)}
            {field('heroSubtitle', 'Hero description', 4)}
            {field('ctaTitle', 'Closing call-to-action headline', 2)}
          </div>
        </Card>
        <Card title="Contact details">
          <div className="space-y-4">
            {field('contactEmail', 'Public email (shown in the FAQ)')}
            {field('contactPhone', 'HR and payroll phone (shown in the employee portal)')}
            {field('address', 'Office address (shown in the footer)')}
          </div>
        </Card>
      </div>

      <Card title="Employee announcements" action={<button type="button" onClick={() => setF({ ...f, announcements: [{ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), title: '', body: '' }, ...f.announcements] })} className="btn-ghost h-9 px-3 text-[14px]"><Plus size={15} /> Add</button>}>
        <p className="mb-5 text-[14px] text-slate">Shown on every employee’s portal dashboard, newest first.</p>
        <div className="space-y-4">
          {f.announcements.map((a, i) => (
            <div key={i} className="grid gap-3 rounded-xl bg-paper p-4 ring-1 ring-line sm:grid-cols-[160px_1fr_auto]">
              <input aria-label="Date" value={a.date} onChange={setA(i, 'date')} maxLength={40} className="field" />
              <div className="space-y-3">
                <input aria-label="Title" value={a.title} onChange={setA(i, 'title')} maxLength={120} placeholder="Title" className="field" />
                <textarea aria-label="Message" rows={2} value={a.body} onChange={setA(i, 'body')} maxLength={600} placeholder="Message" className="field-area" />
              </div>
              <button type="button" onClick={() => setF({ ...f, announcements: f.announcements.filter((_, j) => j !== i) })} className="grid h-10 w-10 place-items-center rounded-full text-red-700 ring-1 ring-line hover:bg-red-50" aria-label="Remove announcement"><Trash2 size={15} /></button>
            </div>
          ))}
          {!f.announcements.length && <p className="text-slate">No announcements.</p>}
        </div>
      </Card>
    </form>
  )
}
