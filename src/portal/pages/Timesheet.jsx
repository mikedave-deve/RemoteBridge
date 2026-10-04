import { useEffect, useState } from 'react'
import { Coffee, LogIn, LogOut } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi, when } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'

const TZ = 'America/New_York'
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
const time = (d) => (d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }) : null)
const dayName = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
const dayDate = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const dash = (k) => <span key={k} className="text-slate-soft">—</span>

export default function Timesheet() {
  const [week, setWeek] = useState('')
  const t = useApi(`/me/time${week ? `?week=${week}` : ''}`)
  const d = t.data
  const [clock, setClock] = useState(now())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => { const id = setInterval(() => setClock(now()), 15000); return () => clearInterval(id) }, [])
  // Keep hours of an open shift ticking while the page is open.
  const { reload } = t
  useEffect(() => { if (d?.state !== 'in') return undefined; const id = setInterval(reload, 60000); return () => clearInterval(id) }, [d?.state, reload])

  const punch = async (type) => {
    setBusy(true); setErr('')
    try { await api('/me/time/punch', { method: 'POST', body: { type } }); reload() } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await api('/me/time/submit', { method: 'POST', body: { week: d.week.start, certify: true } }); setMsg(`Timesheet submitted for approval. ${d.approver} has been notified.`); reload() }
    catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const state = d?.state || 'out'
  const sub = d?.submission
  const canSubmit = d && (!sub || sub.status === 'Returned')

  return (
    <div className="space-y-6">
      <PageHead title="Timesheet" sub={d ? `${d.week.label} · Approver: ${d.approver}` : 'Loading your timesheet…'}
        actions={d && !d.week.current && <button onClick={() => { setWeek(''); setMsg('') }} className="btn-ghost h-11">Back to this week</button>} />
      {t.error && <Notice tone="red">{t.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Time clock">
          <p className="text-[13.5px] text-slate">Eastern Time</p>
          <p className="font-display text-[44px] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</p>
          <p className="mt-3"><Badge tone={state === 'in' ? 'green' : state === 'break' ? 'amber' : 'gray'}>{state === 'in' ? 'Working' : state === 'break' ? 'On break' : 'Clocked out'}</Badge></p>
          <div className="mt-5 grid gap-2">
            {state === 'in' && <><button disabled={busy || !d} onClick={() => punch('break')} className="btn-ghost"><Coffee size={17} /> Start meal break</button>
              <button disabled={busy || !d} onClick={() => punch('out')} className="btn-dark"><LogOut size={17} /> Clock out</button></>}
            {state === 'break' && <button disabled={busy || !d} onClick={() => punch('back')} className="btn-primary"><LogIn size={17} /> End break</button>}
            {state === 'out' && <button disabled={busy || !d} onClick={() => punch('in')} className="btn-primary"><LogIn size={17} /> Clock in</button>}
          </div>
          <ul className="mt-5 space-y-1.5 border-t border-line pt-4 text-[13.5px] text-slate">
            {(d?.today || []).map((l, i) => <li key={i} className="flex justify-between"><span>{l.what}</span><span className="tabular-nums">{time(l.at)}</span></li>)}
            {d && !d.today.length && <li>No punches today yet.</li>}
          </ul>
        </Card>

        <Card className="lg:col-span-2" title={d && !d.week.current ? `Week of ${d.week.label}` : 'This week'} pad={false} action={d && <span className="text-[14px] text-slate">Total <strong className="text-ink tabular-nums">{d.total.toFixed(2)} h</strong></span>}>
          <Table head={['Day', 'Clock in', 'Meal break', 'Clock out', 'Hours']} align={['', '', '', '', 'r']}
            rows={(d?.days || []).map((x) => [
              <span key="d"><strong className="font-medium">{dayName(x.date)}</strong> <span className="text-slate">{dayDate(x.date)}</span></span>,
              time(x.in) || dash('i'), x.breakMin ? `${x.breakMin} min` : dash('l'),
              time(x.out) && !x.open ? time(x.out) : (x.open ? <Badge key="o" tone="amber">In progress</Badge> : dash('o')),
              x.hours ? x.hours.toFixed(2) : '—',
            ])} />
          <div className="space-y-4 border-t border-line p-6">
            <p className="text-[13.5px] text-slate">You are a non-exempt employee. Hours over 40 in a workweek are paid at 1.5× your regular rate under the Fair Labor Standards Act. Overtime must be approved by your manager in advance, but it is always paid.</p>
            {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
            {msg && <Notice>{msg}</Notice>}
            {sub && !msg && (sub.status === 'Returned'
              ? <Notice tone="amber">Returned for changes{sub.reviewNote ? `: ${sub.reviewNote}` : '.'} Review your hours and submit again.</Notice>
              : <Notice tone={sub.status === 'Approved' ? 'green' : 'teal'}>{sub.status === 'Approved' ? `Approved ${when(sub.reviewedAt)}.` : `Submitted ${when(sub.submittedAt)} and waiting for ${d.approver} to approve.`}{sub.reviewNote ? ` Note: ${sub.reviewNote}` : ''}</Notice>)}
            {canSubmit && !msg && (
              <form onSubmit={submit} className="space-y-4">
                <label className="flex gap-3 text-[14px]"><input type="checkbox" required className="mt-1 h-4 w-4 accent-bridge-600" />I certify that this timesheet accurately reflects all hours I worked, and that I was able to take my meal and rest breaks.</label>
                <button disabled={busy} className="btn-primary disabled:opacity-60">Submit week for approval</button>
              </form>
            )}
          </div>
        </Card>
      </div>

      <Card title="Previous weeks" pad={false}>
        {d && !d.previous.length ? <p className="px-6 py-8 text-center text-slate">No previous weeks yet. Weeks you submit appear here.</p> : (
          <Table head={['Week', 'Hours', 'Overtime', 'Status', 'Notes']} align={['', 'r', 'r', '', '']}
            rows={(d?.previous || []).map((w) => [
              <button key="w" onClick={() => { setWeek(w.weekStart); setMsg(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="text-left hover:text-bridge-700 hover:underline">{w.week}</button>,
              w.total.toFixed(2), w.overtime.toFixed(2), <Badge key="s" tone={w.status === 'Not submitted' ? 'red' : statusTone(w.status)}>{w.status}</Badge>,
              w.reviewNote || w.note || (w.status === 'Not submitted' ? 'Open the week to submit it' : <span key="n" className="text-slate-soft">—</span>),
            ])} />
        )}
      </Card>
    </div>
  )
}
