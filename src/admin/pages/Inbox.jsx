import { useState } from 'react'
import { Archive, Check, Download, FileText, Mail, Reply } from 'lucide-react'
import { api, API_BASE } from '../../lib/api'
import { Badge, Card, Field, Notice, PageHead, Tabs } from '../../portal/ui'
import { useApi, when } from '../useApi'

const TABS = { All: '', Résumés: 'resume', Messages: 'contact' }
const tone = { new: 'teal', reviewed: 'green', archived: 'gray' }

export default function Inbox() {
  const [tab, setTab] = useState('All')
  const { data, error, reload } = useApi(`/admin/submissions${TABS[tab] ? `?type=${TABS[tab]}` : ''}`)
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')

  const mark = async (m, status) => {
    try { await api(`/admin/submissions/${m.id}`, { method: 'PATCH', body: { status } }); setOpen({ ...m, status }); reload() }
    catch (e) { setErr(e.message) }
  }
  const select = (m) => { setOpen(m); if (m.status === 'new') mark(m, 'reviewed') }
  const m = open

  return (
    <div className="space-y-6">
      <PageHead title="Inbox" sub="Résumés and hiring-team messages sent from the website. Each one was also emailed to the admin address." />
      <Tabs tabs={Object.keys(TABS)} value={tab} onChange={(t) => { setTab(t); setOpen(null) }} />
      {(error || err) && <Notice tone="red">{error || err}</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <Card pad={false}>
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
            {(data?.submissions || []).map((s) => (
              <li key={s.id}>
                <button onClick={() => select(s)} className={`flex w-full items-start gap-3 px-6 py-4 text-left hover:bg-paper ${m?.id === s.id ? 'bg-bridge-50' : ''}`}>
                  {s.type === 'resume' ? <FileText size={18} className="mt-0.5 shrink-0 text-bridge-700" /> : <Mail size={18} className="mt-0.5 shrink-0 text-bridge-700" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block ${s.status === 'new' ? 'font-semibold' : 'font-medium'}`}>{s.type === 'resume' ? `${s.first} ${s.last}` : `${s.name} · ${s.company}`}</span>
                    <span className="block truncate text-[13.5px] text-slate">{s.type === 'resume' ? `Résumé · ${s.field}` : `${s.need} · ${s.roles} role(s)`} · {when(s.createdAt)}</span>
                  </span>
                  <Badge tone={tone[s.status]}>{s.status}</Badge>
                </button>
              </li>
            ))}
            {data && !data.submissions.length && <li className="px-6 py-10 text-center text-slate">Nothing here yet.</li>}
          </ul>
        </Card>

        {m ? (
          <Card title={m.type === 'resume' ? 'Résumé submission' : 'Hiring enquiry'} action={<span className="text-[13.5px] text-slate">{when(m.createdAt)}</span>}>
            <dl className="grid gap-5 sm:grid-cols-2">
              {m.type === 'resume' ? (
                <>
                  <Field label="Name" value={`${m.first} ${m.last}`} /><Field label="Email" value={m.email} />
                  <Field label="Phone" value={m.phone} /><Field label="Field of interest" value={m.field} />
                  <Field label="Experience" value={m.level} /><Field label="Applying for" value={m.role || 'General résumé'} />
                </>
              ) : (
                <>
                  <Field label="Name" value={m.name} /><Field label="Company" value={m.company} />
                  <Field label="Work email" value={m.email} /><Field label="Needs" value={m.need} />
                  <Field label="Roles to fill" value={m.roles} />
                </>
              )}
            </dl>
            {(m.note || m.message) && (
              <div className="mt-5 rounded-xl bg-paper p-4 ring-1 ring-line">
                <p className="text-[13px] text-slate">{m.type === 'resume' ? 'Anything else' : 'About the role'}</p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink">{m.note || m.message}</p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {m.type === 'resume' && <a href={`${API_BASE}/api/admin/submissions/${m.id}/file`} className="btn-primary h-10 px-4 text-[14px]"><Download size={16} /> Download {m.fileName}</a>}
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(m.type === 'resume' ? 'Your résumé with PremierRemoteBridge' : 'Re: your hiring enquiry')}`} className="btn-ghost h-10 px-4 text-[14px]"><Reply size={16} /> Reply by email</a>
              {m.status !== 'archived'
                ? <button onClick={() => mark(m, 'archived')} className="btn-ghost h-10 px-4 text-[14px]"><Archive size={16} /> Archive</button>
                : <button onClick={() => mark(m, 'reviewed')} className="btn-ghost h-10 px-4 text-[14px]"><Check size={16} /> Move back to inbox</button>}
            </div>
          </Card>
        ) : (
          <div className="hidden place-items-center rounded-2xl border-2 border-dashed border-line p-10 text-center text-slate xl:grid">Select a message to read it.</div>
        )}
      </div>
    </div>
  )
}
