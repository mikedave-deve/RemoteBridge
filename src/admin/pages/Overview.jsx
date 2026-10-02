import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Mail, UserCheck, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { Card, Notice, PageHead, Stat } from '../../portal/ui'
import { useApi, when } from '../useApi'

export default function Overview() {
  const stats = useApi('/admin/stats')
  const pending = useApi('/admin/users?status=pending')
  const inbox = useApi('/admin/submissions')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

  const review = async (u, status) => {
    setBusy(u.id)
    try {
      await api(`/admin/users/${u.id}/status`, { method: 'POST', body: { status } })
      setMsg(`${u.first} ${u.last} was ${status}. They have been notified by email.`)
      pending.reload(); stats.reload()
    } catch (e) { setMsg(e.message) } finally { setBusy('') }
  }
  const s = stats.data

  return (
    <div className="space-y-6">
      <PageHead title="Overview" sub="New sign-ups waiting for approval, and the latest résumés and messages from the website." />
      {stats.error && <Notice tone="red">{stats.error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={UserCheck} label="Waiting for approval" value={s ? s.users.pending : '—'} note={s ? `${s.users.approved} approved account${s.users.approved === 1 ? '' : 's'}` : ' '} />
        <Stat icon={FileText} label="New résumés" value={s ? s.resumes.new : '—'} note={s ? `${s.resumes.total} received in total` : ' '} />
        <Stat icon={Mail} label="New hiring messages" value={s ? s.messages.new : '—'} note={s ? `${s.messages.total} received in total` : ' '} />
        <Stat icon={Users} label="Active employees" value={s ? s.users.approved : '—'} note={s ? `${s.users.suspended} suspended · ${s.users.declined} declined` : ' '} />
      </div>

      {msg && <Notice>{msg}</Notice>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Accounts waiting for approval" pad={false} action={<Link to="/admin/users?status=pending" className="text-[14px] text-bridge-700 hover:underline">See all</Link>}>
          <ul className="divide-y divide-line">
            {(pending.data?.users || []).slice(0, 6).map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{u.first} {u.last}</p>
                  <p className="truncate text-[13.5px] text-slate">{u.email} · {u.phone} · signed up {when(u.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={busy === u.id} onClick={() => review(u, 'approved')} className="btn-primary h-9 px-4 text-[14px] disabled:opacity-60">Approve</button>
                  <button disabled={busy === u.id} onClick={() => review(u, 'declined')} className="btn-ghost h-9 px-4 text-[14px] disabled:opacity-60">Decline</button>
                </div>
              </li>
            ))}
            {pending.data && !pending.data.users.length && <li className="px-6 py-8 text-center text-slate">No accounts are waiting. You’re all caught up.</li>}
            {pending.loading && !pending.data && <li className="px-6 py-8 text-center text-slate">Loading…</li>}
          </ul>
        </Card>

        <Card title="Latest from the website" pad={false} action={<Link to="/admin/inbox" className="text-[14px] text-bridge-700 hover:underline">Open inbox</Link>}>
          <ul className="divide-y divide-line">
            {(inbox.data?.submissions || []).slice(0, 6).map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-6 py-4">
                {m.type === 'resume' ? <FileText size={18} className="mt-0.5 shrink-0 text-bridge-700" /> : <Mail size={18} className="mt-0.5 shrink-0 text-bridge-700" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.type === 'resume' ? `${m.first} ${m.last} · ${m.field}` : `${m.name} · ${m.company}`}</p>
                  <p className="truncate text-[13.5px] text-slate">{m.type === 'resume' ? 'Résumé' : 'Hiring enquiry'} · {when(m.createdAt)}</p>
                </div>
                {m.status === 'new' && <span className="rounded-full bg-bridge-50 px-2.5 py-0.5 text-[12px] font-medium text-bridge-800">New</span>}
              </li>
            ))}
            {inbox.data && !inbox.data.submissions.length && <li className="px-6 py-8 text-center text-slate">Nothing received yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}
