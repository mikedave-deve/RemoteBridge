import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { api } from '../../lib/api'
import { RETIREMENT } from '../../lib/benefits'
import { PERIODS, RULES, acaMaxPerCheck, catchUpFor } from '../../lib/payroll'
import { Badge, Card, Notice, PageHead } from '../../portal/ui'
import EmployeePicker, { useEmployees } from '../EmployeePicker'
import { useApi } from '../useApi'

const usd = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const CATCH_UP = { none: 'Under 50', '50+': 'Age 50–59 or 64+', '60-63': 'Age 60–63' }

/** One-click percentage choices under an input. */
function Chips({ value, options, onPick }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map(([v, note]) => (
        <button key={v} type="button" onClick={() => onPick(v)} title={note || undefined}
          className={`rounded-full px-2.5 py-1 text-[12.5px] ring-1 ${value === v ? 'bg-bridge-900 text-white ring-bridge-900' : 'bg-white text-slate ring-line hover:text-ink'}`}>
          {v}%{note ? ` · ${note}` : ''}
        </button>
      ))}
    </div>
  )
}

function Form({ user, d, onSaved }) {
  const digits = (user.employeeId || '').replace(/\D/g, '')
  const [plans, setPlans] = useState(() => Object.fromEntries(d.catalog.map((c) => {
    const e = d.plans.find((p) => p.name === c.name)
    return [c.name, e.enrolled ? { enrolled: true, tier: e.tier, perCheck: e.perCheck, employer: e.employer, memberId: e.memberId } : { enrolled: false, tier: c.tiers[0], perCheck: c.perCheck, employer: c.employer, memberId: digits ? `${c.prefix}-${digits}` : '' }]
  })))
  const [k, setK] = useState(() => ({ ...d.k401, pct: d.k401.enrolled ? d.k401.pct : 6, matchPct: d.k401.enrolled ? d.k401.matchPct : 4 }))
  const [ben, setBen] = useState(() => d.beneficiaries.map((b) => ({ ...b })))
  const [msg, setMsg] = useState({ text: '' })
  const [busy, setBusy] = useState(false)
  const setPlan = (name, key, v) => setPlans({ ...plans, [name]: { ...plans[name], [key]: v } })
  const setBenRow = (i, key, v) => setBen(ben.map((b, j) => (j === i ? { ...b, [key]: v } : b)))
  const [applied, setApplied] = useState('')

  // ---- US-rule presets: one click fills the form; "Approve enrollment" saves it. ----
  const acaMax = acaMaxPerCheck(d.pay.rate, d.pay.frequency)
  const ageCatchUp = catchUpFor(d.dob)
  const annualPay = d.stats.lastGross ? d.stats.lastGross * (PERIODS[d.pay.frequency] || 26) : d.pay.rate * 2080
  const planDefaults = (on) => Object.fromEntries(d.catalog.map((c) => {
    // 'free' = only the employer-paid plans; otherwise every plan.
    const enrolled = on !== 'free' || c.perCheck === 0
    const perCheck = c.name === 'Medical' && acaMax != null ? Math.min(c.perCheck, acaMax) : c.perCheck
    return [c.name, { ...plans[c.name], enrolled, tier: plans[c.name].tier || c.tiers[0], perCheck, employer: c.employer, memberId: plans[c.name].memberId || (digits ? `${c.prefix}-${digits}` : '') }]
  }))
  const k401 = (on, pct) => ({ ...k, enrolled: on, pct, matchPct: RULES.safeHarborMatch, roth: false, catchUp: ageCatchUp || k.catchUp || 'none' })
  const PRESETS = [
    { key: 'full', title: 'Full benefits package', tag: 'Recommended',
      desc: `Medical, dental and vision (employee only), employer-paid life, disability and EAP, and the 401(k) at 6% with the 4% safe-harbor match.${acaMax != null ? ` The employee’s medical share stays at or under ${usd(acaMax)} a paycheck so it is ACA-affordable.` : ''}`,
      apply: () => { setPlans(planDefaults('all')); setK(k401(true, 6)) } },
    { key: 'auto', title: 'SECURE 2.0 auto-enrollment', tag: '401(k) only',
      desc: `Enrolls the 401(k) at ${RULES.autoEnrollMin}%, the federal default for new plans, with the 4% safe-harbor match. Health plans stay as they are.`,
      apply: () => setK(k401(true, RULES.autoEnrollMin)) },
    { key: 'health', title: 'Health plans only', tag: 'No 401(k)',
      desc: 'Medical, dental and vision plus the employer-paid life, disability and EAP. No retirement plan.',
      apply: () => { setPlans(planDefaults('health')); setK({ ...k, enrolled: false }) } },
    { key: 'basic', title: 'Employer-paid basics', tag: 'Free to employee',
      desc: 'Life insurance, disability and the Employee Assistance Program, all paid by the company. Nothing is deducted from pay.',
      apply: () => { setPlans(planDefaults('free')); setK({ ...k, enrolled: false }) } },
  ]
  const applyPreset = (p) => { p.apply(); setApplied(p.title); setMsg({ text: '' }) }
  const medical = plans.Medical
  const overAca = medical?.enrolled && acaMax != null && Number(medical.perCheck) > acaMax
  const limit = d.limits.k401 + (d.limits.catchUp[k.catchUp] || 0)
  const overLimit = k.enrolled && annualPay > 0 && (annualPay * Number(k.pct)) / 100 > limit

  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await api(`/admin/benefits/${user.id}`, { method: 'PUT', body: { plans, k401: k, beneficiaries: ben } }); setApplied(''); setMsg({ text: `Approved. ${user.first} sees the new coverage in Benefits, and the next pay stub uses these deductions.`, tone: 'green' }); onSaved() }
    catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card title="US-compliant presets" action={<span className="text-[13px] text-slate">2026 plan year</span>}>
        <p className="mb-4 text-[14px] text-slate">Pick a package to fill in everything below with amounts that follow federal rules, then click <strong className="font-medium text-ink">Approve enrollment</strong>.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {PRESETS.map((p) => (
            <button key={p.key} type="button" onClick={() => applyPreset(p)}
              className={`flex flex-col rounded-xl p-4 text-left ring-1 transition-colors hover:bg-paper ${applied === p.title ? 'bg-bridge-50 ring-2 ring-bridge-500' : 'bg-white ring-line'}`}>
              <span className="flex items-center justify-between gap-2"><span className="font-semibold text-ink">{p.title}</span><Badge tone={p.key === 'full' ? 'teal' : 'gray'}>{p.tag}</Badge></span>
              <span className="mt-1.5 text-[13.5px] text-slate">{p.desc}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-bridge-700"><Check size={15} /> {applied === p.title ? 'Applied' : 'Use this package'}</span>
            </button>
          ))}
        </div>
        <ul className="mt-4 grid gap-1.5 text-[12.5px] text-slate sm:grid-cols-2">
          <li>401(k) employee limit {usd(d.limits.k401)}; catch-up {usd(d.limits.catchUp['50+'])} at 50+, {usd(d.limits.catchUp['60-63'])} at 60–63 (IRS)</li>
          <li>Auto-enrollment {RULES.autoEnrollMin}%–{RULES.autoEnrollMax}% of pay for new plans (SECURE 2.0)</li>
          <li>Safe-harbor match: 100% of contributions up to {RULES.safeHarborMatch}% of pay (IRS)</li>
          <li>Self-only medical affordable at ≤ {(RULES.acaAffordability * 100).toFixed(2)}% of pay (ACA){acaMax != null ? ` = ${usd(acaMax)} a paycheck for ${user.first}` : ''}</li>
        </ul>
        {!d.pay.rate && <p className="mt-3 text-[13px] text-amber-800">Add {user.first}’s hourly pay rate in Employees & approvals to check ACA affordability and the 401(k) limit for their pay.</p>}
        {applied && <div className="mt-4"><Notice tone="teal">“{applied}” filled in below. Review it, then click Approve enrollment at the bottom.</Notice></div>}
      </Card>

      <Card title="Health and insurance plans" pad={false}>
        <ul className="divide-y divide-line">
          {d.catalog.map((c) => {
            const p = plans[c.name]
            return (
              <li key={c.name} className="px-6 py-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={p.enrolled} onChange={(e) => setPlan(c.name, 'enrolled', e.target.checked)} className="h-4 w-4 accent-bridge-600" />
                  <span className="font-medium">{c.name}</span><span className="text-[14px] text-slate">{c.plan}</span>
                </label>
                {p.enrolled && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div><label className="field-label" htmlFor={`t-${c.prefix}`}>Coverage</label><select id={`t-${c.prefix}`} value={p.tier} onChange={(e) => setPlan(c.name, 'tier', e.target.value)} className="field">{c.tiers.map((t) => <option key={t}>{t}</option>)}</select></div>
                    <div><label className="field-label" htmlFor={`e-${c.prefix}`}>Employee pays / paycheck</label><input id={`e-${c.prefix}`} inputMode="decimal" value={p.perCheck} onChange={(e) => setPlan(c.name, 'perCheck', e.target.value)} className="field" /></div>
                    <div><label className="field-label" htmlFor={`r-${c.prefix}`}>Employer pays / paycheck</label><input id={`r-${c.prefix}`} inputMode="decimal" value={p.employer} onChange={(e) => setPlan(c.name, 'employer', e.target.value)} className="field" /></div>
                    <div><label className="field-label" htmlFor={`m-${c.prefix}`}>Member ID</label><input id={`m-${c.prefix}`} value={p.memberId} onChange={(e) => setPlan(c.name, 'memberId', e.target.value)} maxLength={40} className="field" /></div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        {overAca && (
          <div className="flex flex-col gap-3 border-t border-line bg-amber-50 px-6 py-4 text-[14px] text-amber-900 sm:flex-row sm:items-center">
            <span className="flex-1">The employee medical premium of {usd(medical.perCheck)} a paycheck is above the ACA-affordable amount of {usd(acaMax)} for {user.first}’s pay.</span>
            <button type="button" onClick={() => setPlan('Medical', 'perCheck', acaMax)} className="btn-ghost h-9 shrink-0 px-3 text-[13.5px]">Use {usd(acaMax)}</button>
          </div>
        )}
        <p className="border-t border-line px-6 py-4 text-[13.5px] text-slate">Employee premiums are taken before tax (Section 125) on every pay stub posted after you save.</p>
      </Card>

      <Card title={RETIREMENT.plan}>
        <label className="flex items-center gap-3"><input type="checkbox" checked={k.enrolled} onChange={(e) => setK({ ...k, enrolled: e.target.checked })} className="h-4 w-4 accent-bridge-600" /><span className="font-medium">Enrolled in the 401(k)</span></label>
        {k.enrolled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="field-label" htmlFor="k-pct">Contribution rate (% of pay)</label><input id="k-pct" type="number" min="0" max={RETIREMENT.maxPct} value={k.pct} onChange={(e) => setK({ ...k, pct: e.target.value })} className="field" />
              <Chips value={Number(k.pct)} options={[[3, 'Auto-enroll default'], [4, ''], [6, 'Common'], [10, ''], [15, '']]} onPick={(v) => setK({ ...k, pct: v })} />
              <p className="mt-1 text-[12.5px] text-slate">The employee can change this from their portal.</p></div>
            <div><label className="field-label" htmlFor="k-match">Employer match (up to % of pay)</label><input id="k-match" inputMode="decimal" value={k.matchPct} onChange={(e) => setK({ ...k, matchPct: e.target.value })} className="field" />
              <Chips value={Number(k.matchPct)} options={[[3, ''], [RULES.safeHarborMatch, 'Safe harbor'], [6, '']]} onPick={(v) => setK({ ...k, matchPct: v })} /></div>
            <div><label className="field-label" htmlFor="k-type">Contribution type</label><select id="k-type" value={k.roth ? 'roth' : 'trad'} onChange={(e) => setK({ ...k, roth: e.target.value === 'roth' })} className="field"><option value="trad">Traditional (pre-tax)</option><option value="roth">Roth (after-tax)</option></select></div>
            <div><label className="field-label" htmlFor="k-catch">Age for catch-up contributions</label><select id="k-catch" value={k.catchUp} onChange={(e) => setK({ ...k, catchUp: e.target.value })} className="field">{Object.entries(CATCH_UP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <p className="mt-1 text-[12.5px] text-slate">2026 limit: {usd(limit)}{ageCatchUp ? ` · from date of birth: ${CATCH_UP[ageCatchUp]}` : ' · no date of birth on file'}</p></div>
            <div><label className="field-label" htmlFor="k-open">Balance before payroll here ($)</label><input id="k-open" inputMode="decimal" value={k.openingBalance} onChange={(e) => setK({ ...k, openingBalance: e.target.value })} className="field" /></div>
            <div className="text-[14px] text-slate"><p className="field-label">So far in {d.limits.year}</p>Employee {usd(d.stats.contributedYtd)} · match {usd(d.stats.matchYtd)}<br />Balance {usd(d.stats.balance)}</div>
          </div>
        )}
        {overLimit && <div className="mt-4"><Notice tone="amber">At {k.pct}% of about {usd(annualPay)} a year, {user.first} would pass the {usd(limit)} IRS limit. Payroll stops the deduction at the limit, or choose a lower rate.</Notice></div>}
      </Card>

      <Card title="Beneficiaries" action={<button type="button" onClick={() => setBen([...ben, { name: '', relation: '', type: 'Primary', share: 100 }])} className="inline-flex items-center gap-1 text-[14px] text-bridge-700 hover:underline"><Plus size={15} /> Add</button>}>
        <div className="space-y-2">
          {ben.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input aria-label="Name" value={b.name} onChange={(e) => setBenRow(i, 'name', e.target.value)} placeholder="Full name" className="field min-w-[160px] flex-1" />
              <input aria-label="Relationship" value={b.relation} onChange={(e) => setBenRow(i, 'relation', e.target.value)} placeholder="Relationship" className="field w-36" />
              <select aria-label="Type" value={b.type} onChange={(e) => setBenRow(i, 'type', e.target.value)} className="field w-36"><option>Primary</option><option>Contingent</option></select>
              <input aria-label="Share percent" type="number" min="0" max="100" value={b.share} onChange={(e) => setBenRow(i, 'share', e.target.value)} className="field w-24" />
              <button type="button" onClick={() => setBen(ben.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-full text-slate hover:bg-mist" aria-label="Remove beneficiary"><X size={15} /></button>
            </div>
          ))}
          {!ben.length && <p className="text-[14px] text-slate">None on file.</p>}
        </div>
      </Card>

      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <button disabled={busy} className="btn-dark disabled:opacity-60"><Check size={17} /> {busy ? 'Saving…' : 'Approve enrollment'}</button>
    </form>
  )
}

export default function Benefits() {
  const { employees, id, chosen, choose } = useEmployees()
  const data = useApi(id ? `/admin/benefits/${id}` : null)
  return (
    <div className="space-y-6">
      <PageHead title="Benefits" sub="Enroll employees in health plans and the 401(k). What you save here shows in their portal and is deducted on their next pay stub." />
      <EmployeePicker employees={employees} id={id} choose={choose} />
      {id && data.error && <Notice tone="red">{data.error}</Notice>}
      {chosen && data.data && <Form key={id} user={chosen} d={data.data} onSaved={data.reload} />}
      {!id && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Choose an employee to manage their benefits.</p>}
    </div>
  )
}
