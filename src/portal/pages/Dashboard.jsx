import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, CircleAlert, Clock, PiggyBank, Wallet } from 'lucide-react'
import { announcements, benefits, employee, fmtDate, nextPay, payStubs, tasks, timeOff, timesheet, usd } from '../../data/portal'
import { Card, Stat } from '../ui'
import { GrossByPeriod, PayBreakdown } from '../charts'

export default function Dashboard() {
  const last = payStubs[0]
  const pto = timeOff.balances[0]
  const weekHours = timesheet.days.reduce((s, d) => s + (d.hours || 0), 0)
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 rounded-2xl bg-bridge-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-center gap-5">
          <img src={employee.photo} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/15" />
          <div>
            <h1 className="text-[clamp(26px,2.6vw,36px)] tracking-tightest text-white">{hello}, {employee.preferred}</h1>
            <p className="mt-1 text-[15px] text-white/70">{employee.title} at {employee.client} · Employed through PremierRemoteBridge since {employee.startDate}</p>
          </div>
        </div>
        <Link to="/portal/time" className="btn-accent h-11 shrink-0 px-5"><Clock size={17} /> Go to timesheet</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label="Next paycheck" value={fmtDate(nextPay.date, { month: 'short', day: 'numeric' })} note={`Estimated ${usd(nextPay.estimate)} by direct deposit`} />
        <Stat icon={CalendarDays} label="PTO available" value={`${pto.available} h`} note={`${pto.scheduled} h scheduled · accrues 4.62 h per paycheck`} />
        <Stat icon={Clock} label="Hours this week" value={weekHours.toFixed(1)} note="Clocked in today at 8:57 AM ET" />
        <Stat icon={PiggyBank} label="401(k) balance" value={usd(benefits.retirement.balance)} note={`You contribute ${benefits.retirement.contribution}% · 4% employer match`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title={`Latest paycheck · ${fmtDate(last.payDate)}`} action={<Link to="/portal/pay" className="text-[14px] text-bridge-700 hover:underline">View pay stub</Link>}>
          <div className="mb-6 flex flex-wrap items-end gap-x-10 gap-y-3">
            <div><p className="text-[13.5px] text-slate">Gross pay</p><p className="font-display text-[30px] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(last.gross)}</p></div>
            <div><p className="text-[13.5px] text-slate">Take-home pay</p><p className="font-display text-[30px] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(last.net)}</p></div>
            <div><p className="text-[13.5px] text-slate">Hours paid</p><p className="font-display text-[30px] leading-tight">{last.hours}</p></div>
          </div>
          <PayBreakdown stub={last} />
        </Card>

        <Card title="To do" pad={false}>
          <ul className="divide-y divide-line">
            {tasks.map((t) => (
              <li key={t.label}>
                <Link to={t.to} className="group flex items-start gap-3 px-6 py-4 hover:bg-paper">
                  <CircleAlert size={18} className={`mt-0.5 shrink-0 ${t.urgent ? 'text-amber-600' : 'text-slate-soft'}`} aria-hidden="true" />
                  <span className="flex-1 text-[14.5px] text-ink">{t.label}{t.urgent && <span className="sr-only"> (due soon)</span>}</span>
                  <ArrowRight size={16} className="mt-0.5 text-slate transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Gross pay per paycheck, 2026">
          <GrossByPeriod stubs={payStubs} />
        </Card>
        <Card title="Coming up" pad={false}>
          <ul className="divide-y divide-line text-[14.5px]">
            <li className="flex justify-between px-6 py-3.5"><span>Payday</span><span className="text-slate">{fmtDate(nextPay.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span></li>
            <li className="flex justify-between px-6 py-3.5"><span>Timesheet due</span><span className="text-slate">Sat, Oct 3</span></li>
            {timeOff.holidays.slice(-3).map(([d, n]) => <li key={n} className="flex justify-between gap-4 px-6 py-3.5"><span>{n}</span><span className="shrink-0 text-slate">{d}</span></li>)}
            {timeOff.requests.filter((r) => r.status !== 'Taken').map((r) => <li key={r.id} className="flex justify-between gap-4 px-6 py-3.5"><span>Time off ({r.status.toLowerCase()})</span><span className="shrink-0 text-slate">{r.dates}</span></li>)}
          </ul>
        </Card>
      </div>

      <Card title="Announcements" pad={false}>
        <ul className="divide-y divide-line">
          {announcements.map((a) => (
            <li key={a.title} className="px-6 py-5">
              <p className="text-[13px] text-slate">{a.date}</p>
              <p className="mt-1 font-medium text-ink">{a.title}</p>
              <p className="mt-1 text-[14.5px] text-slate">{a.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
