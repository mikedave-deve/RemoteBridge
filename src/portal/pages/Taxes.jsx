import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { stateW4, usd, w2s, w4 } from '../../data/portal'
import { Badge, Card, Field, Notice, PageHead } from '../ui'

export default function Taxes() {
  const w2 = w2s[0]
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [electronic, setElectronic] = useState(true)
  const boxes = [
    ['1', 'Wages, tips, other compensation', w2.box1], ['2', 'Federal income tax withheld', w2.box2],
    ['3', 'Social Security wages', w2.box3], ['4', 'Social Security tax withheld', w2.box4],
    ['5', 'Medicare wages and tips', w2.box5], ['6', 'Medicare tax withheld', w2.box6],
    ['12 D', 'Elective deferrals to a 401(k)', w2.box12d], ['15', 'State · Employer state ID', 'OH · 51-***2207'], ['16', 'State wages (OH)', w2.box16],
    ['17', 'State income tax (OH)', w2.box17], ['18', 'Local wages (Columbus)', w2.box18], ['19', 'Local income tax', w2.box19],
  ]

  return (
    <div className="space-y-6">
      <PageHead title="Tax forms" sub="Year-end forms and the withholding elections RemoteBridge uses to calculate your paycheck." />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title={`Form W-2, ${w2.year}`} action={<button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-[14px] text-bridge-700 hover:underline"><Download size={15} /> Download PDF</button>}>
          <p className="text-[14px] text-slate">Issued {w2.issued} by {w2.employer} (EIN {w2.ein}). Covers March 10 – December 31, 2025.</p>
          <dl className="mt-5 grid gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-2">
            {boxes.map(([b, l, v]) => (
              <div key={b} className="flex items-center justify-between gap-4 bg-white px-4 py-3">
                <dt className="text-[13.5px] text-slate"><span className="mr-2 inline-block min-w-[34px] rounded bg-mist px-1.5 py-0.5 text-center text-[12px] font-semibold text-ink">{b}</span>{l}</dt>
                <dd className="text-[14.5px] tabular-nums text-ink">{typeof v === 'number' ? usd(v) : v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card title="Other year-end forms" pad={false}>
            <ul className="divide-y divide-line text-[14.5px]">
              {[['Form 1095-C, 2025', 'Employer-provided health coverage'], ['2026 W-2', 'Available by January 31, 2027']].map(([n, d], i) => (
                <li key={n} className="flex items-center gap-3 px-6 py-4">
                  <FileText size={18} className="text-bridge-700" />
                  <span className="flex-1"><span className="block font-medium">{n}</span><span className="text-[13px] text-slate">{d}</span></span>
                  {i === 0 ? <Badge tone="green">Available</Badge> : <Badge>Upcoming</Badge>}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Electronic delivery">
            <label className="flex items-start gap-3 text-[14.5px]">
              <input type="checkbox" checked={electronic} onChange={(e) => setElectronic(e.target.checked)} className="mt-1 h-4 w-4 accent-bridge-600" />
              <span>I consent to receive my W-2 and 1095-C electronically instead of on paper. I can withdraw this consent at any time.</span>
            </label>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Federal withholding (Form W-4)" action={!editing && <button onClick={() => { setEditing(true); setSaved(false) }} className="text-[14px] text-bridge-700 hover:underline">Update W-4</button>}>
          {saved && <div className="mb-5"><Notice>Your new W-4 was signed and will apply from the next payroll on October 16.</Notice></div>}
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); setEditing(false); setSaved(true) }} className="space-y-5">
              <div><label className="field-label" htmlFor="w4-status">Step 1(c): Filing status</label>
                <select id="w4-status" className="field" defaultValue={w4.filingStatus}><option>Single or married filing separately</option><option>Married filing jointly</option><option>Head of household</option></select></div>
              <label className="flex gap-3 text-[14.5px]"><input type="checkbox" defaultChecked={w4.multipleJobs} className="mt-1 h-4 w-4 accent-bridge-600" />Step 2: I have more than one job, or my spouse also works</label>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="field-label" htmlFor="w4-dep">Step 3: Dependents amount ($)</label><input id="w4-dep" inputMode="numeric" defaultValue={w4.dependents} className="field" /></div>
                <div><label className="field-label" htmlFor="w4-extra">Step 4(c): Extra withholding per paycheck ($)</label><input id="w4-extra" inputMode="decimal" defaultValue={w4.extra} className="field" /></div>
              </div>
              <label className="flex gap-3 text-[14px] text-slate"><input type="checkbox" required className="mt-1 h-4 w-4 accent-bridge-600" />Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct and complete.</label>
              <div className="flex gap-3"><button className="btn-primary">Sign and submit</button><button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button></div>
            </form>
          ) : (
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Filing status" value={w4.filingStatus} />
              <Field label="Multiple jobs or working spouse" value={w4.multipleJobs ? 'Yes' : 'No'} />
              <Field label="Dependents amount" value={usd(w4.dependents)} />
              <Field label="Extra withholding per paycheck" value={usd(w4.extra)} />
              <Field label="Last updated" value={w4.updated} />
            </dl>
          )}
        </Card>

        <Card title="State and local withholding">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="State form" value={stateW4.form} />
            <Field label="Exemptions claimed" value={stateW4.exemptions} />
            <Field label="Work location" value="Columbus, Ohio" />
            <Field label="Municipal tax" value="Columbus 2.5% (withheld each paycheck)" />
            <Field label="School district" value="None on file" />
            <Field label="Last updated" value={stateW4.updated} />
          </dl>
          <p className="mt-5 text-[13.5px] text-slate">Moved or started working from a different address? Update your home address in Profile so the right state and local taxes are withheld.</p>
        </Card>
      </div>
    </div>
  )
}
