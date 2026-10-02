import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { benefits, employee, payStubs, usd } from '../../data/portal'
import { Badge, Card, Field, Notice, PageHead, Table } from '../ui'

export default function Benefits() {
  const r = benefits.retirement
  const [pct, setPct] = useState(r.contribution)
  const [saved, setSaved] = useState(false)
  const perCheck = payStubs[0].gross * (pct / 100)
  const annual = employee.rate * 2080 * (pct / 100)
  const overLimit = annual > r.limit

  return (
    <div className="space-y-6">
      <PageHead title="Benefits" sub="Your 2026 coverage, what it costs per paycheck and what PremierRemoteBridge pays toward it." />

      <div className="flex items-start gap-3 rounded-2xl bg-bridge-950 p-5 text-white sm:items-center">
        <CalendarClock size={22} className="shrink-0 text-bridge-200" />
        <p className="text-[15px]">{benefits.enrollmentWindow} Outside that window, you can change coverage within 30 days of a qualifying life event such as marriage, birth or adoption, or loss of other coverage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {benefits.plans.map((p) => (
          <div key={p.name} className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[13.5px] text-slate">{p.name}</p><p className="mt-1 text-[17px] font-semibold">{p.plan}</p></div>
              <Badge tone="green">Enrolled</Badge>
            </div>
            <ul className="mt-4 space-y-1.5 text-[14px] text-slate">{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
            <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13.5px]">
              <div><dt className="text-slate">You pay</dt><dd className="font-medium tabular-nums">{p.perCheck ? `${usd(p.perCheck)} / paycheck` : 'Nothing'}</dd></div>
              <div><dt className="text-slate">Employer pays</dt><dd className="font-medium tabular-nums">{usd(p.employer)} / paycheck</dd></div>
              <div className="col-span-2"><dt className="text-slate">Coverage · Member ID</dt><dd>{p.tier} · {p.id}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={r.plan}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Current balance" value={usd(r.balance)} />
            <Field label="Contribution type" value={r.type} />
            <Field label="Employer match" value={r.match} />
            <Field label="Vesting" value={r.vesting} />
          </dl>
          <form onSubmit={(e) => { e.preventDefault(); if (!overLimit) setSaved(true) }} className="mt-6 space-y-4 border-t border-line pt-6">
            <label htmlFor="k401" className="field-label">Contribution rate: {pct}% of pay</label>
            <input id="k401" type="range" min="0" max="50" value={pct} onChange={(e) => { setPct(Number(e.target.value)); setSaved(false) }} className="w-full accent-bridge-600" />
            <p className="text-[14px] text-slate">About {usd(perCheck)} per paycheck, or {usd(annual)} a year. {pct < 4 ? 'Contribute at least 4% to receive the full employer match.' : 'You are receiving the full employer match.'}</p>
            {overLimit && <p role="alert" className="text-[14px] text-red-700">That would exceed the 2026 IRS limit of {usd(r.limit)} for employee contributions.</p>}
            {saved && <Notice>Your new contribution rate starts with the October 16 paycheck.</Notice>}
            <button className="btn-primary" disabled={overLimit}>Save contribution</button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="Beneficiaries" pad={false}>
            <Table head={['Name', 'Relationship', 'Type', 'Share']} align={['', '', '', 'r']} rows={benefits.beneficiaries.map((b) => [b.name, b.relation, b.type, `${b.share}%`])} />
            <p className="border-t border-line px-6 py-4 text-[13.5px] text-slate">Applies to your 401(k) and life insurance. Review after major life events.</p>
          </Card>
          <Card title="Life events and continuation coverage">
            <ul className="space-y-3 text-[14.5px] text-slate">
              <li><strong className="font-medium text-ink">Report a life event:</strong> marriage, divorce, birth, adoption, or a change in other coverage. You have 30 days to update your elections.</li>
              <li><strong className="font-medium text-ink">COBRA:</strong> if your employment ends, you and covered family members can keep your medical, dental and vision plans for up to 18 months at group rates.</li>
              <li><strong className="font-medium text-ink">Summary Plan Descriptions</strong> and the Summary of Benefits and Coverage are in Documents.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
