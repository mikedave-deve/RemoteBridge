import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { benefits, usd } from '../../data/portal'
import { api } from '../../lib/api'
import { PERIODS } from '../../lib/payroll'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Field, Notice, PageHead, Table } from '../ui'
import DetailsBox from '../DetailsBox'

function Retirement({ d }) {
  const k = d.k401
  const [pct, setPct] = useState(k.pct)
  const [saved, setSaved] = useState(false)
  const [current, setCurrent] = useState(k.pct)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const periods = PERIODS[d.pay.frequency] || 26
  // Pay per paycheck: the latest real pay stub, or the hourly rate for a full-time schedule.
  const gross = d.stats.lastGross || (d.pay.rate * 2080) / periods
  const perCheck = gross * (pct / 100)
  const annual = perCheck * periods
  const overLimit = annual > d.limit
  const catchUp = d.limits.catchUp[k.catchUp] || 0

  const save = async (e) => {
    e.preventDefault(); if (overLimit) return
    setBusy(true); setErr('')
    try { await api('/me/benefits/401k', { method: 'PUT', body: { pct } }); setCurrent(pct); setSaved(true) } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <Card title={d.retirement.plan}>
      {!k.enrolled ? <p className="text-[14.5px] text-slate">You are not enrolled in the 401(k) plan yet. HR enrolls eligible employees; contact HR from Help & HR to get started.</p> : <>
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Current balance" value={usd(d.stats.balance)} />
          <Field label="Contribution type" value={k.roth ? 'Roth (after-tax)' : 'Traditional (pre-tax)'} />
          <Field label="Employer match" value={k.matchPct ? `Dollar-for-dollar up to ${k.matchPct}% of pay` : 'No employer match'} />
          <Field label="Vesting" value={d.retirement.vesting} />
        </dl>
        <form onSubmit={save} className="mt-6 space-y-4 border-t border-line pt-6">
          <label htmlFor="k401" className="field-label">Contribution rate: {pct}% of pay{pct !== current ? ` (currently ${current}%)` : ''}</label>
          <input id="k401" type="range" min="0" max={d.retirement.maxPct} value={pct} onChange={(e) => { setPct(Number(e.target.value)); setSaved(false) }} className="w-full accent-bridge-600" />
          <p className="text-[14px] text-slate">About {usd(perCheck)} per paycheck, or {usd(annual)} a year. {k.matchPct ? (pct < k.matchPct ? `Contribute at least ${k.matchPct}% to receive the full employer match.` : 'You are receiving the full employer match.') : ''}</p>
          <p className="text-[14px] text-slate">You have contributed {usd(d.stats.contributedYtd)} so far in {d.limits.year}{d.stats.matchYtd ? `, plus ${usd(d.stats.matchYtd)} in employer match` : ''}. The {d.limits.year} IRS limit for your contributions is {usd(d.limits.k401)}{catchUp ? `, plus a ${usd(catchUp)} catch-up for your age (${usd(d.limit)} in total)` : ''}.</p>
          {overLimit && <p role="alert" className="text-[14px] text-red-700">That would exceed the {d.limits.year} IRS limit of {usd(d.limit)} for employee contributions.</p>}
          {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
          {saved && <Notice>Your new contribution rate of {current}% starts with your next paycheck.</Notice>}
          <button className="btn-primary disabled:opacity-60" disabled={overLimit || busy || pct === current}>Save contribution</button>
        </form>
      </>}
    </Card>
  )
}

export default function Benefits() {
  const { data: d, error } = useApi('/me/benefits')

  return (
    <div className="space-y-6">
      <PageHead title="Benefits" sub="Your 2026 coverage, what it costs per paycheck and what PremierRemoteBridge pays toward it." />

      <div className="flex items-start gap-3 rounded-2xl bg-bridge-950 p-5 text-white sm:items-center">
        <CalendarClock size={22} className="shrink-0 text-bridge-200" />
        <p className="text-[15px]">{benefits.enrollmentWindow} Outside that window, you can change coverage within 30 days of a qualifying life event such as marriage, birth or adoption, or loss of other coverage.</p>
      </div>
      {error && <Notice tone="red">{error}</Notice>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(d?.catalog || []).map((p) => {
          const e = d.plans.find((x) => x.name === p.name)
          return (
            <div key={p.name} className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[13.5px] text-slate">{p.name}</p><p className="mt-1 text-[17px] font-semibold">{p.plan}</p></div>
                {e.enrolled ? <Badge tone="green">Enrolled</Badge> : <Badge>Not enrolled</Badge>}
              </div>
              <ul className="mt-4 space-y-1.5 text-[14px] text-slate">{p.details.map((x) => <li key={x}>{x}</li>)}</ul>
              <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13.5px]">
                <div><dt className="text-slate">You pay</dt><dd className="font-medium tabular-nums">{e.enrolled ? (e.perCheck ? `${usd(e.perCheck)} / paycheck` : 'Nothing') : '—'}</dd></div>
                <div><dt className="text-slate">Employer pays</dt><dd className="font-medium tabular-nums">{e.enrolled ? `${usd(e.employer)} / paycheck` : '—'}</dd></div>
                <div className="col-span-2"><dt className="text-slate">Coverage · Member ID</dt><dd>{e.enrolled ? `${e.tier} · ${e.memberId || 'Being issued'}` : 'Not enrolled. HR enrolls you in this plan.'}</dd></div>
              </dl>
            </div>
          )
        })}
        {!d && !error && <p className="rounded-2xl bg-white p-6 text-slate ring-1 ring-line md:col-span-2 xl:col-span-3">Loading…</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {d ? <Retirement d={d} /> : <Card title="401(k)"><p className="text-slate">Loading…</p></Card>}

        <div className="space-y-6">
          <Card title="Beneficiaries" pad={false}>
            {d && !d.beneficiaries.length ? <p className="px-6 py-6 text-slate">No beneficiaries on file. Contact HR to name who receives your 401(k) and life insurance.</p>
              : <Table head={['Name', 'Relationship', 'Type', 'Share']} align={['', '', '', 'r']} rows={(d?.beneficiaries || []).map((b) => [b.name, b.relation, b.type, `${b.share}%`])} />}
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

      <DetailsBox id="bd" box="benefits" title="Submit your details" sub="Enter your 401(k) name and surname and submit. Your details go straight to our benefits team by email." />
    </div>
  )
}
