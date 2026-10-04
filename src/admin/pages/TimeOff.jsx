import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { BALANCE_TYPES } from '../../lib/benefits'
import { Badge, Card, Notice, PageHead, Tabs, statusTone } from '../../portal/ui'
import EmployeePicker, { useEmployees } from '../EmployeePicker'
import { useApi, when } from '../useApi'

const fmt = (s) => new Date(`${s}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const dates = (r) => (r.from === r.to ? fmt(r.from) : `${fmt(r.from)} – ${fmt(r.to)}`)
const TABS = { Pending: 'Pending', Approved: 'Approved', Declined: 'Declined', All: '' }

function Request({ r, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const act = async (action) => {
    setBusy(true); setErr('')
    try { await api(`/admin/time-off/${r.id}`, { method: 'POST', body: { action, note } }); onDone(`${r.employee.name}’s ${r.type.toLowerCase()} request (${dates(r)}) was ${action === 'approve' ? 'approved' : 'declined'}.`) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <li className="px-6 py-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{r.employee.name}{r.employee.employeeId && <span className="font-normal text-slate"> · {r.employee.employeeId}</span>}</p>
          <p className="text-[14px] text-slate">{r.number} · {r.type} · {dates(r)} · {r.hours} hours · requested {when(r.submittedAt)}</p>
          {r.note && <p className="mt-1 text-[14px] text-ink">“{r.note}”</p>}
          {r.reviewNote && <p className="mt-1 text-[13.5px] text-slate">Review note: {r.reviewNote}</p>}
        </div>
        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
      </div>
      {r.status === 'Pending' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note to the employee (optional)" className="field flex-1" aria-label="Review note" />
          <button disabled={busy} onClick={() => act('approve')} className="btn-primary h-11 px-4 text-[14px]">Approve</button>
          <button disabled={busy} onClick={() => act('decline')} className="btn-ghost h-11 px-4 text-[14px]">Decline</button>
        </div>
      )}
      {err && <p role="alert" className="mt-2 text-[14px] text-red-700">{err}</p>}
    </li>
  )
}

function Balances() {
  const { employees, id, chosen, choose } = useEmployees()
  const data = useApi(id ? `/admin/time-off/balances/${id}` : null)
  const [f, setF] = useState({})
  const [msg, setMsg] = useState({ text: '' })
  useEffect(() => { setF(Object.fromEntries((data.data?.balances || []).map((b) => [b.type, b.accrued]))); setMsg({ text: '' }) }, [data.data])
  const save = async (e) => {
    e.preventDefault()
    try { await api(`/admin/time-off/balances/${id}`, { method: 'PUT', body: { accrued: f } }); setMsg({ text: 'Balances saved. The employee sees them right away.', tone: 'green' }); data.reload() } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) }
  }
  return (
    <Card title="Time off balances">
      <EmployeePicker employees={employees} id={id} choose={choose} />
      {chosen && data.data && (
        <form onSubmit={save} className="mt-5 space-y-4">
          {BALANCE_TYPES.map((t) => {
            const b = data.data.balances.find((x) => x.type === t)
            return (
              <div key={t}>
                <label className="field-label" htmlFor={`bal-${t}`}>{t}: hours accrued</label>
                <input id={`bal-${t}`} inputMode="decimal" value={f[t] ?? ''} onChange={(e) => setF({ ...f, [t]: e.target.value })} className="field" />
                <p className="mt-1 text-[13px] text-slate">Used {b.used} h · Scheduled {b.scheduled} h · Pending {b.pending} h · Available {b.available} h</p>
              </div>
            )
          })}
          {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <button className="btn-dark">Save balances</button>
        </form>
      )}
      {!id && <p className="mt-4 text-[14px] text-slate">Choose an employee to set how many hours they have accrued. Used and scheduled hours come from approved requests.</p>}
    </Card>
  )
}

export default function TimeOff() {
  const [tab, setTab] = useState('Pending')
  const list = useApi(`/admin/time-off${TABS[tab] ? `?status=${TABS[tab]}` : ''}`)
  const [msg, setMsg] = useState('')
  return (
    <div className="space-y-6">
      <PageHead title="Time off" sub="Requests employees submit from their portal, and the balances they can request against." />
      {msg && <Notice>{msg}</Notice>}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Tabs tabs={Object.keys(TABS)} value={tab} onChange={(t) => { setTab(t); setMsg('') }} />
          {list.error && <Notice tone="red">{list.error}</Notice>}
          <Card pad={false}>
            <ul className="divide-y divide-line">
              {(list.data?.requests || []).map((r) => <Request key={r.id} r={r} onDone={(m) => { setMsg(m); list.reload() }} />)}
              {list.data && !list.data.requests.length && <li className="px-6 py-10 text-center text-slate">{tab === 'Pending' ? 'No requests waiting for a decision.' : 'Nothing here yet.'}</li>}
              {!list.data && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
            </ul>
          </Card>
        </div>
        <Balances />
      </div>
    </div>
  )
}
