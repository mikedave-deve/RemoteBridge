import { useState } from 'react'
import { Download, Landmark, Lock, Plus, Send, Wallet, X } from 'lucide-react'
import { employee, usd } from '../../data/portal'
import { api, fileUrl } from '../../lib/api'
import { site, useSite } from '../../lib/siteData'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Stat, Table, Tabs } from '../ui'

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

// A short success chime, built with the Web Audio API so no sound file is needed.
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[[660, 0], [880, 0.1], [1320, 0.2]].forEach(([freq, t]) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      osc.connect(gain); gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, now + t)
      gain.gain.exponentialRampToValueAtTime(0.18, now + t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35)
      osc.start(now + t); osc.stop(now + t + 0.4)
    })
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch { /* audio not available */ }
}

// Green circle with an animated check and a soft expanding ring.
function SuccessTick() {
  return (
    <div className="relative grid h-20 w-20 place-items-center">
      <style>{`
        @keyframes tk-pop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes tk-draw { to { stroke-dashoffset: 0 } }
        @keyframes tk-ring { 0% { transform: scale(0.4); opacity: 0.45 } 100% { transform: scale(1.7); opacity: 0 } }
      `}</style>
      <span aria-hidden className="absolute h-20 w-20 rounded-full bg-emerald-400" style={{ animation: 'tk-ring 0.8s ease-out forwards' }} />
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'tk-pop 0.4s ease-out both' }} role="img" aria-label="Success">
        <circle cx="40" cy="40" r="36" fill="#059669" />
        <path d="M24 41 l11 11 l21 -23" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="60" strokeDashoffset="60" style={{ animation: 'tk-draw 0.45s 0.25s ease-out forwards' }} />
      </svg>
    </div>
  )
}

function Modal({ children, onClose, labelledBy }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-line" onClick={(e) => e.stopPropagation()}>
        {onClose && <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-slate hover:text-ink"><X size={18} /></button>}
        {children}
      </div>
    </div>
  )
}

const fmtWhen = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function Transfer({ balance: initialBalance, accounts, transfers: initialTransfers }) {
  const [balance, setBalance] = useState(initialBalance || { available: 0, earned: 0, sent: 0 })
  const [transfers, setTransfers] = useState(initialTransfers || [])
  const verified = (accounts || []).filter((a) => a.status === 'Verified')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(verified[0]?.id || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(null) // { token, amount, account, sentTo }
  const [success, setSuccess] = useState(null) // { amount, account }

  const start = async (e) => {
    e?.preventDefault()
    setErr('')
    const amt = Number(String(amount).replace(/[^0-9.]/g, ''))
    if (!(amt > 0)) return setErr('Enter how much you want to transfer.')
    if (amt > balance.available) return setErr(`You can transfer up to ${usd(balance.available)}.`)
    if (!accountId) return setErr('Choose a bank account to transfer to.')
    setBusy(true)
    try {
      const r = await api('/me/pay/transfer/start', { method: 'POST', body: { amount: amt, accountId } })
      setPending(r); setCode('')
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  const confirm = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const r = await api('/me/pay/transfer/confirm', { method: 'POST', body: { token: pending.token, code } })
      setBalance(r.balance); setTransfers((t) => [r.transfer, ...t])
      setSuccess({ amount: r.transfer.amount, account: r.transfer.accountLabel })
      setPending(null); setAmount(''); setCode('')
      playChime()
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Available to transfer" value={usd(balance.available)} icon={Wallet} note="Net pay in your balance" />
        <Stat label="Paid in to date" value={usd(balance.earned)} note="Total net pay posted" />
        <Stat label="Transferred out" value={usd(balance.sent)} note="Sent to your bank" />
      </div>

      <Card title="Transfer to your bank">
        {!verified.length ? (
          <Notice tone="amber">Add a bank account under <span className="font-medium">Direct deposit</span> and wait for payroll to verify it. Once it shows <span className="font-medium">Verified</span>, you can transfer your balance here.</Notice>
        ) : (
          <form onSubmit={start} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="tr-amount">Amount</label>
              <input id="tr-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="field" />
              <button type="button" onClick={() => setAmount(String(balance.available))} className="mt-1.5 text-[13px] text-bridge-700 hover:underline">Transfer all ({usd(balance.available)})</button>
            </div>
            <div>
              <label className="field-label" htmlFor="tr-account">To account</label>
              <select id="tr-account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="field">
                {verified.map((a) => <option key={a.id} value={a.id}>{a.type} ••••{a.last4}{a.primary ? ' · Primary' : ''}</option>)}
              </select>
            </div>
            {err && !pending && <p role="alert" className="text-[14px] text-red-700 sm:col-span-2">{err}</p>}
            <p className="flex items-start gap-2 text-[13.5px] text-slate sm:col-span-2"><Lock size={15} className="mt-0.5 shrink-0" />For your security, we email a confirmation code to your own address before any money moves.</p>
            <div className="sm:col-span-2"><button disabled={busy || !(balance.available > 0)} className="btn-primary disabled:opacity-60"><Send size={17} /> {busy ? 'Sending code…' : 'Transfer money'}</button></div>
          </form>
        )}
      </Card>

      {transfers.length > 0 && (
        <Card title="Transfer history" pad={false}>
          <Table head={['Reference', 'To account', 'Date', 'Amount', 'Status']} align={['', '', '', 'r', '']}
            rows={transfers.map((t) => [<span key="r" className="text-slate">{t.reference}</span>, t.accountLabel, fmtWhen(t.createdAt), usd(t.amount), <Badge key="s" tone="green">{t.status === 'completed' ? 'Completed' : t.status}</Badge>])} />
        </Card>
      )}

      {pending && (
        <Modal onClose={() => !busy && setPending(null)} labelledBy="tr-code-title">
          <h3 id="tr-code-title" className="font-sans text-[18px] font-semibold text-ink">Enter your confirmation code</h3>
          <p className="mt-2 text-[14.5px] text-slate">We emailed a 6-digit code to <span className="font-medium text-ink">{pending.sentTo}</span>. Enter it to send <span className="font-medium text-ink">{usd(pending.amount)}</span> to {pending.account}.</p>
          <form onSubmit={confirm} className="mt-4 space-y-3">
            <input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••" className="field h-16 text-center text-[26px] tracking-[0.5em]" aria-label="6-digit confirmation code" />
            {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
            <div className="flex gap-3">
              <button disabled={busy || code.length !== 6} className="btn-primary flex-1 disabled:opacity-60">{busy ? 'Confirming…' : 'Confirm transfer'}</button>
              <button type="button" onClick={() => setPending(null)} className="btn-ghost">Cancel</button>
            </div>
            <button type="button" onClick={start} disabled={busy} className="text-[13.5px] text-bridge-700 hover:underline disabled:opacity-60">Didn’t get it? Send a new code</button>
          </form>
        </Modal>
      )}

      {success && (
        <Modal onClose={() => setSuccess(null)} labelledBy="tr-done-title">
          <div className="flex flex-col items-center pt-2 text-center">
            <SuccessTick />
            <h3 id="tr-done-title" className="mt-4 font-display text-[26px] text-ink">Transfer successful</h3>
            <p className="mt-1 text-[15px] text-slate">{usd(success.amount)} is on its way to {success.account}.</p>
            <div className="mt-5 w-full rounded-xl bg-amber-50 p-4 text-left text-[13.5px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
              <strong>Important:</strong> Bank transfers usually arrive within 1–3 business days. You cannot cancel a transfer once it is confirmed, so if anything looks wrong, contact payroll from Help &amp; HR right away.
            </div>
            <button onClick={() => setSuccess(null)} className="btn-primary mt-5 w-full">Done</button>
          </div>
        </Modal>
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
      <Tabs tabs={['Pay stubs', 'Direct deposit', 'Transfer']} value={tab} onChange={setTab} />
      {error && <Notice tone="red">{error}</Notice>}
      {!data && !error && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Loading…</p>}
      {data && (tab === 'Pay stubs' ? <Stubs stubs={stubs} idx={Math.min(idx, Math.max(0, stubs.length - 1))} setIdx={setIdx} />
        : tab === 'Direct deposit' ? <Deposit initial={data.accounts} />
        : <Transfer balance={data.balance} accounts={data.accounts} transfers={data.transfers} />)}
    </div>
  )
}
