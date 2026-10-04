import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'
import { Badge, Card, Notice, PageHead, Table, Tabs, statusTone } from '../../portal/ui'
import { useApi, when } from '../useApi'

const TZ = 'America/New_York'
const time = (d) => (d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '—')
const day = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const TABS = { 'Waiting for approval': 'Pending approval', Approved: 'Approved', Returned: 'Returned', All: '' }

function Sheet({ t, onDone }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const act = async (action) => {
    if (action === 'return' && !note.trim()) return setErr('Add a note so the employee knows what to fix.')
    setBusy(true); setErr('')
    try { await api(`/admin/timesheets/${t.id}`, { method: 'POST', body: { action, note } }); onDone(`${t.employee.name}’s timesheet for ${t.week} was ${action === 'approve' ? 'approved' : 'returned for changes'}.`) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <li className="px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-start gap-2 text-left" aria-expanded={open}>
          <ChevronDown size={18} className={`mt-0.5 shrink-0 text-slate transition-transform ${open ? 'rotate-180' : ''}`} />
          <span><span className="block font-medium">{t.employee.name}{t.employee.employeeId ? <span className="font-normal text-slate"> · {t.employee.employeeId}</span> : ''}</span>
            <span className="text-[13.5px] text-slate">{t.week} · {t.total.toFixed(2)} hours{t.overtime ? ` (${t.overtime.toFixed(2)} overtime)` : ''} · submitted {when(t.submittedAt)}</span></span>
        </button>
        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
      </div>
      {open && (
        <div className="mt-4 space-y-4 rounded-xl ring-1 ring-line">
          <Table head={['Day', 'Clock in', 'Meal break', 'Clock out', 'Hours']} align={['', '', '', '', 'r']}
            rows={t.days.map((d) => [day(d.date), time(d.in), d.breakMin ? `${d.breakMin} min` : '—', time(d.out), d.hours ? d.hours.toFixed(2) : '—'])} />
          <div className="space-y-3 px-5 pb-5">
            {t.note && <p className="text-[14px] text-slate">Employee note: {t.note}</p>}
            {t.reviewNote && <p className="text-[14px] text-slate">Review note: {t.reviewNote}</p>}
            {t.status === 'Pending approval' && <>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note to the employee (required when returning)" className="field" aria-label="Review note" />
              {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
              <div className="flex gap-2"><button disabled={busy} onClick={() => act('approve')} className="btn-primary h-10 px-4 text-[14px]">Approve</button><button disabled={busy} onClick={() => act('return')} className="btn-ghost h-10 px-4 text-[14px]">Return for changes</button></div>
            </>}
          </div>
        </div>
      )}
    </li>
  )
}

export default function Time() {
  const [tab, setTab] = useState('Waiting for approval')
  const sheets = useApi(`/admin/timesheets${TABS[tab] ? `?status=${encodeURIComponent(TABS[tab])}` : ''}`)
  const punches = useApi('/admin/punches')
  const [msg, setMsg] = useState('')

  return (
    <div className="space-y-6">
      <PageHead title="Timesheets" sub="Clock-ins and clock-outs as they happen, and the weekly timesheets employees submit for approval. Approved hours can be pulled straight into a pay stub." />
      {msg && <Notice>{msg}</Notice>}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Tabs tabs={Object.keys(TABS)} value={tab} onChange={(t) => { setTab(t); setMsg('') }} />
          {sheets.error && <Notice tone="red">{sheets.error}</Notice>}
          <Card pad={false}>
            <ul className="divide-y divide-line">
              {(sheets.data?.timesheets || []).map((t) => <Sheet key={t.id} t={t} onDone={(m) => { setMsg(m); sheets.reload() }} />)}
              {sheets.data && !sheets.data.timesheets.length && <li className="px-6 py-10 text-center text-slate">{tab === 'Waiting for approval' ? 'No timesheets waiting for approval.' : 'Nothing here yet.'}</li>}
              {!sheets.data && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="On the clock now" action={<button onClick={punches.reload} className="text-[14px] text-bridge-700 hover:underline">Refresh</button>} pad={false}>
            <ul className="divide-y divide-line text-[14.5px]">
              {(punches.data?.working || []).map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 px-6 py-3"><span>{w.name}</span><Badge tone={w.state === 'break' ? 'amber' : 'green'}>{w.state === 'break' ? 'On break' : 'Working'} since {time(w.since)}</Badge></li>
              ))}
              {punches.data && !punches.data.working.length && <li className="px-6 py-6 text-slate">Nobody is clocked in.</li>}
            </ul>
          </Card>
          <Card title="Clock activity, last 7 days" pad={false}>
            <ul className="max-h-[520px] divide-y divide-line overflow-y-auto text-[14px]">
              {(punches.data?.punches || []).map((p, i) => (
                <li key={i} className="px-6 py-3"><span className="block text-ink">{p.employee.name} · {p.what}</span><span className="text-[13px] text-slate">{when(p.at)}</span></li>
              ))}
              {punches.data && !punches.data.punches.length && <li className="px-6 py-6 text-slate">No clock activity yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
