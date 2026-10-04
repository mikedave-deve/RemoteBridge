import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { api, fileUrl } from '../../lib/api'
import { REQUEST_STATUSES } from '../../lib/support'
import { Badge, Card, Notice, PageHead, Tabs, statusTone } from '../../portal/ui'
import { useApi, when } from '../useApi'

const usd = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const TABS = { services: 'Company services', equipment: 'Equipment', details: 'Name submissions' }

function Row({ r, kind, onSaved }) {
  const [status, setStatus] = useState(r.status)
  const [reply, setReply] = useState(r.reply)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const save = async () => {
    setBusy(true); setErr('')
    try { await api(`/admin/${kind}-requests/${r.id}`, { method: 'POST', body: { status, reply } }); onSaved(`${r.number} saved. ${r.employee?.name || 'The employee'} sees the update in their portal.`) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const urgent = /lost|stolen/i.test(r.type || '')
  return (
    <li className="px-6 py-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{r.number} · {kind === 'service' ? r.serviceTitle : r.type} {urgent && <Badge tone="red">Urgent</Badge>}</p>
          <p className="text-[13.5px] text-slate">{r.employee?.name || 'Former employee'}{r.employee?.employeeId ? ` · ${r.employee.employeeId}` : ''} · {r.employee?.email} · opened {when(r.createdAt)}</p>
          <p className="mt-2 text-[14.5px] font-medium text-ink">{kind === 'service' ? r.subject : r.item}</p>
          <p className="mt-1 whitespace-pre-line text-[14.5px] text-slate">{r.details}</p>
          {r.amount != null && <p className="mt-2 flex flex-wrap items-center gap-3 text-[14px]">Amount <strong>{usd(r.amount)}</strong>
            {r.hasReceipt && <a href={fileUrl(`/admin/service-requests/${r.id}/receipt`)} download className="inline-flex items-center gap-1 text-bridge-700 hover:underline"><Download size={14} /> Receipt ({r.receiptName})</a>}</p>}
        </div>
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field sm:w-44" aria-label="Status">{REQUEST_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} placeholder="Reply to the employee (optional)" className="field flex-1" aria-label="Reply" />
        <button disabled={busy} onClick={save} className="btn-dark h-12 px-5 text-[14px] disabled:opacity-60">Save</button>
      </div>
      {err && <p role="alert" className="mt-2 text-[14px] text-red-700">{err}</p>}
    </li>
  )
}

function List({ kind, status, onMsg }) {
  const q = status !== 'All' ? `?status=${encodeURIComponent(status)}` : ''
  const data = useApi(`/admin/${kind}-requests${q}`)
  return (
    <Card pad={false}>
      {data.error && <div className="p-6"><Notice tone="red">{data.error}</Notice></div>}
      <ul className="divide-y divide-line">
        {(data.data?.requests || []).map((r) => <Row key={`${r.id}-${r.status}-${r.updatedAt}`} r={r} kind={kind} onSaved={(m) => { onMsg(m); data.reload() }} />)}
        {data.data && !data.data.requests.length && <li className="px-6 py-10 text-center text-slate">No {status === 'All' ? '' : `${status.toLowerCase()} `}requests.</li>}
        {!data.data && !data.error && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
      </ul>
    </Card>
  )
}

function Details() {
  const data = useApi('/admin/details')
  return (
    <Card pad={false}>
      <ul className="divide-y divide-line">
        {(data.data?.submissions || []).map((d) => (
          <li key={d.id} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span><span className="block font-medium">{d.first} {d.last}</span><span className="text-[13.5px] text-slate">{d.box} · from {d.employee?.name || 'former employee'}{d.employee?.employeeId ? ` (${d.employee.employeeId})` : ''}</span></span>
            <span className="text-[13.5px] text-slate">{when(d.at)} · emailed</span>
          </li>
        ))}
        {data.data && !data.data.submissions.length && <li className="px-6 py-10 text-center text-slate">No submissions yet. Benefits and company phone line details appear here and in your email.</li>}
      </ul>
    </Card>
  )
}

export default function Requests() {
  const [params, setParams] = useSearchParams()
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'services'
  const [status, setStatus] = useState('Open')
  const [msg, setMsg] = useState('')
  return (
    <div className="space-y-6">
      <PageHead title="Employee requests" sub="Company services requests, equipment requests and problem reports, and the name submissions from Benefits and the company phone line." />
      <Tabs tabs={Object.values(TABS)} value={TABS[tab]} onChange={(t) => { setParams({ tab: Object.keys(TABS).find((k) => TABS[k] === t) }); setMsg('') }} />
      {msg && <Notice>{msg}</Notice>}
      {tab !== 'details' && (
        <div className="flex flex-wrap gap-2">
          {['Open', 'In progress', 'Resolved', 'Declined', 'All'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-1.5 text-[14px] ring-1 ${status === s ? 'bg-bridge-900 text-white ring-bridge-900' : 'bg-white text-slate ring-line hover:text-ink'}`}>{s}</button>
          ))}
        </div>
      )}
      {tab === 'details' ? <Details /> : <List key={`${tab}-${status}`} kind={tab === 'services' ? 'service' : 'equipment'} status={status} onMsg={setMsg} />}
    </div>
  )
}
