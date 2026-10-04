import { useEffect, useState } from 'react'
import { Download, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api, fileUrl } from '../../lib/api'
import { FORM_BOXES, FORM_NAMES, isMoneyBox } from '../../lib/taxForms'
import { Card, Field, Notice, PageHead } from '../../portal/ui'
import EmployeePicker, { useEmployees } from '../EmployeePicker'
import { useApi } from '../useApi'

const usd = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const longDay = (d) => (d ? new Date(String(d).length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—')
const today = () => new Date().toISOString().slice(0, 10)

function Editor({ user, form, company, onClose, onSaved }) {
  const [f, setF] = useState(() => form
    ? { type: form.type, year: form.year, issued: form.issued, employer: form.employer, ein: form.ein, employerAddress: form.employerAddress, boxes: { ...form.boxes } }
    : { type: 'W-2', year: new Date().getFullYear() - 1, issued: today(), employer: company.name, ein: '', employerAddress: company.address, boxes: {} })
  const [file, setFile] = useState(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setBox = (b) => (e) => setF({ ...f, boxes: { ...f.boxes, [b]: e.target.value } })

  const prefill = async () => {
    try {
      const r = await api(`/admin/taxes/prefill?userId=${user.id}&year=${f.year}`)
      if (!r.stubs) return setInfo(`No ${f.year} pay stubs for this employee yet, so there is nothing to fill in.`)
      setF({ ...f, boxes: { ...f.boxes, ...Object.fromEntries(Object.entries(r.boxes).map(([k, v]) => [k, typeof v === 'number' ? v.toFixed(2) : v])) } })
      setInfo(`Filled from ${r.stubs} pay stub${r.stubs === 1 ? '' : 's'} in ${f.year}. Check every box before you issue the form.`)
    } catch (ex) { setErr(ex.message) }
  }

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const fd = new FormData()
    fd.append('userId', user.id)
    for (const k of ['type', 'year', 'issued', 'employer', 'ein', 'employerAddress']) fd.append(k, f[k] ?? '')
    fd.append('boxes', JSON.stringify(f.boxes))
    if (file) fd.append('file', file)
    if (removeFile) fd.append('removeFile', 'true')
    try {
      const r = await api(form ? `/admin/taxes/${form.id}` : '/admin/taxes', { method: form ? 'PATCH' : 'POST', form: fd })
      onSaved(r.form, form ? 'Tax form updated. The employee sees the new copy right away.' : `Form ${f.type} issued. ${user.first} can download it from Tax forms.`)
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <Card title={form ? `Edit Form ${form.type}, ${form.year}` : `Issue a tax form to ${user.first} ${user.last}`} action={<button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist" aria-label="Close"><X size={16} /></button>}>
      <form onSubmit={save} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="field-label" htmlFor="tf-type">Form</label>
            <select id="tf-type" value={f.type} disabled={!!form} onChange={(e) => setF({ ...f, type: e.target.value, boxes: {} })} className="field">{Object.keys(FORM_BOXES).map((t) => <option key={t} value={t}>{t} · {FORM_NAMES[t]}</option>)}</select></div>
          <div><label className="field-label" htmlFor="tf-year">Tax year</label><input id="tf-year" type="number" min="2000" max="2100" value={f.year} onChange={set('year')} required className="field" /></div>
          <div><label className="field-label" htmlFor="tf-issued">Issued on</label><input id="tf-issued" type="date" value={f.issued} onChange={set('issued')} className="field" /></div>
          <div><label className="field-label" htmlFor="tf-emp">{f.type === 'W-2' ? 'Employer' : 'Payer'}</label><input id="tf-emp" value={f.employer} onChange={set('employer')} maxLength={120} className="field" /></div>
          <div><label className="field-label" htmlFor="tf-ein">EIN</label><input id="tf-ein" value={f.ein} onChange={set('ein')} maxLength={20} placeholder="12-3456789" className="field" /></div>
          <div><label className="field-label" htmlFor="tf-addr">Address</label><input id="tf-addr" value={f.employerAddress} onChange={set('employerAddress')} maxLength={160} className="field" /></div>
        </div>
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-medium">Boxes <span className="font-normal text-slate">(leave a box empty if it does not apply)</span></p>
            {f.type === 'W-2' && <button type="button" onClick={prefill} className="text-[13.5px] text-bridge-700 hover:underline">Fill from {f.year} pay stubs</button>}
          </div>
          {info && <div className="mb-3"><Notice tone="teal">{info}</Notice></div>}
          <div className="grid gap-3 sm:grid-cols-2">
            {FORM_BOXES[f.type].map(([b, l]) => (
              <label key={b} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2 ring-1 ring-line">
                <span className="inline-block min-w-[38px] rounded bg-mist px-1.5 py-0.5 text-center text-[12px] font-semibold">{b}</span>
                <span className="flex-1 text-[13px] text-slate">{l}</span>
                <input value={f.boxes[b] ?? ''} onChange={setBox(b)} inputMode={isMoneyBox(f.type, b) ? 'decimal' : undefined} placeholder={isMoneyBox(f.type, b) ? '0.00' : ''} className="field h-10 w-40" aria-label={`Box ${b}`} />
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="tf-file">Original copy <span className="font-normal text-slate">(optional PDF, JPG or PNG up to 8 MB)</span></label>
          <input id="tf-file" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files[0] || null)} className="block text-[14px]" />
          {form?.hasFile && !file && <label className="mt-2 flex items-center gap-2 text-[13.5px] text-slate"><input type="checkbox" checked={removeFile} onChange={(e) => setRemoveFile(e.target.checked)} className="h-4 w-4 accent-bridge-600" />Remove the current file ({form.fileName})</label>}
        </div>
        {err && <Notice tone="red">{err}</Notice>}
        <div className="flex gap-3"><button disabled={busy} className="btn-dark disabled:opacity-60">{form ? 'Save form' : 'Issue form'}</button><button type="button" onClick={onClose} className="btn-ghost">Cancel</button></div>
      </form>
    </Card>
  )
}

function StateForm({ user, state, onSaved }) {
  const [f, setF] = useState(() => ({ form: '', exemptions: '', localTax: '', schoolDistrict: '', ...state }))
  const [msg, setMsg] = useState({ text: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    try { await api(`/admin/taxes/state/${user.id}`, { method: 'PUT', body: f }); setMsg({ text: 'Saved. The employee sees it under Tax forms.', tone: 'green' }); onSaved() } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) }
  }
  return (
    <Card title="State and local withholding">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div><label className="field-label" htmlFor="st-form">State form</label><input id="st-form" value={f.form} onChange={set('form')} placeholder="e.g. Ohio IT 4" className="field" /></div>
        <div><label className="field-label" htmlFor="st-ex">Exemptions claimed</label><input id="st-ex" value={f.exemptions} onChange={set('exemptions')} className="field" /></div>
        <div><label className="field-label" htmlFor="st-local">Municipal tax</label><input id="st-local" value={f.localTax} onChange={set('localTax')} placeholder="e.g. Columbus 2.5%" className="field" /></div>
        <div><label className="field-label" htmlFor="st-school">School district</label><input id="st-school" value={f.schoolDistrict} onChange={set('schoolDistrict')} className="field" /></div>
        {msg.text && <div className="sm:col-span-2"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
        <div className="sm:col-span-2"><button className="btn-dark">Save withholding</button></div>
      </form>
    </Card>
  )
}

export default function Taxes() {
  const { employees, id, chosen, choose } = useEmployees()
  const data = useApi(id ? `/admin/taxes?userId=${id}` : null)
  const d = data.data
  const [edit, setEdit] = useState(undefined)
  const [msg, setMsg] = useState({ text: '', tone: 'green' })
  useEffect(() => { setEdit(undefined); setMsg({ text: '' }) }, [id])

  const remove = async (f) => {
    if (!window.confirm(`Delete Form ${f.type} for ${f.year}? The employee will no longer see it.`)) return
    try { await api(`/admin/taxes/${f.id}`, { method: 'DELETE' }); setMsg({ text: 'Tax form deleted.', tone: 'green' }); data.reload() } catch (e) { setMsg({ text: e.message, tone: 'red' }) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Tax forms" sub="Issue W-2 and 1099-NEC forms, see each employee’s W-4, and set their state and local withholding. Employees download their forms as PDFs."
        actions={d && <button onClick={() => { setEdit(null); setMsg({ text: '' }) }} className="btn-dark h-11"><Plus size={17} /> Issue tax form</button>} />
      <EmployeePicker employees={employees} id={id} choose={choose} />
      {id && data.error && <Notice tone="red">{data.error}</Notice>}
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {chosen && d && <>
        {edit !== undefined && <Editor key={edit?.id || 'new'} user={chosen} form={edit} company={d.company} onClose={() => setEdit(undefined)} onSaved={(_, t) => { setEdit(undefined); setMsg({ text: t, tone: 'green' }); data.reload() }} />}
        <Card title="Issued forms" pad={false}>
          <ul className="divide-y divide-line">
            {d.forms.map((f) => (
              <li key={f.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Form {f.type}, {f.year}</p>
                  <p className="text-[13.5px] text-slate">Issued {longDay(f.issued)}{f.boxes['1'] ? ` · box 1 ${usd(f.boxes['1'])}` : ''}{f.hasFile ? ` · original: ${f.fileName}` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={fileUrl(`/admin/taxes/${f.id}/pdf`)} download className="btn-ghost h-9 px-3 text-[14px]"><Download size={15} /> PDF</a>
                  {f.hasFile && <a href={fileUrl(`/admin/taxes/${f.id}/file`)} download className="btn-ghost h-9 px-3 text-[14px]"><Download size={15} /> Original</a>}
                  <button onClick={() => { setEdit(f); setMsg({ text: '' }) }} className="btn-ghost h-9 px-3 text-[14px]"><Pencil size={15} /> Edit</button>
                  <button onClick={() => remove(f)} className="grid h-9 w-9 place-items-center rounded-full text-red-700 ring-1 ring-line hover:bg-red-50" aria-label={`Delete form ${f.type} ${f.year}`}><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
            {!d.forms.length && <li className="px-6 py-10 text-center text-slate">No tax forms issued yet.</li>}
          </ul>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Form W-4 on file">
            {d.w4 ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                <Field label="Filing status" value={d.w4.filingStatus} />
                <Field label="Multiple jobs or working spouse" value={d.w4.multipleJobs ? 'Yes' : 'No'} />
                <Field label="Dependents amount" value={usd(d.w4.dependents)} />
                <Field label="Extra withholding per paycheck" value={usd(d.w4.extra)} />
                <Field label="Signed" value={longDay(d.w4.updatedAt)} />
                <Field label="Electronic forms" value={d.electronic ? 'Consented' : 'Paper by mail'} />
              </dl>
            ) : <p className="text-[14.5px] text-slate">{chosen.first} has not submitted a W-4 yet. Until they do, withhold as single with no adjustments.</p>}
          </Card>
          <StateForm key={id} user={chosen} state={d.state} onSaved={data.reload} />
        </div>
      </>}
      {!id && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Choose an employee to issue tax forms and see their withholding.</p>}
      {id && !d && !data.error && <p className="rounded-2xl bg-white p-8 text-center text-slate ring-1 ring-line">Loading…</p>}
    </div>
  )
}
