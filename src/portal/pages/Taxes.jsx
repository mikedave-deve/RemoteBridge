import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { usd } from '../../data/portal'
import { api, fileUrl } from '../../lib/api'
import { FORM_BOXES, isMoneyBox } from '../../lib/taxForms'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Field, Notice, PageHead } from '../ui'

const FILING = ['Single or married filing separately', 'Married filing jointly', 'Head of household']
const longDay = (d) => (d ? new Date(String(d).length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—')

function W4({ w4, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try {
      const r = await api('/me/taxes/w4', { method: 'PUT', body: { filingStatus: f.get('status'), multipleJobs: f.get('multiple') === 'on', dependents: f.get('dependents'), extra: f.get('extra'), signed: f.get('signed') === 'on' } })
      onSaved(r.w4); setEditing(false); setSaved(true); setErr('')
    } catch (ex) { setErr(ex.message) }
  }
  const v = w4 || { filingStatus: FILING[0], multipleJobs: false, dependents: 0, extra: 0 }
  return (
    <Card title="Federal withholding (Form W-4)" action={!editing && <button onClick={() => { setEditing(true); setSaved(false) }} className="text-[14px] text-bridge-700 hover:underline">{w4 ? 'Update W-4' : 'Submit W-4'}</button>}>
      {saved && <div className="mb-5"><Notice>Your new W-4 was signed and applies from your next paycheck.</Notice></div>}
      {editing ? (
        <form onSubmit={submit} className="space-y-5">
          <div><label className="field-label" htmlFor="w4-status">Step 1(c): Filing status</label>
            <select id="w4-status" name="status" className="field" defaultValue={v.filingStatus}>{FILING.map((x) => <option key={x}>{x}</option>)}</select></div>
          <label className="flex gap-3 text-[14.5px]"><input type="checkbox" name="multiple" defaultChecked={v.multipleJobs} className="mt-1 h-4 w-4 accent-bridge-600" />Step 2: I have more than one job, or my spouse also works</label>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label className="field-label" htmlFor="w4-dep">Step 3: Dependents amount ($)</label><input id="w4-dep" name="dependents" inputMode="numeric" defaultValue={v.dependents} className="field" /></div>
            <div><label className="field-label" htmlFor="w4-extra">Step 4(c): Extra withholding per paycheck ($)</label><input id="w4-extra" name="extra" inputMode="decimal" defaultValue={v.extra} className="field" /></div>
          </div>
          <label className="flex gap-3 text-[14px] text-slate"><input type="checkbox" name="signed" required className="mt-1 h-4 w-4 accent-bridge-600" />Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct and complete.</label>
          {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
          <div className="flex gap-3"><button className="btn-primary">Sign and submit</button><button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button></div>
        </form>
      ) : w4 ? (
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Filing status" value={w4.filingStatus} />
          <Field label="Multiple jobs or working spouse" value={w4.multipleJobs ? 'Yes' : 'No'} />
          <Field label="Dependents amount" value={usd(w4.dependents)} />
          <Field label="Extra withholding per paycheck" value={usd(w4.extra)} />
          <Field label="Last updated" value={longDay(w4.updatedAt)} />
        </dl>
      ) : <p className="text-[14.5px] text-slate">No W-4 on file yet. Submit one so the right amount of federal income tax is withheld from your pay.</p>}
    </Card>
  )
}

export default function Taxes() {
  const { data, error } = useApi('/me/taxes')
  const [pick, setPick] = useState(0)
  const [w4, setW4] = useState(undefined)
  const [electronic, setElectronic] = useState(undefined)
  const forms = data?.forms || []
  const form = forms[Math.min(pick, forms.length - 1)]
  const boxes = form ? FORM_BOXES[form.type].filter(([b]) => form.boxes[b] !== undefined) : []
  const consent = electronic ?? data?.electronic ?? true
  const state = data?.state

  const setConsent = async (v) => { setElectronic(v); try { await api('/me/taxes/consent', { method: 'PUT', body: { electronic: v } }) } catch { setElectronic(!v) } }

  return (
    <div className="space-y-6">
      <PageHead title="Tax forms" sub="Year-end forms and the withholding elections PremierRemoteBridge uses to calculate your paycheck." />
      {error && <Notice tone="red">{error}</Notice>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title={form ? `Form ${form.type}, ${form.year}` : 'Form W-2'}
          action={form && <a href={fileUrl(`/me/taxes/${form.id}/pdf`)} download className="inline-flex items-center gap-1.5 text-[14px] text-bridge-700 hover:underline"><Download size={15} /> Download PDF</a>}>
          {!data && !error && <p className="text-slate">Loading…</p>}
          {data && !form && <p className="text-[14.5px] text-slate">No tax forms yet. Your W-2 will appear here as soon as payroll issues it, no later than January 31.</p>}
          {form && <>
            <p className="text-[14px] text-slate">Issued {longDay(form.issued)} by {form.employer}{form.ein ? ` (EIN ${form.ein})` : ''}.
              {form.hasFile && <> <a href={fileUrl(`/me/taxes/${form.id}/file`)} download className="text-bridge-700 hover:underline">Download the original copy</a>.</>}</p>
            <dl className="mt-5 grid gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-2">
              {boxes.map(([b, l]) => (
                <div key={b} className="flex items-center justify-between gap-4 bg-white px-4 py-3">
                  <dt className="text-[13.5px] text-slate"><span className="mr-2 inline-block min-w-[34px] rounded bg-mist px-1.5 py-0.5 text-center text-[12px] font-semibold text-ink">{b}</span>{l}</dt>
                  <dd className="text-[14.5px] tabular-nums text-ink">{isMoneyBox(form.type, b) && !Number.isNaN(Number(form.boxes[b])) ? usd(Number(form.boxes[b])) : form.boxes[b]}</dd>
                </div>
              ))}
            </dl>
          </>}
        </Card>

        <div className="space-y-6">
          <Card title="Your year-end forms" pad={false}>
            <ul className="divide-y divide-line text-[14.5px]">
              {forms.map((f, i) => (
                <li key={f.id}>
                  <button onClick={() => setPick(i)} className={`flex w-full items-center gap-3 px-6 py-4 text-left ${f === form ? 'bg-bridge-50' : 'hover:bg-paper'}`}>
                    <FileText size={18} className="text-bridge-700" />
                    <span className="flex-1"><span className="block font-medium">Form {f.type}, {f.year}</span><span className="text-[13px] text-slate">Issued {longDay(f.issued)}</span></span>
                    <Badge tone="green">Available</Badge>
                  </button>
                </li>
              ))}
              {data && !forms.length && <li className="px-6 py-4 text-slate">None yet.</li>}
            </ul>
          </Card>
          <Card title="Electronic delivery">
            <label className="flex items-start gap-3 text-[14.5px]">
              <input type="checkbox" checked={consent} disabled={!data} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-bridge-600" />
              <span>I consent to receive my W-2 and 1095-C electronically instead of on paper. I can withdraw this consent at any time.</span>
            </label>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data ? <W4 w4={w4 === undefined ? data.w4 : w4} onSaved={setW4} /> : <Card title="Federal withholding (Form W-4)"><p className="text-slate">Loading…</p></Card>}

        <Card title="State and local withholding">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="State form" value={state?.form || 'Not on file yet'} />
            <Field label="Exemptions claimed" value={state?.exemptions || '—'} />
            <Field label="Work location" value={[data?.workCity, data?.workState].filter(Boolean).join(', ') || 'Not set yet'} />
            <Field label="Municipal tax" value={state?.localTax || 'None on file'} />
            <Field label="School district" value={state?.schoolDistrict || 'None on file'} />
            <Field label="Last updated" value={state ? longDay(state.updatedAt) : '—'} />
          </dl>
          <p className="mt-5 text-[13.5px] text-slate">Moved or started working from a different address? Update your home address in Profile so the right state and local taxes are withheld.</p>
        </Card>
      </div>
    </div>
  )
}
