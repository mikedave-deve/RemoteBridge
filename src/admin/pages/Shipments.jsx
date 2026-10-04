import { useState } from 'react'
import { Pause, Pencil, Play, Plus, Printer, Trash2, Truck, X } from 'lucide-react'
import { api, fileUrl } from '../../lib/api'
import { site, useSite } from '../../lib/siteData'
import { SHIP_SERVICES, SHIP_STEPS } from '../../lib/support'
import { Badge, Card, Notice, PageHead } from '../../portal/ui'
import { useEmployees } from '../EmployeePicker'
import { useApi, when } from '../useApi'

const WINDOWS = ['by 10:30 A.M.', 'by 12:00 P.M.', 'by 3:00 P.M.', 'by 7:00 P.M.', 'by End of Day']
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const fmtDay = (k) => (k ? new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—')
const blankAddr = { name: '', company: '', street: '', street2: '', city: '', state: '', zip: '', country: 'US', phone: '' }

/** "88 High St, Columbus, OH 43215" → street, city, state, ZIP. */
function parseAddress(text = '') {
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean)
  const m = (parts[parts.length - 1] || '').match(/^([A-Za-z .]+?)\s+(\d{5}(?:-\d{4})?)$/)
  if (parts.length >= 3 && m) return { street: parts.slice(0, -2).join(', '), city: parts[parts.length - 2], state: m[1], zip: m[2] }
  return { street: text }
}

function AddressFields({ id, label, a, onChange }) {
  const set = (k) => (e) => onChange({ ...a, [k]: e.target.value })
  const f = (k, l, cls = '', extra = {}) => <div className={cls}><label className="field-label" htmlFor={`${id}-${k}`}>{l}</label><input id={`${id}-${k}`} value={a[k] || ''} onChange={set(k)} className="field" {...extra} /></div>
  return (
    <fieldset className="grid gap-3 rounded-xl bg-paper p-4 ring-1 ring-line sm:grid-cols-12">
      <legend className="px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate">{label}</legend>
      {f('name', 'Name', 'sm:col-span-6', { maxLength: 80 })}
      {f('company', 'Company (optional)', 'sm:col-span-6', { maxLength: 80 })}
      {f('street', 'Street address', 'sm:col-span-8', { maxLength: 120 })}
      {f('street2', 'Apt, suite', 'sm:col-span-4', { maxLength: 120 })}
      {f('city', 'City', 'sm:col-span-5', { maxLength: 60 })}
      {f('state', 'State', 'sm:col-span-3', { maxLength: 40 })}
      {f('zip', 'ZIP', 'sm:col-span-4', { maxLength: 12, inputMode: 'numeric' })}
      {f('country', 'Country', 'sm:col-span-4', { maxLength: 40 })}
      {f('phone', 'Phone', 'sm:col-span-8', { maxLength: 20 })}
    </fieldset>
  )
}

function Editor({ shipment, employees, onClose, onSaved }) {
  useSite()
  const [f, setF] = useState(() => shipment ? { ...shipment, userId: shipment.employee?.id || '' } : {
    userId: '', tracking: '', reference: '', carrier: 'PremierRemoteBridge Logistics', service: 'Ground', contents: '', shipDate: today(), eta: plusDays(5), window: 'by 7:00 P.M.',
    weight: '', weightUnit: 'lbs', dims: { l: '', w: '', h: '', unit: 'in' }, packages: 1,
    from: { ...blankAddr, name: 'PremierRemoteBridge IT', company: 'PremierRemoteBridge, Inc.', ...parseAddress(site.address) }, to: { ...blankAddr },
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pick = (id) => {
    const u = employees.find((x) => x.id === id)
    setF({ ...f, userId: id, ...(u && { to: { ...blankAddr, name: `${u.first} ${u.last}`, phone: u.phone || '', ...parseAddress(u.profile?.address) } }) })
  }
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const r = shipment ? await api(`/admin/shipments/${shipment.id}`, { method: 'PATCH', body: f }) : await api('/admin/shipments', { method: 'POST', body: f })
      onSaved(r.shipment, shipment ? 'Shipment updated. The employee’s tracking page shows the change right away.' : `Label created. Tracking number ${r.shipment.tracking}.`)
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  return (
    <Card title={shipment ? `Edit shipment ${shipment.tracking}` : 'Create a shipping label'} action={<button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-mist" aria-label="Close"><X size={16} /></button>}>
      <form onSubmit={save} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2"><label className="field-label" htmlFor="sh-user">Employee</label>
            <select id="sh-user" value={f.userId} onChange={(e) => pick(e.target.value)} disabled={!!shipment} required className="field">
              <option value="">Choose an employee</option>
              {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}{u.employeeId ? ` · ${u.employeeId}` : ''}</option>)}
            </select></div>
          <div className="sm:col-span-2"><label className="field-label" htmlFor="sh-contents">Contents</label><input id="sh-contents" value={f.contents} onChange={set('contents')} maxLength={160} placeholder="e.g. Dell laptop and charger" className="field" /></div>
          <div><label className="field-label" htmlFor="sh-trk">Tracking number</label><input id="sh-trk" value={f.tracking} onChange={set('tracking')} maxLength={40} placeholder="Blank = create one" className="field uppercase placeholder:normal-case" /></div>
          <div><label className="field-label" htmlFor="sh-ref">Reference number</label><input id="sh-ref" value={f.reference} onChange={set('reference')} maxLength={40} className="field" /></div>
          <div><label className="field-label" htmlFor="sh-svc">Service</label><select id="sh-svc" value={f.service} onChange={set('service')} className="field">{SHIP_SERVICES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="field-label" htmlFor="sh-car">Carrier</label><input id="sh-car" value={f.carrier} onChange={set('carrier')} maxLength={60} className="field" /></div>
          <div><label className="field-label" htmlFor="sh-ship">Ship date</label><input id="sh-ship" type="date" value={f.shipDate} onChange={set('shipDate')} className="field" /></div>
          <div><label className="field-label" htmlFor="sh-eta">Estimated delivery</label><input id="sh-eta" type="date" value={f.eta} onChange={set('eta')} className="field" /></div>
          <div><label className="field-label" htmlFor="sh-win">Delivery time</label><select id="sh-win" value={f.window} onChange={set('window')} className="field"><option value="">No time window</option>{WINDOWS.map((w) => <option key={w}>{w}</option>)}</select></div>
          <div><label className="field-label" htmlFor="sh-pk">Packages</label><input id="sh-pk" type="number" min="1" max="99" value={f.packages} onChange={set('packages')} className="field" /></div>
          <div><label className="field-label" htmlFor="sh-wt">Weight</label>
            <div className="flex gap-2"><input id="sh-wt" inputMode="decimal" value={f.weight} onChange={set('weight')} required className="field" /><select aria-label="Weight unit" value={f.weightUnit} onChange={set('weightUnit')} className="field w-24"><option value="lbs">lbs</option><option value="kgs">kgs</option></select></div></div>
          <div className="sm:col-span-2 lg:col-span-3"><label className="field-label" htmlFor="sh-l">Dimensions (L × W × H)</label>
            <div className="flex gap-2">{['l', 'w', 'h'].map((k) => <input key={k} id={k === 'l' ? 'sh-l' : undefined} aria-label={k.toUpperCase()} inputMode="decimal" value={f.dims[k]} onChange={(e) => setF({ ...f, dims: { ...f.dims, [k]: e.target.value } })} className="field" />)}
              <select aria-label="Dimension unit" value={f.dims.unit} onChange={(e) => setF({ ...f, dims: { ...f.dims, unit: e.target.value } })} className="field w-24"><option value="in">in</option><option value="cm">cm</option></select></div></div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <AddressFields id="from" label="Ship from" a={f.from} onChange={(from) => setF({ ...f, from })} />
          <AddressFields id="to" label="Ship to" a={f.to} onChange={(to) => setF({ ...f, to })} />
        </div>
        {err && <Notice tone="red">{err}</Notice>}
        <div className="flex gap-3"><button disabled={busy} className="btn-dark disabled:opacity-60">{shipment ? 'Save changes' : 'Create label'}</button><button type="button" onClick={onClose} className="btn-ghost">Cancel</button></div>
      </form>
    </Card>
  )
}

function Controls({ s, onDone }) {
  const [status, setStatus] = useState(s.status)
  const [location, setLocation] = useState('')
  const [text, setText] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const run = async (path, body, okMsg) => {
    setBusy(true); setErr('')
    try { const r = await api(`/admin/shipments/${s.id}/${path}`, { method: 'POST', body }); onDone(r.shipment, okMsg) } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="mt-4 grid gap-4 rounded-xl bg-paper p-4 ring-1 ring-line lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-[14px] font-medium">Post a tracking update</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field" aria-label="Status">{SHIP_STEPS.map((x) => <option key={x}>{x}</option>)}</select>
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="Location, e.g. Nashville, TN" className="field" aria-label="Location" />
        </div>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Message (optional), e.g. Arrived at facility" className="field" aria-label="Message" />
        <button disabled={busy} onClick={() => run('events', { status, location, text }, 'Tracking updated.')} className="btn-dark h-11 px-5 text-[14px]">Post update</button>
      </div>
      <div className="space-y-2">
        <p className="text-[14px] font-medium">{s.paused ? 'Delivery is paused' : 'Pause the delivery'}</p>
        {s.paused ? <>
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-800 ring-1 ring-red-200">Reason shown to the employee: {s.pauseReason}</p>
          <button disabled={busy} onClick={() => run('resume', {}, 'Delivery resumed. The tracking page is back to normal.')} className="btn-primary h-11 px-5 text-[14px]"><Play size={15} /> Resume delivery</button>
        </> : <>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} placeholder="Reason the employee will see, e.g. Address needs to be confirmed" className="field-area" aria-label="Pause reason" />
          <button disabled={busy || s.status === 'Delivered'} onClick={() => run('pause', { reason }, 'Delivery paused. The employee sees it in red with your reason.')} className="btn-ghost h-11 px-5 text-[14px] text-red-700 hover:text-red-700 hover:ring-red-300"><Pause size={15} /> Pause delivery</button>
        </>}
      </div>
      {err && <p role="alert" className="text-[14px] text-red-700 lg:col-span-2">{err}</p>}
    </div>
  )
}

export default function Shipments() {
  const { employees } = useEmployees()
  const data = useApi('/admin/shipments')
  const [edit, setEdit] = useState(undefined)
  const [open, setOpen] = useState('')
  const [msg, setMsg] = useState({ text: '' })
  const [q, setQ] = useState('')
  const list = (data.data?.shipments || []).filter((s) => !q || `${s.tracking} ${s.employee?.name} ${s.contents}`.toLowerCase().includes(q.toLowerCase()))

  const remove = async (s) => {
    if (!window.confirm(`Delete shipment ${s.tracking}? The employee will no longer be able to track it.`)) return
    try { await api(`/admin/shipments/${s.id}`, { method: 'DELETE' }); setMsg({ text: 'Shipment deleted.', tone: 'green' }); data.reload() } catch (e) { setMsg({ text: e.message, tone: 'red' }) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Shipments" sub="Create shipping labels for equipment, move each package along, change the delivery at any time, or pause it with a reason the employee will see."
        actions={<button onClick={() => { setEdit(null); setMsg({ text: '' }) }} className="btn-dark h-11"><Plus size={17} /> Create label</button>} />
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {edit !== undefined && <Editor key={edit?.id || 'new'} shipment={edit} employees={employees} onClose={() => setEdit(undefined)} onSaved={(s, t) => { setEdit(undefined); setOpen(s.id); setMsg({ text: t, tone: 'green' }); data.reload() }} />}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by tracking number, employee or contents" className="field md:w-[420px]" aria-label="Search shipments" />
      {data.error && <Notice tone="red">{data.error}</Notice>}
      <Card pad={false}>
        <ul className="divide-y divide-line">
          {list.map((s) => (
            <li key={s.id} className="px-6 py-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.paused ? 'bg-red-50 text-red-700' : 'bg-bridge-50 text-bridge-700'}`}><Truck size={18} /></span>
                  <div className="min-w-0">
                    <p className="break-all font-semibold tabular-nums">{s.tracking}</p>
                    <p className="text-[13.5px] text-slate">{s.employee?.name || 'Former employee'} · {s.contents || 'Package'} · {s.service} · {s.weight} {s.weightUnit}</p>
                    <p className="text-[13.5px] text-slate">To {s.to.city}, {s.to.state} · est. {fmtDay(s.eta)}{s.window ? ` ${s.window}` : ''} · updated {when(s.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {s.paused ? <Badge tone="red">Paused</Badge> : <Badge tone={s.status === 'Delivered' ? 'green' : s.status === 'Label created' ? 'gray' : 'teal'}>{s.status}</Badge>}
                  <a href={fileUrl(`/admin/shipments/${s.id}/label`)} download className="btn-ghost h-9 px-3 text-[14px]"><Printer size={15} /> Label</a>
                  <button onClick={() => setOpen(open === s.id ? '' : s.id)} className="btn-ghost h-9 px-3 text-[14px]">{open === s.id ? 'Close' : 'Update'}</button>
                  <button onClick={() => { setEdit(s); setMsg({ text: '' }) }} className="btn-ghost h-9 px-3 text-[14px]"><Pencil size={15} /> Edit</button>
                  <button onClick={() => remove(s)} className="grid h-9 w-9 place-items-center rounded-full text-red-700 ring-1 ring-line hover:bg-red-50" aria-label={`Delete shipment ${s.tracking}`}><Trash2 size={15} /></button>
                </div>
              </div>
              {open === s.id && <>
                <Controls key={`${s.id}-${s.updatedAt}`} s={s} onDone={(_, t) => { setMsg({ text: t, tone: 'green' }); data.reload() }} />
                <ol className="mt-4 space-y-2 text-[13.5px]">
                  {s.events.map((e, i) => <li key={i} className={e.alert ? 'text-red-700' : 'text-slate'}><span className="text-ink">{when(e.at)}</span> · {e.status}{e.location ? ` · ${e.location}` : ''} · {e.text}</li>)}
                </ol>
              </>}
            </li>
          ))}
          {data.data && !list.length && <li className="px-6 py-10 text-center text-slate">{q ? 'No shipments match your search.' : 'No shipments yet. Use “Create label” to send equipment to an employee.'}</li>}
          {!data.data && !data.error && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
        </ul>
      </Card>
    </div>
  )
}
