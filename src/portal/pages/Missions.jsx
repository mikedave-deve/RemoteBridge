import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Info } from 'lucide-react'
import { api } from '../../lib/api'
import { Badge, Notice, PageHead, Tabs, statusTone } from '../ui'

const priorityTone = { High: 'red', Medium: 'amber', Low: 'gray' }
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const dueLabel = (m) => (m.status === 'Completed' && m.completedAt ? `Completed ${fmt(m.completedAt)}` : m.due ? `Due ${fmt(`${m.due}T12:00`)}` : 'No due date')

function Mission({ m, onToggle, busy }) {
  const done = m.steps.filter((s) => s.done).length
  const pct = Math.round((done / m.steps.length) * 100)
  return (
    <article className="rounded-2xl bg-white ring-1 ring-line">
      <header className="flex flex-col justify-between gap-3 border-b border-line px-6 py-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-[13px] text-slate">{[m.client, m.assignedBy && `Assigned by ${m.assignedBy}`].filter(Boolean).join(' · ')}</p>
          <h2 className="mt-1 font-sans text-[19px] font-semibold tracking-normal">{m.title}</h2>
          {m.summary && <p className="mt-1.5 max-w-3xl whitespace-pre-line text-[14.5px] text-slate">{m.summary}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Badge tone={priorityTone[m.priority]}>{m.priority} priority</Badge>
          <Badge tone={statusTone(m.status)}>{m.status}</Badge>
        </div>
      </header>
      <div className={`grid gap-6 p-6 ${m.instructions.length ? 'lg:grid-cols-[1.3fr_1fr]' : ''}`}>
        <div>
          <div className="mb-4 flex items-center justify-between text-[14px]">
            <span className="font-medium">Checklist</span>
            <span className="text-slate">{done} of {m.steps.length} done · {dueLabel(m)}</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.title} progress`}>
            <div className="h-full rounded-full bg-bridge-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ul className="space-y-1">
            {m.steps.map((s, i) => (
              <li key={i}>
                <button onClick={() => onToggle(m, i)} disabled={busy}
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left text-[14.5px] hover:bg-paper disabled:cursor-wait" aria-pressed={s.done}>
                  {s.done ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-bridge-600" /> : <Circle size={19} className="mt-0.5 shrink-0 text-slate-soft" />}
                  <span className={s.done ? 'text-slate line-through decoration-slate-soft' : 'text-ink'}>{s.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {m.instructions.length > 0 && (
          <div className="rounded-xl bg-paper p-5 ring-1 ring-line">
            <p className="flex items-center gap-2 text-[14px] font-medium"><Info size={16} className="text-bridge-700" /> Instructions</p>
            <ul className="mt-3 space-y-2.5 text-[14px] text-slate">
              {m.instructions.map((t, i) => <li key={i} className="flex gap-2.5"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bridge-600" />{t}</li>)}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}

export default function Missions() {
  const [list, setList] = useState(null)
  const [tab, setTab] = useState('Active')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    api('/me/missions', { signal: ctrl.signal }).then((d) => setList(d.missions)).catch((e) => { if (e.name !== 'AbortError') { setErr(e.message); setList([]) } })
    return () => ctrl.abort()
  }, [])

  const toggle = async (m, i) => {
    setBusy(m.id); setErr('')
    try {
      const { mission } = await api(`/me/missions/${m.id}/steps/${i}`, { method: 'PATCH', body: { done: !m.steps[i].done } })
      setList((ms) => ms.map((x) => (x.id === m.id ? mission : x)))
    } catch (e) { setErr(e.message) } finally { setBusy('') }
  }
  const shown = (list || []).filter((m) => (tab === 'Active' ? m.status !== 'Completed' : m.status === 'Completed'))

  return (
    <div className="space-y-6">
      <PageHead title="Missions & instructions" sub="Your assignments from your manager, with the steps and instructions for each. Tick each step as you finish it." />
      <Tabs tabs={['Active', 'Completed']} value={tab} onChange={setTab} />
      {err && <Notice tone="red">{err}</Notice>}
      <div className="space-y-5">
        {shown.map((m) => <Mission key={m.id} m={m} onToggle={toggle} busy={busy === m.id} />)}
        {list && shown.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">{tab === 'Active' ? 'No active missions. New assignments from your manager will appear here.' : 'No completed missions yet.'}</p>}
        {!list && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Loading…</p>}
      </div>
    </div>
  )
}
