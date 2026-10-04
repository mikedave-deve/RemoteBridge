import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from '../../lib/api'
import { Badge, Card, Notice, PageHead, statusTone } from '../../portal/ui'
import { useApi, when } from '../useApi'

const blank = { userId: '', title: '', client: '', priority: 'Medium', due: '', summary: '', steps: '', instructions: '' }
const priorityTone = { High: 'red', Medium: 'amber', Low: 'gray' }

function Editor({ mission, employees, onClose, onSaved }) {
  const [f, setF] = useState(() => (mission
    ? { ...blank, ...mission, userId: mission.employee?.id || '', steps: mission.steps.map((s) => s.text).join('\n'), instructions: mission.instructions.join('\n') }
    : blank))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      if (mission) await api(`/admin/missions/${mission.id}`, { method: 'PATCH', body: f })
      else await api('/admin/missions', { method: 'POST', body: f })
      onSaved(mission ? 'Mission updated. The employee sees the changes right away.' : 'Mission assigned. It is now on the employee’s dashboard.')
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <Card title={mission ? `Edit: ${mission.title}` : 'Assign a mission'} action={<button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist" aria-label="Close"><X size={16} /></button>}>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="field-label" htmlFor="m-user">Employee</label>
          <select id="m-user" value={f.userId} onChange={set('userId')} required disabled={!!mission} className="field">
            <option value="">Choose an employee</option>
            {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}{u.employeeId ? ` · ${u.employeeId}` : ''}{u.profile?.title ? ` · ${u.profile.title}` : ''}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className="field-label" htmlFor="m-title">Mission title</label><input id="m-title" value={f.title} onChange={set('title')} required maxLength={140} className="field" /></div>
        <div><label className="field-label" htmlFor="m-client">Client <span className="font-normal text-slate">(optional)</span></label><input id="m-client" value={f.client} onChange={set('client')} maxLength={120} className="field" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label" htmlFor="m-pri">Priority</label><select id="m-pri" value={f.priority} onChange={set('priority')} className="field">{['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="field-label" htmlFor="m-due">Due date</label><input id="m-due" type="date" value={f.due} onChange={set('due')} className="field" /></div>
        </div>
        <div className="sm:col-span-2"><label className="field-label" htmlFor="m-sum">Summary</label><textarea id="m-sum" rows={3} value={f.summary} onChange={set('summary')} maxLength={1500} className="field-area" placeholder="What this mission is and why it matters" /></div>
        <div><label className="field-label" htmlFor="m-steps">Steps <span className="font-normal text-slate">(one per line)</span></label><textarea id="m-steps" rows={7} value={f.steps} onChange={set('steps')} required className="field-area" placeholder={'Reconcile September hours\nRun payroll\nSend the report to your manager'} /></div>
        <div><label className="field-label" htmlFor="m-ins">Instructions <span className="font-normal text-slate">(one per line)</span></label><textarea id="m-ins" rows={7} value={f.instructions} onChange={set('instructions')} className="field-area" placeholder={'Use the payroll template in the shared folder\nAsk your manager before working overtime'} /></div>
        {mission && <p className="text-[13px] text-slate sm:col-span-2">Steps you keep word-for-word stay ticked; new or reworded steps start unticked.</p>}
        {err && <div className="sm:col-span-2"><Notice tone="red">{err}</Notice></div>}
        <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="btn-dark disabled:opacity-60">{mission ? 'Save mission' : 'Assign mission'}</button><button type="button" onClick={onClose} className="btn-ghost">Cancel</button></div>
      </form>
    </Card>
  )
}

export default function Missions() {
  const missions = useApi('/admin/missions')
  const people = useApi('/admin/users?status=approved')
  const employees = useMemo(() => (people.data?.users || []).filter((u) => u.role !== 'admin'), [people.data])
  const [who, setWho] = useState('')
  const [edit, setEdit] = useState(undefined) // undefined closed, null new, object editing
  const [msg, setMsg] = useState({ text: '', tone: 'green' })
  const list = (missions.data?.missions || []).filter((m) => !who || m.employee?.id === who)

  const remove = async (m) => {
    if (!window.confirm(`Delete “${m.title}” for ${m.employee?.name}? This cannot be undone.`)) return
    try { await api(`/admin/missions/${m.id}`, { method: 'DELETE' }); setMsg({ text: 'Mission deleted.', tone: 'green' }); missions.reload() }
    catch (e) { setMsg({ text: e.message, tone: 'red' }) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Missions & instructions" sub="Assign work to employees with step-by-step instructions. They see it on their dashboard and tick steps off as they go."
        actions={<button onClick={() => { setEdit(null); setMsg({ text: '' }) }} className="btn-dark h-11"><Plus size={17} /> Assign mission</button>} />
      {(missions.error || msg.text) && <Notice tone={missions.error ? 'red' : msg.tone}>{missions.error || msg.text}</Notice>}
      {edit !== undefined && <Editor key={edit?.id || 'new'} mission={edit} employees={employees} onClose={() => setEdit(undefined)} onSaved={(t) => { setMsg({ text: t, tone: 'green' }); setEdit(undefined); missions.reload() }} />}

      <label className="block md:w-96">
        <span className="sr-only">Filter by employee</span>
        <select value={who} onChange={(e) => setWho(e.target.value)} className="field">
          <option value="">All employees</option>
          {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}{u.employeeId ? ` · ${u.employeeId}` : ''}</option>)}
        </select>
      </label>

      <Card pad={false}>
        <ul className="divide-y divide-line">
          {list.map((m) => {
            const done = m.steps.filter((s) => s.done).length
            return (
              <li key={m.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-[13.5px] text-slate">{m.employee?.name}{m.employee?.employeeId ? ` · ${m.employee.employeeId}` : ''}{m.due ? ` · due ${new Date(`${m.due}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''} · assigned {when(m.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex w-28 items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-bridge-600" style={{ width: `${(done / m.steps.length) * 100}%` }} /></div><span className="text-[12.5px] text-slate">{done}/{m.steps.length}</span></div>
                  <Badge tone={priorityTone[m.priority]}>{m.priority}</Badge>
                  <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  <button onClick={() => { setEdit(m); setMsg({ text: '' }) }} className="btn-ghost h-9 px-3 text-[14px]"><Pencil size={15} /> Edit</button>
                  <button onClick={() => remove(m)} className="grid h-9 w-9 place-items-center rounded-full text-red-700 ring-1 ring-line hover:bg-red-50" aria-label={`Delete ${m.title}`}><Trash2 size={15} /></button>
                </div>
              </li>
            )
          })}
          {missions.data && !list.length && <li className="px-6 py-10 text-center text-slate">No missions yet. Use “Assign mission” to give an employee their first task.</li>}
          {missions.loading && !missions.data && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
        </ul>
      </Card>
    </div>
  )
}
