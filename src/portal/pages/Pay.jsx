import { useState } from 'react'
import { Download, Landmark, Lock, Plus } from 'lucide-react'
import { employee, usd } from '../../data/portal'
import { api, fileUrl } from '../../lib/api'
import { site, useSite } from '../../lib/siteData'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Tabs } from '../ui'

const fmtDay = (k, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', opts)

/** Year-to-date totals through this stub: same calendar year, this pay date or earlier. */
const ytdList = (stubs, s) => stubs.filter((p) => p.payDate.slice(0, 4) === s.payDate.slice(0, 4) && p.payDate <= s.payDate)
const ytdOf = (list, label) => list.reduce((sum, p) => sum + ([...p.earnings, ...p.taxes, ...p.deductions].find((x) => x.label === label)?.amount || 0), 0)

function Lines({ title, rows, ytd, total, ytdTotal }) {
  const hours = rows.some((r) => r.hours !== undefined)
  return (
    <div>
      <table className="w-full text-[14px]">
        <thead>
          <tr className="border-b border-line text-left text-[12px] uppercase tracking-[0.08em] text-slate">
            <th className="py-2 font-semibold">{title}</th>
            {hours && <><th className="py-2 text-right font-semibold">Hours</th><th className="py-2 text-right font-semibold">Rate</th></>}
            <th className="py-2 text-right font-semibold">Current</th>
            <th className="py-2 text-right font-semibold">Year to date</th>
          </tr>
        </thead>
        <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line/70">
              <td className="py-2.5">{r.label}{r.pretax && <span className="ml-2 text-[12px] text-slate">pre-tax</span>}</td>
              {hours && <><td className="py-2.5 text-right">{r.hours !== undefined ? r.hours.toFixed(2) : ''}</td><td className="py-2.5 text-right">{r.rate !== undefined ? usd(r.rate) : ''}</td></>}
              <td className="py-2.5 text-right">{usd(r.amount)}</td>
              <td className="py-2.5 text-right text-slate">{usd(ytdOf(ytd, r.label))}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2.5" colSpan={hours ? 3 : 1}>Total</td>
            <td className="py-2.5 text-right">{usd(total)}</td>
            <td className="py-2.5 text-right">{usd(ytdTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Stub({ s, stubs }) {
  useSite()
  const ytd = ytdList(stubs, s)
  const sum = (f) => ytd.reduce((a, p) => a + f(p), 0)
  return (
    <div className="rounded-2xl bg-white ring-1 ring-line print:ring-0">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-6 sm:flex-row">
        <div>
          <p className="text-[13px] uppercase tracking-[0.12em] text-slate">Earnings statement</p>
          <p className="mt-1 font-display text-[26px]">Pay date {fmtDay(s.payDate)}</p>
          <p className="text-[14px] text-slate">Pay period {fmtDay(s.start, { month: 'short', day: 'numeric' })} – {fmtDay(s.end)} · Statement no. {s.number}</p>
        </div>
        <div className="text-[14px] sm:text-right">
          <p className="font-medium">PremierRemoteBridge, Inc.</p>
          {site.address && <p className="text-slate">{site.address}</p>}
          <p className="mt-2 font-medium">{employee.first} {employee.last}</p>
          <p className="text-slate">{[...employee.address, `Employee ID ${employee.id}`].join(' · ')}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {[['Gross pay', s.gross], ['Taxes', s.totalTax], ['Deductions', s.totalDed], ['Net pay', s.net]].map(([k, v]) => (
          <div key={k} className="bg-white p-5"><dt className="text-[13px] text-slate">{k}</dt><dd className={`mt-1 font-display text-[24px] ${k === 'Net pay' ? 'text-bridge-700' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(v)}</dd></div>
        ))}
      </dl>
      <div className="space-y-8 p-6">
        <Lines title="Earnings" rows={s.earnings} ytd={ytd} total={s.gross} ytdTotal={sum((p) => p.gross)} />
        <Lines title="Taxes withheld" rows={s.taxes} ytd={ytd} total={s.totalTax} ytdTotal={sum((p) => p.totalTax)} />
        {s.deductions.length > 0 && <Lines title="Deductions" rows={s.deductions} ytd={ytd} total={s.totalDed} ytdTotal={sum((p) => p.totalDed)} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-paper p-4 text-[14px] ring-1 ring-line">
            <p className="font-medium">Employer contributions (not deducted from your pay)</p>
            <p className="mt-1 text-slate">{s.match ? `401(k) match: ${usd(s.match)} this period · ${usd(sum((p) => p.match))} year to date` : 'No employer 401(k) match this period.'}</p>
          </div>
          <div className="rounded-xl bg-paper p-4 text-[14px] ring-1 ring-line">
            <p className="font-medium">Direct deposit</p>
            <p className="mt-1 text-slate">{s.deposits.length ? s.deposits.map((d) => `${d.label}: ${usd(d.amount)}`).join(' · ') : 'Paid by check. Add a bank account under Direct deposit.'}</p>
          </div>
        </div>
        {s.note && <p className="text-[14px] text-slate">{s.note}</p>}
        <p className="text-[12.5px] text-slate">Taxes are withheld based on your Form W-4 and your work location. Questions about this statement? Contact payroll from Help & HR.</p>
      </div>
    </div>
  )
}

function Stubs({ stubs, idx, setIdx }) {
  if (!stubs.length) return <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">No pay stubs yet. Your pay stubs appear here as soon as payroll posts them.</p>
  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <Card title="Pay stubs" pad={false} className="print:hidden">
        <ul className="max-h-[720px] divide-y divide-line overflow-y-auto">
          {stubs.map((p, i) => (
            <li key={p.id}>
              <button onClick={() => setIdx(i)} aria-current={i === idx} className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-[14.5px] transition-colors ${i === idx ? 'bg-bridge-50' : 'hover:bg-paper'}`}>
                <span><span className="block font-medium text-ink">{fmtDay(p.payDate)}</span><span className="text-[13px] text-slate">{p.hours ? `${p.hours} hours` : p.number}</span></span>
                <span className="tabular-nums text-ink">{usd(p.net)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Stub s={stubs[idx]} stubs={stubs} />
    </div>
  )
}

function Deposit({ initial }) {
  const [accounts, setAccounts] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    const routing = String(f.routing).replace(/\D/g, '')
    if (routing.length !== 9) return setErr(`The routing number must be exactly 9 digits (you entered ${routing.length}).`)
    if (!/^\d{4,17}$/.test(f.account) || f.account !== f.confirm) return setErr('Account numbers must match and contain 4 to 17 digits.')
    setBusy(true)
    try {
      const r = await api('/me/pay/accounts', { method: 'POST', body: f })
      setAccounts(r.accounts); setErr(''); setAdding(false)
      setDone('Request received. Payroll verifies new accounts before the next payroll, and you will see it marked Verified here.')
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.type.toLowerCase()} account ••••${a.last4}?`)) return
    try { const r = await api(`/me/pay/accounts/${a.id}`, { method: 'DELETE' }); setAccounts(r.accounts); setDone('Account removed.') } catch (ex) { setErr(ex.message) }
  }
  return (
    <div className="space-y-6">
      {done && <Notice>{done}</Notice>}
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-bridge-50 text-bridge-700"><Landmark size={20} /></span>
              {a.primary ? <Badge tone="teal">Primary</Badge> : <Badge>Split</Badge>}
            </div>
            <p className="mt-4 font-medium">{a.type} account</p>
            <p className="text-[14px] text-slate">{a.type} ••••{a.last4} · Routing ••••{a.routingLast4}</p>
            <p className="mt-3 text-[14px]">{a.primary ? 'Remainder of net pay' : `${usd(a.amount)} per paycheck`}</p>
            <div className="mt-3 flex items-center justify-between"><Badge tone={a.status === 'Verified' ? 'green' : 'amber'}>{a.status}</Badge><button onClick={() => remove(a)} className="text-[13.5px] text-red-700 hover:underline">Remove</button></div>
          </div>
        ))}
        {!accounts.length && <p className="rounded-2xl bg-white p-6 text-slate ring-1 ring-line md:col-span-2">No bank account on file. Add one to get paid by direct deposit.</p>}
      </div>
      {adding ? (
        <Card title="Add a bank account">
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" autoComplete="off">
            <div><label className="field-label" htmlFor="dd-routing">Routing number</label><input id="dd-routing" name="routing" inputMode="numeric" maxLength={9} required className="field" /></div>
            <div><label className="field-label" htmlFor="dd-type">Account type</label><select id="dd-type" name="type" className="field"><option>Checking</option><option>Savings</option></select></div>
            <div><label className="field-label" htmlFor="dd-acct">Account number</label><input id="dd-acct" name="account" type="password" inputMode="numeric" maxLength={17} required className="field" /></div>
            <div><label className="field-label" htmlFor="dd-confirm">Confirm account number</label><input id="dd-confirm" name="confirm" type="password" inputMode="numeric" maxLength={17} required className="field" onPaste={(e) => e.preventDefault()} /></div>
            {accounts.length > 0 && <div><label className="field-label" htmlFor="dd-amount">Amount per paycheck ($)</label><input id="dd-amount" name="amount" inputMode="decimal" required className="field" placeholder="Your primary account gets the rest" /></div>}
            {err && <p role="alert" className="text-[14px] text-red-700 sm:col-span-2">{err}</p>}
            <p className="flex items-start gap-2 text-[13.5px] text-slate sm:col-span-2"><Lock size={15} className="mt-0.5 shrink-0" />Changes to direct deposit are always reviewed by payroll and take effect only after verification, to protect you from payroll fraud.</p>
            <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="btn-primary disabled:opacity-60">Submit for verification</button><button type="button" onClick={() => setAdding(false)} className="btn-ghost">Cancel</button></div>
          </form>
        </Card>
      ) : (
        accounts.length < 3 && <button onClick={() => { setAdding(true); setDone(''); setErr('') }} className="btn-ghost"><Plus size={17} /> Add bank account</button>
      )}
    </div>
  )
}

export default function Pay() {
  const [tab, setTab] = useState('Pay stubs')
  const [idx, setIdx] = useState(0)
  const { data, error } = useApi('/me/pay')
  const stubs = data?.stubs || []
  const p = data?.pay
  const sub = p ? [p.type, p.rate ? `${usd(p.rate)} per hour` : '', `Paid ${p.frequency.toLowerCase()}`].filter(Boolean).join(' · ') : 'Loading your pay…'
  return (
    <div className="space-y-6">
      <PageHead title="Pay" sub={sub}
        actions={tab === 'Pay stubs' && stubs[idx] && <a href={fileUrl(`/me/pay/${stubs[idx].id}/pdf`)} download className="btn-ghost h-11"><Download size={17} /> Download PDF</a>} />
      <Tabs tabs={['Pay stubs', 'Direct deposit']} value={tab} onChange={setTab} />
      {error && <Notice tone="red">{error}</Notice>}
      {!data && !error && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Loading…</p>}
      {data && (tab === 'Pay stubs' ? <Stubs stubs={stubs} idx={Math.min(idx, Math.max(0, stubs.length - 1))} setIdx={setIdx} /> : <Deposit initial={data.accounts} />)}
    </div>
  )
}
