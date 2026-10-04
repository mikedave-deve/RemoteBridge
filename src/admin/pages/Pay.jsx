import { useEffect, useState } from 'react'
import { Download, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api, fileUrl } from '../../lib/api'
import { Badge, Card, Notice, PageHead } from '../../portal/ui'
import EmployeePicker, { useEmployees } from '../EmployeePicker'
import { useApi, when } from '../useApi'

const usd = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const fmtDay = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const shift = (k, n) => { const d = new Date(`${k}T12:00:00`); d.setDate(d.getDate() + n); return iso(d) }
const DAYS = { Weekly: 7, Biweekly: 14, 'Semi-monthly': 15, Monthly: 30 }
const HOURS = { Weekly: 40, Biweekly: 80, 'Semi-monthly': 86.67, Monthly: 173.33 }

function blank(pay) {
  const end = iso(new Date())
  return {
    payDate: end, start: shift(end, -(DAYS[pay.frequency] - 1)), end, note: '',
    earnings: [{ label: 'Regular', hours: HOURS[pay.frequency], rate: pay.rate || '' }, { label: 'Overtime (1.5×)', hours: 0, rate: pay.rate ? +(pay.rate * 1.5).toFixed(2) : '' }],
    taxes: [{ label: 'Federal income tax', amount: '' }, { label: 'State income tax', amount: '' }, { label: 'Local income tax', amount: '' }],
    otherDeductions: [],
  }
}

function Rows({ rows, onChange, kind }) {
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const hourly = (r) => r.amount === undefined
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input aria-label="Line" value={r.label} onChange={(e) => set(i, 'label', e.target.value)} className="field min-w-[150px] flex-1" />
          {kind === 'earnings' && hourly(r) ? <>
            <input aria-label="Hours" inputMode="decimal" value={r.hours} onChange={(e) => set(i, 'hours', e.target.value)} className="field w-24" placeholder="Hours" />
            <input aria-label="Rate" inputMode="decimal" value={r.rate} onChange={(e) => set(i, 'rate', e.target.value)} className="field w-28" placeholder="Rate $" />
          </> : <input aria-label="Amount" inputMode="decimal" value={r.amount ?? ''} onChange={(e) => set(i, 'amount', e.target.value)} className="field w-32" placeholder="Amount $" />}
          {kind === 'deductions' && <label className="flex items-center gap-2 text-[13.5px] text-slate"><input type="checkbox" checked={!!r.pretax} onChange={(e) => set(i, 'pretax', e.target.checked)} className="h-4 w-4 accent-bridge-600" />Pre-tax</label>}
          <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-full text-slate hover:bg-mist" aria-label="Remove line"><X size={15} /></button>
        </div>
      ))}
    </div>
  )
}

function Editor({ user, pay, stub, onClose, onSaved }) {
  const [f, setF] = useState(() => (stub ? { payDate: stub.payDate, start: stub.start, end: stub.end, note: stub.note, ...stub.input, earnings: stub.input.earnings.map((e) => (e.hours === '' ? { label: e.label, amount: e.amount } : { label: e.label, hours: e.hours, rate: e.rate })) } : blank(pay)))
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const body = { userId: user.id, payDate: f.payDate, start: f.start, end: f.end, note: f.note, excludeId: stub?.id, input: { earnings: f.earnings, taxes: f.taxes, otherDeductions: f.otherDeductions } }

  const key = JSON.stringify(body)
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => api('/admin/pay/preview', { method: 'POST', body: JSON.parse(key), signal: ctrl.signal }).then(setPreview).catch(() => {}), 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [key])

  const fromTimesheets = async () => {
    try {
      const { timesheets } = await api('/admin/timesheets?status=Approved')
      const mine = timesheets.filter((t) => t.employee?.id === user.id && t.weekStart >= shift(f.start, -6) && t.weekStart <= f.end)
      if (!mine.length) return setErr('No approved timesheets in this pay period yet.')
      const ot = mine.reduce((s, t) => s + t.overtime, 0), reg = mine.reduce((s, t) => s + t.total - t.overtime, 0)
      setErr('')
      set('earnings')(f.earnings.map((e) => (/^regular/i.test(e.label) ? { ...e, hours: +reg.toFixed(2) } : /^overtime/i.test(e.label) ? { ...e, hours: +ot.toFixed(2) } : e)))
    } catch (ex) { setErr(ex.message) }
  }
  const estimate = () => preview && set('taxes')(f.taxes.map((t) => (/^federal/i.test(t.label) ? { ...t, amount: preview.fedEstimate.toFixed(2) } : t)))

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const r = stub ? await api(`/admin/pay/${stub.id}`, { method: 'PATCH', body }) : await api('/admin/pay', { method: 'POST', body })
      onSaved(r.stub, stub ? 'Pay stub updated. The employee sees the new figures right away.' : 'Pay stub posted. It is now in the employee’s Pay page.')
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const p = preview?.stub
  const auto = p ? [...p.taxes.filter((t) => /^Social Security|^Medicare/.test(t.label)), ...p.deductions.filter((d) => !f.otherDeductions.some((o) => o.label === d.label))] : []

  return (
    <Card title={stub ? `Edit pay stub ${stub.number}` : `New pay stub for ${user.first} ${user.last}`} action={<button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist" aria-label="Close"><X size={16} /></button>}>
      <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="field-label" htmlFor="ps-date">Pay date</label><input id="ps-date" type="date" value={f.payDate} onChange={(e) => set('payDate')(e.target.value)} required className="field" /></div>
            <div><label className="field-label" htmlFor="ps-start">Period start</label><input id="ps-start" type="date" value={f.start} onChange={(e) => set('start')(e.target.value)} required className="field" /></div>
            <div><label className="field-label" htmlFor="ps-end">Period end</label><input id="ps-end" type="date" value={f.end} onChange={(e) => set('end')(e.target.value)} required className="field" /></div>
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-[14px] font-medium">Earnings</p>
              <span className="flex gap-3 text-[13.5px]"><button type="button" onClick={fromTimesheets} className="text-bridge-700 hover:underline">Use approved timesheets</button>
                <button type="button" onClick={() => set('earnings')([...f.earnings, { label: 'Paid time off', hours: 0, rate: pay.rate || '' }])} className="text-bridge-700 hover:underline">+ Hourly line</button>
                <button type="button" onClick={() => set('earnings')([...f.earnings, { label: 'Bonus', amount: '' }])} className="text-bridge-700 hover:underline">+ Amount line</button></span></div>
            <Rows rows={f.earnings} onChange={set('earnings')} kind="earnings" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-[14px] font-medium">Income taxes withheld</p>
              <span className="flex gap-3 text-[13.5px]"><button type="button" onClick={estimate} disabled={!preview} className="text-bridge-700 hover:underline">Estimate federal from W-4{preview ? ` (${usd(preview.fedEstimate)})` : ''}</button>
                <button type="button" onClick={() => set('taxes')([...f.taxes, { label: '', amount: '' }])} className="text-bridge-700 hover:underline">+ Tax line</button></span></div>
            <Rows rows={f.taxes} onChange={set('taxes')} kind="taxes" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-[14px] font-medium">Other deductions</p>
              <button type="button" onClick={() => set('otherDeductions')([...f.otherDeductions, { label: '', amount: '', pretax: false }])} className="text-[13.5px] text-bridge-700 hover:underline">+ Deduction</button></div>
            {f.otherDeductions.length ? <Rows rows={f.otherDeductions} onChange={set('otherDeductions')} kind="deductions" /> : <p className="text-[13.5px] text-slate">None. Benefit premiums and the 401(k) are added automatically from the employee’s enrollment.</p>}
          </div>
          <div><label className="field-label" htmlFor="ps-note">Note on the stub <span className="font-normal text-slate">(optional)</span></label><input id="ps-note" value={f.note} onChange={(e) => set('note')(e.target.value)} maxLength={500} className="field" /></div>
        </div>

        <div className="h-fit rounded-xl bg-paper p-5 ring-1 ring-line">
          <p className="text-[13px] uppercase tracking-[0.12em] text-slate">Preview</p>
          {p ? <>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {[['Gross pay', p.gross], ['Taxes', p.totalTax], ['Deductions', p.totalDed], ['Net pay', p.net]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white p-3 ring-1 ring-line"><dt className="text-[12.5px] text-slate">{k}</dt><dd className={`font-display text-[22px] ${k === 'Net pay' ? 'text-bridge-700' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(v)}</dd></div>
              ))}
            </dl>
            <p className="mt-4 text-[13px] font-medium">Calculated for you</p>
            <ul className="mt-1.5 space-y-1 text-[13.5px] text-slate">
              {auto.map((l) => <li key={l.label} className="flex justify-between gap-3"><span>{l.label}</span><span className="tabular-nums text-ink">{usd(l.amount)}</span></li>)}
              {p.match > 0 && <li className="flex justify-between gap-3"><span>Employer 401(k) match</span><span className="tabular-nums text-ink">{usd(p.match)}</span></li>}
            </ul>
            <p className="mt-3 text-[12.5px] text-slate">Social Security is 6.2% up to the 2026 wage base of $184,500; Medicare is 1.45% (plus 0.9% over $200,000). The 401(k) uses the employee’s saved contribution rate and stops at the IRS limit.</p>
          </> : <p className="mt-3 text-[14px] text-slate">Calculating…</p>}
          {err && <p role="alert" className="mt-4 text-[14px] text-red-700">{err}</p>}
          <div className="mt-5 flex gap-3"><button disabled={busy} className="btn-dark disabled:opacity-60">{stub ? 'Save pay stub' : 'Post pay stub'}</button><button type="button" onClick={onClose} className="btn-ghost">Cancel</button></div>
        </div>
      </form>
    </Card>
  )
}

function Accounts({ user, accounts, onChange }) {
  const [msg, setMsg] = useState('')
  const verify = async (a) => {
    try { await api(`/admin/pay/accounts/${user.id}/${a.id}/verify`, { method: 'POST' }); setMsg(`${a.type} ••••${a.last4} marked verified.`); onChange() } catch (e) { setMsg(e.message) }
  }
  return (
    <Card title="Direct deposit accounts" pad={false}>
      {msg && <div className="px-6 pt-4"><Notice>{msg}</Notice></div>}
      <ul className="divide-y divide-line">
        {accounts.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 text-[14.5px]">
              <p className="font-medium">{a.type} · {a.primary ? 'Primary (remainder of net pay)' : `${usd(a.amount)} per paycheck`}</p>
              <p className="tabular-nums text-slate">Routing {a.routing} · Account {a.account} · added {when(a.addedAt)}</p>
            </div>
            <Badge tone={a.status === 'Verified' ? 'green' : 'amber'}>{a.status}</Badge>
            {a.status !== 'Verified' && <button onClick={() => verify(a)} className="btn-ghost h-9 px-3 text-[14px]">Mark verified</button>}
          </li>
        ))}
        {!accounts.length && <li className="px-6 py-6 text-slate">No bank accounts yet. The employee adds them from Pay → Direct deposit; until then pay is by check.</li>}
      </ul>
    </Card>
  )
}

export default function Pay() {
  const { employees, id, chosen, choose } = useEmployees()
  const data = useApi(id ? `/admin/pay?userId=${id}` : null)
  const d = data.data
  const [edit, setEdit] = useState(undefined)
  const [msg, setMsg] = useState({ text: '', tone: 'green' })
  useEffect(() => { setEdit(undefined); setMsg({ text: '' }) }, [id])

  const remove = async (s) => {
    if (!window.confirm(`Delete pay stub ${s.number} (${fmtDay(s.payDate)})? The employee will no longer see it.`)) return
    try { await api(`/admin/pay/${s.id}`, { method: 'DELETE' }); setMsg({ text: 'Pay stub deleted.', tone: 'green' }); data.reload() } catch (e) { setMsg({ text: e.message, tone: 'red' }) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Pay stubs" sub="Post and correct pay stubs for each employee. Social Security, Medicare, 401(k) and benefit deductions are calculated for you, and employees can download every stub as a PDF."
        actions={d && <button onClick={() => { setEdit(null); setMsg({ text: '' }) }} className="btn-dark h-11"><Plus size={17} /> New pay stub</button>} />
      <EmployeePicker employees={employees} id={id} choose={choose} />
      {id && data.error && <Notice tone="red">{data.error}</Notice>}
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {chosen && d && <>
        <p className="text-[14px] text-slate">{[chosen.profile?.employmentType, d.pay.rate ? `${usd(d.pay.rate)} per hour` : 'No pay rate set (Employees & approvals)', `Paid ${d.pay.frequency.toLowerCase()}`, d.w4 ? `W-4: ${d.w4.filingStatus}` : 'No W-4 on file', d.benefits.k401.enrolled ? `401(k) ${d.benefits.k401.pct}%` : 'Not in 401(k)'].filter(Boolean).join(' · ')}</p>
        {edit !== undefined && <Editor key={edit?.id || 'new'} user={chosen} pay={d.pay} stub={edit} onClose={() => setEdit(undefined)} onSaved={(_, t) => { setEdit(undefined); setMsg({ text: t, tone: 'green' }); data.reload() }} />}
        <Card title="Pay stubs" pad={false}>
          <ul className="divide-y divide-line">
            {d.stubs.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Pay date {fmtDay(s.payDate)} <span className="font-normal text-slate">· {s.number}</span></p>
                  <p className="text-[13.5px] text-slate">Period {fmtDay(s.start)} – {fmtDay(s.end)} · gross {usd(s.gross)} · taxes {usd(s.totalTax)} · deductions {usd(s.totalDed)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 font-display text-[22px] text-bridge-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(s.net)}</span>
                  <a href={fileUrl(`/admin/pay/${s.id}/pdf`)} download className="btn-ghost h-9 px-3 text-[14px]"><Download size={15} /> PDF</a>
                  <button onClick={() => { setEdit(s); setMsg({ text: '' }) }} className="btn-ghost h-9 px-3 text-[14px]"><Pencil size={15} /> Edit</button>
                  <button onClick={() => remove(s)} className="grid h-9 w-9 place-items-center rounded-full text-red-700 ring-1 ring-line hover:bg-red-50" aria-label={`Delete pay stub ${s.number}`}><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
            {!d.stubs.length && <li className="px-6 py-10 text-center text-slate">No pay stubs yet. Use “New pay stub” to post the first one.</li>}
          </ul>
        </Card>
        <Accounts user={chosen} accounts={d.accounts} onChange={data.reload} />
      </>}
      {!id && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Choose an employee to see and post their pay stubs.</p>}
      {id && !d && !data.error && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Loading…</p>}
    </div>
  )
}
