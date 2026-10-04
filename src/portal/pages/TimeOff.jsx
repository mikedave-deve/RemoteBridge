import { useState } from 'react'
import { Link } from 'react-router-dom'
import { timeOff } from '../../data/portal'
import { api } from '../../lib/api'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'

const fmt = (s) => new Date(`${s}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const dates = (r) => (r.from === r.to ? fmt(r.from) : `${fmt(r.from)} – ${fmt(r.to)}`)

export default function TimeOff() {
  const { data, error, reload } = useApi('/me/time-off')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const balances = data?.balances || []

  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = Object.fromEntries(new FormData(form))
    const bal = balances.find((b) => b.type === f.type)
    if (!f.from) return setErr('Choose the first day of your time off.')
    if (f.to && f.to < f.from) return setErr('The last day cannot be before the first day.')
    if (!(Number(f.hours) > 0)) return setErr('Enter the number of hours you need.')
    if (bal && Number(f.hours) > bal.available - bal.pending) return setErr(`You have ${Math.max(0, bal.available - bal.pending)} unscheduled hours of ${f.type.toLowerCase()} available.`)
    setBusy(true)
    try {
      await api('/me/time-off', { method: 'POST', body: f })
      setErr(''); setMsg(`Request sent to ${data.approver} for approval. You will see the decision here and in your activity history.`)
      form.reset(); reload()
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Time off" sub={timeOff.policy} />
      {error && <Notice tone="red">{error}</Notice>}

      <div className="grid gap-4 md:grid-cols-3">
        {balances.map((b) => (
          <div key={b.type} className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <p className="text-[14px] text-slate">{b.type}</p>
            <p className="mt-2 font-display text-[34px] leading-none">{b.available} <span className="font-sans text-[15px] text-slate">hours available</span></p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
              <div className="h-full rounded-full bg-bridge-600" style={{ width: `${b.accrued ? (b.available / b.accrued) * 100 : 0}%` }} />
            </div>
            <p className="mt-3 text-[13.5px] text-slate">Accrued {b.accrued} h · Used {b.used} h · Scheduled {b.scheduled} h{b.pending ? ` · Pending ${b.pending} h` : ''}</p>
          </div>
        ))}
        {!data && !error && <p className="rounded-2xl bg-white p-5 text-slate ring-1 ring-line md:col-span-3">Loading…</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Request time off">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div><label className="field-label" htmlFor="to-type">Type</label>
              <select id="to-type" name="type" className="field">{(data?.types || []).map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label" htmlFor="to-from">First day</label><input id="to-from" name="from" type="date" min={data?.today} className="field" /></div>
              <div><label className="field-label" htmlFor="to-to">Last day</label><input id="to-to" name="to" type="date" min={data?.today} className="field" /></div>
            </div>
            <div><label className="field-label" htmlFor="to-hours">Hours</label><input id="to-hours" name="hours" type="number" min="1" step="0.5" placeholder="8 hours per full day" className="field" /></div>
            <div><label className="field-label" htmlFor="to-note">Note for your manager <span className="font-normal text-slate">(optional)</span></label><textarea id="to-note" name="note" rows={3} maxLength={500} className="field-area" /></div>
            {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
            {msg && <Notice>{msg}</Notice>}
            <button disabled={busy || !data} className="btn-primary w-full disabled:opacity-60">Submit request</button>
          </form>
        </Card>

        <Card className="lg:col-span-2" title="Requests" pad={false}>
          {data && !data.requests.length ? <p className="px-6 py-8 text-center text-slate">No requests yet. Requests you submit appear here with their status.</p> : (
            <Table head={['Request', 'Type', 'Dates', 'Hours', 'Status']} align={['', '', '', 'r', '']}
              rows={(data?.requests || []).map((r) => [<span key="i" className="text-slate">{r.number}</span>, r.type, dates(r), r.hours, <span key="s" title={r.reviewNote || undefined}><Badge tone={statusTone(r.status)}>{r.status}</Badge></span>])} />
          )}
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
