import { useState } from 'react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { api, fileUrl } from '../../lib/api'
import { Badge, Card, Notice, PageHead, statusTone } from '../../portal/ui'
import EmployeePicker, { useEmployees } from '../EmployeePicker'
import { useApi, when } from '../useApi'

const isDone = (s) => ['Verified', 'Authorized', 'Clear'].includes(s)

function Row({ title, status, detail, onVerify, onUndo, busy }) {
  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1"><p className="font-medium">{title}</p>{detail && <p className="text-[13.5px] text-slate">{detail}</p>}</div>
      <Badge tone={statusTone(status)}>{status}</Badge>
      {isDone(status)
        ? <button disabled={busy} onClick={onUndo} className="btn-ghost h-9 px-3 text-[14px]">Undo</button>
        : <button disabled={busy} onClick={onVerify} className="btn-primary h-9 px-4 text-[14px]"><BadgeCheck size={15} /> Verify</button>}
    </li>
  )
}

function Doc({ d, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const act = async (action) => {
    setBusy(true)
    try { await api(`/admin/identity/doc/${d.id}`, { method: 'POST', body: { action, note } }); onDone(`${d.type} ${action === 'verify' ? 'verified' : 'rejected'}.`) } finally { setBusy(false) }
  }
  return (
    <li className="px-6 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{d.type}{d.number && <> · <span className="tabular-nums">{d.number}</span></>}</p>
          <p className="text-[13.5px] text-slate">Submitted {when(d.submittedAt)}{d.reviewedAt ? ` · reviewed ${when(d.reviewedAt)}` : ''}{d.note ? ` · ${d.note}` : ''}</p>
          {d.hasPhotos && <p className="mt-2 flex flex-wrap gap-4 text-[14px]">
            <a href={fileUrl(`/admin/identity/doc/${d.id}/front`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-bridge-700 hover:underline"><ExternalLink size={14} /> Front selfie</a>
            <a href={fileUrl(`/admin/identity/doc/${d.id}/back`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-bridge-700 hover:underline"><ExternalLink size={14} /> Back selfie</a>
          </p>}
        </div>
        <Badge tone={d.status === 'Rejected' ? 'red' : statusTone(d.status)}>{d.status}</Badge>
      </div>
      {d.status === 'Pending review' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Note for the employee (optional; shown if rejected)" className="field flex-1" aria-label="Note" />
          <button disabled={busy} onClick={() => act('verify')} className="btn-primary h-12 px-4 text-[14px]">Verify document</button>
          <button disabled={busy} onClick={() => act('reject')} className="btn-ghost h-12 px-4 text-[14px] text-red-700">Reject</button>
        </div>
      )}
    </li>
  )
}

export default function Identity() {
  const { employees, id, chosen, choose } = useEmployees()
  const data = useApi(id ? `/admin/identity/${id}` : null)
  const [msg, setMsg] = useState({ text: '' })
  const [busy, setBusy] = useState(false)
  const d = data.data
  const verify = async (item, undo = false) => {
    setBusy(true)
    try { await api(`/admin/identity/${id}/verify`, { method: 'POST', body: { item, undo } }); setMsg({ text: undo ? 'Reopened. The employee sees it as not verified.' : 'Verified. The employee sees it right away.', tone: 'green' }); data.reload() }
    catch (e) { setMsg({ text: e.message, tone: 'red' }) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Identity" sub="Review identity documents and mark Form I-9, E-Verify and each screening check verified. Every box you verify shows Verified in the employee’s portal."
        actions={d && d.overall !== 'Verified' && <button disabled={busy} onClick={() => verify('all')} className="btn-dark h-11"><BadgeCheck size={17} /> Verify everything</button>} />
      <EmployeePicker employees={employees} id={id} choose={choose} />
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {data.error && <Notice tone="red">{data.error}</Notice>}
      {chosen && d && <>
        <p className="text-[14px] text-slate">Overall: <Badge tone={d.overall === 'Verified' ? 'green' : d.overall === 'In progress' ? 'amber' : 'gray'}>{d.overall}</Badge></p>
        <Card title="Submitted documents" pad={false}>
          <ul className="divide-y divide-line">
            {d.documents.map((x) => <Doc key={`${x.id}-${x.status}`} d={x} onDone={(t) => { setMsg({ text: t, tone: 'green' }); data.reload() }} />)}
            {!d.documents.length && <li className="px-6 py-8 text-center text-slate">{chosen.first} has not submitted an identity document yet.</li>}
          </ul>
        </Card>
        <Card title="Verification boxes" pad={false}>
          <ul className="divide-y divide-line">
            <Row title="Form I-9" status={d.i9.status} detail={d.i9.section2At ? `Verified ${when(d.i9.section2At)}` : 'Section 2 document review'} busy={busy} onVerify={() => verify('i9')} onUndo={() => verify('i9', true)} />
            <Row title="E-Verify" status={d.everify.status} detail={d.everify.case ? `Case ${d.everify.case} · closed ${when(d.everify.closedAt)}` : 'Employment authorization check'} busy={busy} onVerify={() => verify('everify')} onUndo={() => verify('everify', true)} />
            {d.screening.map((s) => <Row key={s.key} title={s.name} status={s.status} detail={s.at ? `Completed ${when(s.at)}` : 'Pre-employment screening'} busy={busy} onVerify={() => verify(s.key)} onUndo={() => verify(s.key, true)} />)}
          </ul>
        </Card>
      </>}
      {!id && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Choose an employee to review their identity verification.</p>}
    </div>
  )
}
