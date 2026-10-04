import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, Download, FileText, Package, Search, ShieldCheck, Target, UserRound, Wallet } from 'lucide-react'
import { api } from '../../lib/api'
import { Card, PageHead } from '../ui'

const icons = { Time: Clock, Pay: Wallet, Security: ShieldCheck, 'Time off': CalendarDays, Missions: Target, Documents: FileText, Equipment: Package, Profile: UserRound }
const when = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(/, (d{1,2}:)/, ' · $1')

export default function Activity() {
  const [type, setType] = useState('All')
  const [q, setQ] = useState('')
  const [activity, setActivity] = useState(null)
  useEffect(() => {
    const ctrl = new AbortController()
    api('/me/activity', { signal: ctrl.signal }).then((d) => setActivity(d.activity.map((a) => ({ ...a, when: when(a.at) })))).catch((e) => { if (e.name !== 'AbortError') setActivity([]) })
    return () => ctrl.abort()
  }, [])
  // Only offer filters for the kinds of events this person actually has.
  const types = ['All', ...Object.keys(icons).filter((t) => (activity || []).some((a) => a.type === t))]
  const list = useMemo(() => (activity || []).filter((a) => (type === 'All' || a.type === type) && `${a.text} ${a.meta}`.toLowerCase().includes(q.trim().toLowerCase())), [activity, type, q])

  const exportCsv = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [['Date', 'Type', 'Activity', 'Details'], ...list.map((a) => [a.when, a.type, a.text, a.meta])].map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'premierremotebridge-activity.csv' })
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHead title="Activity history" sub="Everything that happened on your account: sign-ins, approvals, missions and changes to your details."
        actions={<button onClick={exportCsv} className="btn-ghost h-11"><Download size={17} /> Export CSV</button>} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative lg:w-80">
          <span className="sr-only">Search activity</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="Search activity" className="field rounded-full pl-11" />
        </label>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by type">
          {types.map((t) => (
            <button key={t} onClick={() => setType(t)} aria-pressed={type === t}
              className={`h-10 shrink-0 rounded-full px-4 text-[14px] transition-colors ${type === t ? 'bg-bridge-900 text-white' : 'bg-white text-slate ring-1 ring-line hover:text-ink'}`}>{t}</button>
          ))}
        </div>
      </div>

      <Card pad={false}>
        <ol className="divide-y divide-line">
          {list.map((a, i) => {
            const Icon = icons[a.type] || ShieldCheck
            return (
              <li key={i} className="flex gap-4 px-6 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bridge-50 text-bridge-700"><Icon size={18} strokeWidth={1.7} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink">{a.text}</p>
                  <p className="text-[13.5px] text-slate">{a.meta}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[13.5px] text-slate">{a.when}</p>
                  <p className="text-[12.5px] text-slate-soft">{a.type}</p>
                </div>
              </li>
            )
          })}
          {!activity && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
          {activity && list.length === 0 && <li className="px-6 py-10 text-center text-slate">{activity.length ? 'No activity matches your filters.' : 'No activity yet.'}</li>}
        </ol>
      </Card>

      <p className="flex items-start gap-2 text-[13.5px] text-slate"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-bridge-700" />See something you don’t recognize? Change your password in Profile & security and contact the IT help desk right away.</p>
    </div>
  )
}
