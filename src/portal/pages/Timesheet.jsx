import { useEffect, useState } from 'react'
import { Coffee, LogIn, LogOut } from 'lucide-react'
import { timesheet } from '../../data/portal'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'

const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })

export default function Timesheet() {
  const [clock, setClock] = useState(now())
  const [state, setState] = useState('in') // in | break | out
  const [log, setLog] = useState([{ t: '8:57 AM', what: 'Clocked in' }])
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => { const id = setInterval(() => setClock(now()), 15000); return () => clearInterval(id) }, [])

  const act = (next, what) => { setState(next); setLog((l) => [...l, { t: now(), what }]) }
  const total = timesheet.days.reduce((s, d) => s + (d.hours || 0), 0)

  return (
    <div className="space-y-6">
      <PageHead title="Timesheet" sub={`${timesheet.week} · ${timesheet.period} · Approver: ${timesheet.approver}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Time clock">
          <p className="text-[13.5px] text-slate">Eastern Time</p>
          <p className="font-display text-[44px] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</p>
          <p className="mt-3"><Badge tone={state === 'in' ? 'green' : state === 'break' ? 'amber' : 'gray'}>{state === 'in' ? 'Working' : state === 'break' ? 'On break' : 'Clocked out'}</Badge></p>
          <div className="mt-5 grid gap-2">
            {state === 'in' && <><button onClick={() => act('break', 'Started meal break')} className="btn-ghost"><Coffee size={17} /> Start meal break</button>
              <button onClick={() => act('out', 'Clocked out')} className="btn-dark"><LogOut size={17} /> Clock out</button></>}
            {state === 'break' && <button onClick={() => act('in', 'Ended meal break')} className="btn-primary"><LogIn size={17} /> End break</button>}
            {state === 'out' && <button onClick={() => act('in', 'Clocked in')} className="btn-primary"><LogIn size={17} /> Clock in</button>}
          </div>
          <ul className="mt-5 space-y-1.5 border-t border-line pt-4 text-[13.5px] text-slate">
            {log.map((l, i) => <li key={i} className="flex justify-between"><span>{l.what}</span><span className="tabular-nums">{l.t}</span></li>)}
          </ul>
        </Card>

        <Card className="lg:col-span-2" title="This week" pad={false} action={<span className="text-[14px] text-slate">Total <strong className="text-ink tabular-nums">{total.toFixed(2)} h</strong></span>}>
          <Table head={['Day', 'Clock in', 'Meal break', 'Clock out', 'Hours']} align={['', '', '', '', 'r']}
            rows={timesheet.days.map((d) => [
              <span key="d"><strong className="font-medium">{d.day}</strong> <span className="text-slate">{d.date}</span></span>,
              d.in || <span key="i" className="text-slate-soft">—</span>, d.lunch || <span key="l" className="text-slate-soft">—</span>,
              d.out || (d.in ? <Badge key="o" tone="amber">In progress</Badge> : <span key="o" className="text-slate-soft">—</span>),
              d.hours ? d.hours.toFixed(2) : '—',
            ])} />
          <div className="space-y-4 border-t border-line p-6">
            <p className="text-[13.5px] text-slate">You are a non-exempt employee. Hours over 40 in a workweek are paid at 1.5× your regular rate under the Fair Labor Standards Act. Overtime must be approved by your manager in advance, but it is always paid.</p>
            {submitted ? <Notice>Timesheet submitted for approval. Laura Bennett has been notified.</Notice> : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }} className="space-y-4">
                <label className="flex gap-3 text-[14px]"><input type="checkbox" required className="mt-1 h-4 w-4 accent-bridge-600" />I certify that this timesheet accurately reflects all hours I worked, and that I was able to take my meal and rest breaks.</label>
                <button className="btn-primary">Submit week for approval</button>
              </form>
            )}
          </div>
        </Card>
      </div>

      <Card title="Previous weeks" pad={false}>
        <Table head={['Week', 'Hours', 'Overtime', 'Status', 'Notes']} align={['', 'r', 'r', '', '']}
          rows={timesheet.previous.map((w) => [w.week, w.hours.toFixed(2), w.overtime.toFixed(2), <Badge key="s" tone={statusTone(w.status)}>{w.status}</Badge>, w.note || <span key="n" className="text-slate-soft">—</span>])} />
      </Card>
    </div>
  )
}
