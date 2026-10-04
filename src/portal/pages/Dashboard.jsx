import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, BadgeCheck, Briefcase, Target } from 'lucide-react'
import { employee } from '../../data/portal'
import { api } from '../../lib/api'
import { Card, Field, Stat } from '../ui'
import { Avatar } from '../PortalLayout'

const when = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const dueLabel = (d) => (d ? new Date(`${d}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date')

export default function Dashboard() {
  const [missions, setMissions] = useState(null)
  const [activity, setActivity] = useState(null)
  useEffect(() => {
    const ctrl = new AbortController()
    api('/me/missions', { signal: ctrl.signal }).then((d) => setMissions(d.missions)).catch(() => setMissions([]))
    api('/me/activity?limit=6', { signal: ctrl.signal }).then((d) => setActivity(d.activity)).catch(() => setActivity([]))
    return () => ctrl.abort()
  }, [])

  const open = (missions || []).filter((m) => m.status !== 'Completed')
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const details = [
    ['Email', employee.email], ['Phone', employee.phone], ['Manager', employee.manager], ['Client', employee.client],
    ['Employment type', employee.type], ['Start date', employee.startDate], ['Work location', [employee.workCity, employee.workState].filter(Boolean).join(', ')],
  ].filter(([, v]) => v)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 rounded-2xl bg-bridge-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 rounded-2xl ring-2 ring-white/15" icon={28} />
          <div>
            <h1 className="text-[clamp(26px,2.6vw,36px)] tracking-tightest text-white">{hello}, {employee.preferred}</h1>
            <p className="mt-1 text-[15px] text-white/70">
              {[employee.hasPosition && employee.title, employee.hasDepartment && employee.department].filter(Boolean).join(' · ') || 'Your position and department will appear here once HR assigns them.'}
              {employee.startDate && ` · With PremierRemoteBridge since ${employee.startDate}`}
            </p>
          </div>
        </div>
        <Link to="/portal/missions" className="btn-accent h-11 shrink-0 px-5"><Target size={17} /> View missions</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={BadgeCheck} label="Employee ID" value={employee.id} note="Your unique PremierRemoteBridge ID" />
        <Stat icon={Briefcase} label="Position" value={employee.hasPosition ? employee.title : '—'} note={employee.hasPosition ? 'Set by HR' : 'Not assigned yet'} />
        <Stat icon={Building2} label="Department" value={employee.hasDepartment ? employee.department : '—'} note={employee.hasDepartment ? 'Set by HR' : 'Not assigned yet'} />
        <Stat icon={Target} label="Open missions" value={missions ? open.length : '…'} note={missions ? `${missions.length - open.length} completed` : 'Loading'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Your missions" pad={false} action={<Link to="/portal/missions" className="text-[14px] text-bridge-700 hover:underline">See all</Link>}>
          <ul className="divide-y divide-line">
            {open.slice(0, 5).map((m) => {
              const done = m.steps.filter((s) => s.done).length
              return (
                <li key={m.id}>
                  <Link to="/portal/missions" className="group flex flex-col gap-3 px-6 py-4 hover:bg-paper sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{m.title}</p>
                      <p className="text-[13.5px] text-slate">{[m.client, `${m.priority} priority`, `Due ${dueLabel(m.due)}`].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:w-56">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-bridge-600" style={{ width: `${(done / m.steps.length) * 100}%` }} /></div>
                      <span className="w-12 text-right text-[13px] text-slate">{done}/{m.steps.length}</span>
                      <ArrowRight size={16} className="text-slate transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </li>
              )
            })}
            {missions && !open.length && <li className="px-6 py-10 text-center text-slate">{missions.length ? 'All your missions are complete.' : 'No missions yet. Your manager will assign them here.'}</li>}
            {!missions && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
          </ul>
        </Card>

        <Card title="Your details">
          <dl className="space-y-4">
            {details.map(([k, v]) => <Field key={k} label={k} value={v} />)}
          </dl>
          <p className="mt-5 text-[13px] text-slate">Something wrong? Contact HR from Help & HR.</p>
        </Card>
      </div>

      <Card title="Recent activity" pad={false} action={<Link to="/portal/activity" className="text-[14px] text-bridge-700 hover:underline">Full history</Link>}>
        <ul className="divide-y divide-line">
          {(activity || []).map((a, i) => (
            <li key={i} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span><span className="block text-[15px] text-ink">{a.text}</span>{a.meta && <span className="text-[13.5px] text-slate">{a.meta}</span>}</span>
              <span className="shrink-0 text-[13.5px] text-slate">{when(a.at)}</span>
            </li>
          ))}
          {activity && !activity.length && <li className="px-6 py-8 text-center text-slate">No activity yet.</li>}
          {!activity && <li className="px-6 py-8 text-center text-slate">Loading…</li>}
        </ul>
      </Card>
    </div>
  )
}
