import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Search, UserRound, X } from 'lucide-react'
import { api } from '../../lib/api'
import { formatPhone } from '../../lib/validate'
import { FREQUENCIES } from '../../lib/payroll'
import { Badge, Card, Notice, PageHead, Tabs } from '../../portal/ui'
import { useApi, when } from '../useApi'

const tone = { pending: 'amber', approved: 'green', declined: 'red', suspended: 'gray' }
const TABS = ['All', 'Pending', 'Approved', 'Suspended', 'Declined']
const PROFILE = [
  ['title', 'Position'], ['client', 'Client company'], ['department', 'Department'], ['manager', 'Manager'],
  ['employmentType', 'Employment type'], ['payRate', 'Hourly pay rate ($)'], ['payFrequency', 'Pay frequency'], ['startDate', 'Start date'],
  ['workCity', 'Work city'], ['workState', 'Work state'], ['address', 'Home address'],
]

function Editor({ user, me, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ first: user.first, last: user.last, phone: user.phone || '', role: user.role, profile: { ...user.profile } }))
  const [msg, setMsg] = useState({ text: '', tone: 'green' })
  const [busy, setBusy] = useState(false)
  const self = user.id === me.id
  const setP = (k) => (e) => setF((s) => ({ ...s, profile: { ...s.profile, [k]: e.target.value } }))

  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const { user: u } = await api(`/admin/users/${user.id}`, { method: 'PATCH', body: f }); onSaved(u); setMsg({ text: 'Changes saved.', tone: 'green' }) }
    catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  const status = async (s) => {
    setBusy(true)
    try { const { user: u } = await api(`/admin/users/${user.id}/status`, { method: 'POST', body: { status: s } }); onSaved(u); setMsg({ text: `Account ${s}. ${s === 'suspended' ? 'They have been signed out.' : 'They have been notified by email.'}`, tone: 'green' }) }
    catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }

  return (
    <Card title={`${user.first} ${user.last}`} action={<button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist" aria-label="Close"><X size={16} /></button>}>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[13.5px] text-slate">
        <Badge tone={tone[user.status]}>{user.status}</Badge>
        {user.employeeId && <span className="font-medium text-ink">ID {user.employeeId}</span>}<span>{user.email}</span><span>· joined {when(user.createdAt)}</span>{user.lastLoginAt && <span>· last login {when(user.lastLoginAt)}</span>}
      </div>
      {!self && (
        <div className="mb-6 flex flex-wrap gap-2">
          {user.status !== 'approved' && <button disabled={busy} onClick={() => status('approved')} className="btn-primary h-10 px-4 text-[14px]">{user.status === 'pending' ? 'Approve' : 'Reactivate'}</button>}
          {user.status === 'pending' && <button disabled={busy} onClick={() => status('declined')} className="btn-ghost h-10 px-4 text-[14px]">Decline</button>}
          {user.status === 'approved' && <button disabled={busy} onClick={() => status('suspended')} className="btn-ghost h-10 px-4 text-[14px] text-red-700">Suspend access</button>}
        </div>
      )}
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div><label className="field-label" htmlFor="u-first">First name</label><input id="u-first" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} maxLength={50} className="field" /></div>
        <div><label className="field-label" htmlFor="u-last">Last name</label><input id="u-last" value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} maxLength={50} className="field" /></div>
        <div><label className="field-label" htmlFor="u-phone">Phone</label><input id="u-phone" value={f.phone} onChange={(e) => setF({ ...f, phone: formatPhone(e.target.value) })} className="field" /></div>
        <div><label className="field-label" htmlFor="u-role">Role</label>
          <select id="u-role" value={f.role} disabled={self} onChange={(e) => setF({ ...f, role: e.target.value })} className="field"><option value="employee">Employee</option><option value="admin">Admin</option></select></div>
        <p className="pt-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate sm:col-span-2">Shown in their employee portal</p>
        {PROFILE.map(([k, l]) => (
          <div key={k} className={k === 'address' ? 'sm:col-span-2' : ''}><label className="field-label" htmlFor={`u-${k}`}>{l}</label>
            {k === 'payFrequency'
              ? <select id={`u-${k}`} value={f.profile[k] || 'Biweekly'} onChange={setP(k)} className="field">{FREQUENCIES.map((x) => <option key={x}>{x}</option>)}</select>
              : <input id={`u-${k}`} value={f.profile[k] || ''} onChange={setP(k)} maxLength={120} inputMode={k === 'payRate' ? 'decimal' : undefined} className="field" />}</div>
        ))}
        <div className="sm:col-span-2"><label className="field-label" htmlFor="u-notes">Private admin notes</label><textarea id="u-notes" rows={3} value={f.profile.notes || ''} onChange={setP('notes')} maxLength={2000} className="field-area" /></div>
        {msg.text && <div className="sm:col-span-2"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
        <div className="sm:col-span-2"><button disabled={busy} className="btn-dark disabled:opacity-60">Save changes</button></div>
      </form>
    </Card>
  )
}

export default function Users() {
  const me = useOutletContext()
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((t) => t.toLowerCase() === params.get('status')) || 'All'
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => { const id = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(id) }, [q])
  const path = `/admin/users?${new URLSearchParams({ ...(tab !== 'All' && { status: tab.toLowerCase() }), ...(debounced && { q: debounced }) })}`
  const { data, error, loading, reload } = useApi(path)
  const [open, setOpen] = useState(null)

  return (
    <div className="space-y-6">
      <PageHead title="Employees & approvals" sub="Approve new sign-ups, update employee details and control who can log in." />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs tabs={TABS} value={tab} onChange={(t) => { setParams(t === 'All' ? {} : { status: t.toLowerCase() }); setOpen(null) }} />
        <label className="relative md:w-80">
          <span className="sr-only">Search people</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="Search name or email" className="field rounded-full pl-11" />
        </label>
      </div>
      {error && <Notice tone="red">{error}</Notice>}
      <div className={`grid gap-6 ${open ? 'xl:grid-cols-[1fr_1.1fr]' : ''}`}>
        <Card pad={false}>
          <ul className="divide-y divide-line">
            {(data?.users || []).map((u) => (
              <li key={u.id}>
                <button onClick={() => setOpen(u)} className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-paper ${open?.id === u.id ? 'bg-bridge-50' : ''}`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bridge-50 text-bridge-700" aria-hidden="true"><UserRound size={18} strokeWidth={1.7} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{u.first} {u.last} {u.role === 'admin' && <span className="ml-1 text-[12px] font-normal text-bridge-700">Admin</span>}</span>
                    <span className="block truncate text-[13.5px] text-slate">{[u.employeeId, u.email, u.profile?.title, u.profile?.department].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Badge tone={tone[u.status]}>{u.status}</Badge>
                </button>
              </li>
            ))}
            {data && !data.users.length && <li className="px-6 py-10 text-center text-slate">No people match.</li>}
            {loading && !data && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
          </ul>
        </Card>
        {open && <Editor key={open.id} user={open} me={me} onClose={() => setOpen(null)} onSaved={(u) => { setOpen(u); reload() }} />}
      </div>
    </div>
  )
}
