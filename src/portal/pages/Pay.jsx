import { useState } from 'react'
import { Landmark, Lock, Plus, Printer } from 'lucide-react'
import { bankAccounts, employee, fmtDate, payStubs, usd } from '../../data/portal'
import { Badge, Card, Notice, PageHead, Tabs } from '../ui'

const ytdThrough = (idx, label) => payStubs.slice(idx).reduce((s, p) => s + ([...p.earnings, ...p.taxes, ...p.deductions].find((x) => x.label === label)?.amount || 0), 0)

function Lines({ title, rows, idx, total, ytdTotal }) {
  return (
    <div>
      <table className="w-full text-[14px]">
        <thead>
          <tr className="border-b border-line text-left text-[12px] uppercase tracking-[0.08em] text-slate">
            <th className="py-2 font-semibold">{title}</th>
            {rows[0]?.hours !== undefined && <><th className="py-2 text-right font-semibold">Hours</th><th className="py-2 text-right font-semibold">Rate</th></>}
            <th className="py-2 text-right font-semibold">Current</th>
            <th className="py-2 text-right font-semibold">Year to date</th>
          </tr>
        </thead>
        <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line/70">
              <td className="py-2.5">{r.label}{r.pretax && <span className="ml-2 text-[12px] text-slate">pre-tax</span>}</td>
              {r.hours !== undefined && <><td className="py-2.5 text-right">{r.hours.toFixed(2)}</td><td className="py-2.5 text-right">{usd(r.rate)}</td></>}
              <td className="py-2.5 text-right">{usd(r.amount)}</td>
              <td className="py-2.5 text-right text-slate">{usd(ytdThrough(idx, r.label))}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2.5" colSpan={rows[0]?.hours !== undefined ? 3 : 1}>Total</td>
            <td className="py-2.5 text-right">{usd(total)}</td>
            <td className="py-2.5 text-right">{usd(ytdTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Stub({ idx }) {
  const s = payStubs[idx]
  const ytd = (f) => payStubs.slice(idx).reduce((a, p) => a + f(p), 0)
  return (
    <div className="rounded-2xl bg-white ring-1 ring-line print:ring-0">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-6 sm:flex-row">
        <div>
          <p className="text-[13px] uppercase tracking-[0.12em] text-slate">Earnings statement</p>
          <p className="mt-1 font-display text-[26px]">Pay date {fmtDate(s.payDate)}</p>
          <p className="text-[14px] text-slate">Pay period {fmtDate(s.start, { month: 'short', day: 'numeric' })} – {fmtDate(s.end)} · Check no. {s.id}</p>
        </div>
        <div className="text-[14px] sm:text-right">
          <p className="font-medium">RemoteBridge, Inc.</p>
          <p className="text-slate">1180 Peachtree St NE, Atlanta, GA 30309</p>
          <p className="mt-2 font-medium">{employee.first} {employee.last}</p>
          <p className="text-slate">{employee.address.join(', ')} · Employee ID {employee.id}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {[['Gross pay', s.gross], ['Taxes', s.totalTax], ['Deductions', s.totalDed], ['Net pay', s.net]].map(([k, v]) => (
          <div key={k} className="bg-white p-5"><dt className="text-[13px] text-slate">{k}</dt><dd className={`mt-1 font-display text-[24px] ${k === 'Net pay' ? 'text-bridge-700' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(v)}</dd></div>
        ))}
      </dl>
      <div className="space-y-8 p-6">
        <Lines title="Earnings" rows={s.earnings} idx={idx} total={s.gross} ytdTotal={ytd((p) => p.gross)} />
        <Lines title="Taxes withheld" rows={s.taxes} idx={idx} total={s.totalTax} ytdTotal={ytd((p) => p.totalTax)} />
        <Lines title="Deductions" rows={s.deductions} idx={idx} total={s.totalDed} ytdTotal={ytd((p) => p.totalDed)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-paper p-4 text-[14px] ring-1 ring-line">
            <p className="font-medium">Employer contributions (not deducted from your pay)</p>
            <p className="mt-1 text-slate">401(k) match: {usd(s.match)} this period · {usd(ytd((p) => p.match))} year to date</p>
          </div>
          <div className="rounded-xl bg-paper p-4 text-[14px] ring-1 ring-line">
            <p className="font-medium">Direct deposit</p>
            <p className="mt-1 text-slate">Savings ••••2216: $150.00 · Checking ••••7730: {usd(s.net - 150)}</p>
          </div>
        </div>
        <p className="text-[12.5px] text-slate">Federal filing status: single. Ohio and Columbus taxes withheld based on your work location. Questions about this statement? Contact payroll from Help & HR.</p>
      </div>
    </div>
  )
}

function Stubs() {
  const [idx, setIdx] = useState(0)
  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <Card title="2026 pay stubs" pad={false} className="print:hidden">
        <ul className="max-h-[720px] divide-y divide-line overflow-y-auto">
          {payStubs.map((p, i) => (
            <li key={p.id}>
              <button onClick={() => setIdx(i)} aria-current={i === idx} className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-[14.5px] transition-colors ${i === idx ? 'bg-bridge-50' : 'hover:bg-paper'}`}>
                <span><span className="block font-medium text-ink">{fmtDate(p.payDate)}</span><span className="text-[13px] text-slate">{p.hours} hours</span></span>
                <span className="tabular-nums text-ink">{usd(p.net)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Stub idx={idx} />
    </div>
  )
}

function Deposit() {
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const routing = String(f.get('routing'))
    const acct = String(f.get('account'))
    // ABA routing numbers are 9 digits with a weighted checksum.
    const d = routing.split('').map(Number)
    const ok = /^\d{9}$/.test(routing) && (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0
    if (!ok) return setErr('That routing number is not valid. It should be the 9-digit number printed on your checks.')
    if (!/^\d{4,17}$/.test(acct) || acct !== String(f.get('confirm'))) return setErr('Account numbers must match and contain 4 to 17 digits.')
    setErr(''); setDone(true); setAdding(false)
  }
  return (
    <div className="space-y-6">
      {done && <Notice>Request received. For your security, the new account will be verified with two small deposits and becomes active on the next payroll after you confirm them. We also sent an email notice.</Notice>}
      <div className="grid gap-4 md:grid-cols-2">
        {bankAccounts.map((a) => (
          <div key={a.last4} className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-bridge-50 text-bridge-700"><Landmark size={20} /></span>
              {a.primary ? <Badge tone="teal">Primary</Badge> : <Badge>Split</Badge>}
            </div>
            <p className="mt-4 font-medium">{a.bank}</p>
            <p className="text-[14px] text-slate">{a.type} ••••{a.last4} · Routing ••••{a.routingLast4}</p>
            <p className="mt-3 text-[14px]">{a.split}</p>
          </div>
        ))}
      </div>
      {adding ? (
        <Card title="Add a bank account">
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" autoComplete="off">
            <div><label className="field-label" htmlFor="dd-routing">Routing number</label><input id="dd-routing" name="routing" inputMode="numeric" maxLength={9} required className="field" /></div>
            <div><label className="field-label" htmlFor="dd-type">Account type</label><select id="dd-type" name="type" className="field"><option>Checking</option><option>Savings</option></select></div>
            <div><label className="field-label" htmlFor="dd-acct">Account number</label><input id="dd-acct" name="account" type="password" inputMode="numeric" maxLength={17} required className="field" /></div>
            <div><label className="field-label" htmlFor="dd-confirm">Confirm account number</label><input id="dd-confirm" name="confirm" type="password" inputMode="numeric" maxLength={17} required className="field" onPaste={(e) => e.preventDefault()} /></div>
            {err && <p role="alert" className="text-[14px] text-red-700 sm:col-span-2">{err}</p>}
            <p className="flex items-start gap-2 text-[13.5px] text-slate sm:col-span-2"><Lock size={15} className="mt-0.5 shrink-0" />Changes to direct deposit always trigger an email to your address on file and take effect only after verification, to protect you from payroll fraud.</p>
            <div className="flex gap-3 sm:col-span-2"><button className="btn-primary">Submit for verification</button><button type="button" onClick={() => setAdding(false)} className="btn-ghost">Cancel</button></div>
          </form>
        </Card>
      ) : (
        <button onClick={() => { setAdding(true); setDone(false) }} className="btn-ghost"><Plus size={17} /> Add bank account</button>
      )}
    </div>
  )
}

export default function Pay() {
  const [tab, setTab] = useState('Pay stubs')
  return (
    <div className="space-y-6">
      <PageHead title="Pay" sub={`${employee.type} · ${usd(employee.rate)} per hour · Paid ${employee.payFrequency}`}
        actions={tab === 'Pay stubs' && <button onClick={() => window.print()} className="btn-ghost h-11"><Printer size={17} /> Print or save as PDF</button>} />
      <Tabs tabs={['Pay stubs', 'Direct deposit']} value={tab} onChange={setTab} />
      {tab === 'Pay stubs' ? <Stubs /> : <Deposit />}
    </div>
  )
}
