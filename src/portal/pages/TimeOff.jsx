import { useState } from 'react'
import { Link } from 'react-router-dom'
import { timeOff } from '../../data/portal'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'

export default function TimeOff() {
  const [requests, setRequests] = useState(timeOff.requests)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const type = f.get('type'), from = f.get('from'), to = f.get('to') || from, hours = Number(f.get('hours'))
    const bal = timeOff.balances.find((b) => b.type === type)
    if (!from) return setErr('Choose the first day of your time off.')
    if (to < from) return setErr('The last day cannot be before the first day.')
    if (!(hours > 0)) return setErr('Enter the number of hours you need.')
    if (bal && hours > bal.available - bal.scheduled) return setErr(`You have ${bal.available - bal.scheduled} unscheduled hours of ${type.toLowerCase()} available.`)
    const fmt = (s) => new Date(`${s}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setRequests((r) => [{ id: `TO-${1102 + r.length}`, type, dates: from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`, hours, status: 'Pending', submitted: 'Today' }, ...r])
    setErr(''); setMsg('Request sent to Laura Bennett for approval. You will get an email when it is reviewed.')
    e.currentTarget.reset()
  }

  return (
    <div className="space-y-6">
      <PageHead title="Time off" sub={timeOff.policy} />

      <div className="grid gap-4 md:grid-cols-3">
        {timeOff.balances.map((b) => (
          <div key={b.type} className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <p className="text-[14px] text-slate">{b.type}</p>
            <p className="mt-2 font-display text-[34px] leading-none">{b.available} <span className="font-sans text-[15px] text-slate">hours available</span></p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
              <div className="h-full rounded-full bg-bridge-600" style={{ width: `${(b.available / b.accrued) * 100}%` }} />
            </div>
            <p className="mt-3 text-[13.5px] text-slate">Accrued {b.accrued} h · Used {b.used} h · Scheduled {b.scheduled} h</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Request time off">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div><label className="field-label" htmlFor="to-type">Type</label>
              <select id="to-type" name="type" className="field">{timeOff.balances.map((b) => <option key={b.type}>{b.type}</option>)}<option>Unpaid leave</option><option>Bereavement leave</option><option>Jury duty</option></select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label" htmlFor="to-from">First day</label><input id="to-from" name="from" type="date" min="2026-10-02" className="field" /></div>
              <div><label className="field-label" htmlFor="to-to">Last day</label><input id="to-to" name="to" type="date" min="2026-10-02" className="field" /></div>
            </div>
            <div><label className="field-label" htmlFor="to-hours">Hours</label><input id="to-hours" name="hours" type="number" min="1" step="0.5" placeholder="8 hours per full day" className="field" /></div>
            <div><label className="field-label" htmlFor="to-note">Note for your manager <span className="font-normal text-slate">(optional)</span></label><textarea id="to-note" name="note" rows={3} maxLength={500} className="field-area" /></div>
            {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
            {msg && <Notice>{msg}</Notice>}
            <button className="btn-primary w-full">Submit request</button>
          </form>
        </Card>

        <Card className="lg:col-span-2" title="Requests" pad={false}>
          <Table head={['Request', 'Type', 'Dates', 'Hours', 'Status']} align={['', '', '', 'r', '']}
            rows={requests.map((r) => [<span key="i" className="text-slate">{r.id}</span>, r.type, r.dates, r.hours, <Badge key="s" tone={statusTone(r.status)}>{r.status}</Badge>])} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="2026 paid holidays" pad={false}>
          <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
            {timeOff.holidays.map(([d, n]) => <li key={n} className="flex justify-between gap-4 border-line px-6 py-3 text-[14.5px] sm:border-b"><span>{n}</span><span className="shrink-0 text-slate">{d}</span></li>)}
          </ul>
        </Card>
        <Card title="Leave of absence">
          <p className="text-[14.5px] leading-relaxed text-slate">For longer absences, such as your own serious health condition, caring for a family member, or the birth or adoption of a child, you may be eligible for up to 12 weeks of job-protected leave under the Family and Medical Leave Act (FMLA) after 12 months and 1,250 hours of service. Military leave is protected under USERRA.</p>
          <p className="mt-4 text-[14.5px] text-slate">Start a confidential request with HR from <Link to="/portal/help" className="text-bridge-700 underline underline-offset-4">Help & HR</Link>.</p>
        </Card>
      </div>
    </div>
  )
}
