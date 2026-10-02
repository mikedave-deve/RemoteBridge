import { useState } from 'react'
import { CheckCircle2, Circle, Info } from 'lucide-react'
import { missions as initial, workRules } from '../../data/portalExtra'
import { Badge, Card, PageHead, Tabs, statusTone } from '../ui'

const priorityTone = { High: 'red', Medium: 'amber', Low: 'gray' }

function Mission({ m, onToggle }) {
  const done = m.steps.filter((s) => s.done).length
  const pct = Math.round((done / m.steps.length) * 100)
  return (
    <article className="rounded-2xl bg-white ring-1 ring-line">
      <header className="flex flex-col justify-between gap-3 border-b border-line px-6 py-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-[13px] text-slate">{m.id} · {m.client} · Assigned by {m.owner}</p>
          <h2 className="mt-1 font-sans text-[19px] font-semibold tracking-normal">{m.title}</h2>
          <p className="mt-1.5 max-w-3xl text-[14.5px] text-slate">{m.summary}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Badge tone={priorityTone[m.priority]}>{m.priority} priority</Badge>
          <Badge tone={statusTone(m.status)}>{m.status}</Badge>
        </div>
      </header>
      <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between text-[14px]">
            <span className="font-medium">Checklist</span>
            <span className="text-slate">{done} of {m.steps.length} done · Due {m.due.replace('Completed ', '')}</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.title} progress`}>
            <div className="h-full rounded-full bg-bridge-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ul className="space-y-1">
            {m.steps.map((s, i) => (
              <li key={s.text}>
                <button onClick={() => onToggle(m.id, i)} disabled={m.status === 'Completed'}
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left text-[14.5px] hover:bg-paper disabled:cursor-default disabled:hover:bg-transparent" aria-pressed={s.done}>
                  {s.done ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-bridge-600" /> : <Circle size={19} className="mt-0.5 shrink-0 text-slate-soft" />}
                  <span className={s.done ? 'text-slate line-through decoration-slate-soft' : 'text-ink'}>{s.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-paper p-5 ring-1 ring-line">
          <p className="flex items-center gap-2 text-[14px] font-medium"><Info size={16} className="text-bridge-700" /> Instructions</p>
          <ul className="mt-3 space-y-2.5 text-[14px] text-slate">
            {m.instructions.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bridge-600" />{t}</li>)}
          </ul>
        </div>
      </div>
    </article>
  )
}

export default function Missions() {
  const [list, setList] = useState(initial)
  const [tab, setTab] = useState('Active')
  const toggle = (id, i) => setList((ms) => ms.map((m) => {
    if (m.id !== id) return m
    const steps = m.steps.map((s, j) => (j === i ? { ...s, done: !s.done } : s))
    return { ...m, steps, status: steps.every((s) => s.done) ? 'Ready for review' : steps.some((s) => s.done) ? 'In progress' : 'Not started' }
  }))
  const shown = list.filter((m) => (tab === 'Active' ? m.status !== 'Completed' : m.status === 'Completed'))

  return (
    <div className="space-y-6">
      <PageHead title="Missions & instructions" sub="Your current assignments from Westbrook & Hale CPAs and PremierRemoteBridge, with the steps and instructions for each." />
      <Tabs tabs={['Active', 'Completed']} value={tab} onChange={setTab} />
      <div className="space-y-5">
        {shown.map((m) => <Mission key={m.id} m={m} onToggle={toggle} />)}
        {shown.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Nothing here yet.</p>}
      </div>
      <Card title="Standing instructions" pad={false}>
        <dl className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0">
          {workRules.map(([t, d]) => (
            <div key={t} className="border-line px-6 py-5 md:border-b md:odd:border-r">
              <dt className="font-medium">{t}</dt>
              <dd className="mt-1 text-[14.5px] text-slate">{d}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
