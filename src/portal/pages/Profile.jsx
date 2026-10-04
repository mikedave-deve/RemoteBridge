import { useRef, useState } from 'react'
import { Camera, Eye, EyeOff, KeyRound, MonitorSmartphone, Plus, Trash2, X } from 'lucide-react'
import { employee } from '../../data/portal'
import { api } from '../../lib/api'
import { formatPhone } from '../../lib/validate'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Field, Notice, PageHead } from '../ui'
import { Avatar, updateUser } from '../PortalLayout'

const longDay = (d) => (d ? new Date(String(d).length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '')
const when = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Shrink a picked photo to a 320 px square JPEG in the browser before upload. */
const toAvatar = (file) => new Promise((resolve, reject) => {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Choose a JPG or PNG picture.'))
  if (file.size > 15 * 1024 * 1024) return reject(new Error('That picture is over 15 MB.'))
  const img = new Image()
  img.onload = () => {
    const s = Math.min(img.width, img.height), c = document.createElement('canvas')
    c.width = c.height = 320
    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 320, 320)
    URL.revokeObjectURL(img.src); resolve(c.toDataURL('image/jpeg', 0.85))
  }
  img.onerror = () => reject(new Error('That file is not a picture we can read.'))
  img.src = URL.createObjectURL(file)
})

function Emergency() {
  const { data, reload } = useApi('/me/emergency')
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const list = data?.contacts || []
  const save = async () => {
    try { await api('/me/emergency', { method: 'PUT', body: { contacts: rows } }); setRows(null); setErr(''); reload() } catch (e) { setErr(e.message) }
  }
  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: k === 'phone' ? formatPhone(v) : v } : r)))
  return (
    <Card title="Emergency contacts" pad={false} action={!rows && <button onClick={() => setRows(list.length ? list : [{ name: '', relation: '', phone: '' }])} className="text-[14px] text-bridge-700 hover:underline">Edit</button>}>
      {rows ? (
        <div className="space-y-3 p-6">
          {rows.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto]">
              <input aria-label="Name" value={r.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="Full name" maxLength={80} className="field" />
              <input aria-label="Relationship" value={r.relation} onChange={(e) => set(i, 'relation', e.target.value)} placeholder="Relationship" maxLength={40} className="field" />
              <input aria-label="Phone" type="tel" value={r.phone} onChange={(e) => set(i, 'phone', e.target.value)} placeholder="(555) 123-4567" className="field" />
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid h-12 w-12 place-items-center rounded-full text-slate hover:bg-mist" aria-label="Remove contact"><X size={16} /></button>
            </div>
          ))}
          {rows.length < 5 && <button type="button" onClick={() => setRows([...rows, { name: '', relation: '', phone: '' }])} className="inline-flex items-center gap-1 text-[14px] text-bridge-700 hover:underline"><Plus size={15} /> Add a contact</button>}
          {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
          <div className="flex gap-3"><button onClick={save} className="btn-primary">Save contacts</button><button onClick={() => { setRows(null); setErr('') }} className="btn-ghost">Cancel</button></div>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((c) => (
            <li key={c.name + c.phone} className="flex items-center justify-between gap-4 px-6 py-4 text-[14.5px]">
              <span><span className="block font-medium">{c.name}</span><span className="text-slate">{c.relation}</span></span>
              <span className="tabular-nums text-slate">{c.phone}</span>
            </li>
          ))}
          {data && !list.length && <li className="px-6 py-5 text-[14.5px] text-slate">No emergency contacts yet. Add someone we can call if something happens during work hours.</li>}
        </ul>
      )}
    </Card>
  )
}

function Security() {
  const { data, reload } = useApi('/me/security')
  const [open, setOpen] = useState(false)
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState({ text: '' })
  const [busy, setBusy] = useState(false)
  const change = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = Object.fromEntries(new FormData(form))
    if (f.next !== f.confirm) return setMsg({ text: 'The new passwords do not match.', tone: 'red' })
    setBusy(true)
    try { await api('/me/password', { method: 'POST', body: f }); form.reset(); setOpen(false); setMsg({ text: 'Your password was changed. Any other devices were signed out.', tone: 'green' }); reload() }
    catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  const others = async () => {
    try { const r = await api('/me/sessions/others/logout', { method: 'POST' }); setMsg({ text: r.ended ? `Signed out of ${r.ended} other device${r.ended === 1 ? '' : 's'}.` : 'You are not signed in anywhere else.', tone: 'green' }); reload() }
    catch (e) { setMsg({ text: e.message, tone: 'red' }) }
  }
  const pw = (name, label, auto) => (
    <div><label className="field-label" htmlFor={`pw-${name}`}>{label}</label>
      <input id={`pw-${name}`} name={name} type={show ? 'text' : 'password'} required autoComplete={auto} maxLength={128} className="field" /></div>
  )
  return (
    <Card title="Sign-in and security">
      {msg.text && <div className="mb-5"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="flex items-start justify-between gap-4">
        <span className="flex gap-3"><KeyRound size={18} className="mt-0.5 text-bridge-700" /><span><span className="block font-medium">Password</span><span className="text-[13.5px] text-slate">{data ? `Last changed ${longDay(data.passwordChangedAt)}` : ' '}</span></span></span>
        {!open && <button onClick={() => { setOpen(true); setMsg({ text: '' }) }} className="btn-ghost h-10 px-4 text-[14px]">Change</button>}
      </div>
      {open && (
        <form onSubmit={change} className="mt-5 space-y-4">
          {pw('current', 'Current password', 'current-password')}
          {pw('next', 'New password', 'new-password')}
          {pw('confirm', 'Confirm new password', 'new-password')}
          <p className="text-[13px] text-slate">At least 8 characters, with upper and lower case letters, a number and a symbol.</p>
          <label className="flex items-center gap-2 text-[14px] text-slate"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-bridge-600" />Show passwords</label>
          <div className="flex gap-3"><button disabled={busy} className="btn-primary disabled:opacity-60">Save new password</button><button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button></div>
        </form>
      )}
      <p className="mb-3 mt-6 flex items-center gap-2 text-[14px] font-medium"><MonitorSmartphone size={16} /> Recent sign-ins</p>
      <ul className="space-y-2 text-[14px]">
        {(data?.signIns || []).map((s, i) => (
          <li key={i} className="flex justify-between gap-4 text-slate"><span>{s.device}</span><span className="shrink-0">{s.current ? <Badge tone="teal">This device</Badge> : when(s.at)}</span></li>
        ))}
      </ul>
      <button onClick={others} className="mt-5 text-[14px] text-red-700 hover:underline">Sign out of all other devices</button>
    </Card>
  )
}

export default function Profile() {
  const [showId, setShowId] = useState(false)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState({ text: '' })
  const [busy, setBusy] = useState(false)
  const [phone, setPhone] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const me = employee.personal || {}

  // Picture, a camera badge that is always visible, and plain Upload / Remove buttons (works on phones too).
  const photoPicker = (row = false) => (
    <div className={row ? 'flex items-center gap-4' : 'shrink-0'}>
      <button type="button" onClick={() => fileRef.current.click()} className="relative block rounded-2xl" aria-label="Upload a profile picture">
        <Avatar className={row ? 'h-20 w-20 rounded-2xl' : 'h-28 w-28 rounded-2xl'} icon={row ? 30 : 40} />
        <span className="absolute -bottom-1.5 -right-1.5 grid h-9 w-9 place-items-center rounded-full bg-bridge-600 text-white shadow ring-2 ring-white"><Camera size={16} /></span>
      </button>
      <div className={`flex gap-2 ${row ? 'flex-wrap' : 'mt-4 flex-col'}`}>
        <button type="button" disabled={uploading} onClick={() => fileRef.current.click()} className="btn-ghost h-9 px-3 text-[13.5px] disabled:opacity-60"><Camera size={15} /> {uploading ? 'Uploading…' : employee.photo ? 'Change photo' : 'Upload photo'}</button>
        {employee.photo && <button type="button" onClick={removePhoto} className="inline-flex items-center gap-1 px-1 text-[13px] text-slate hover:text-red-700"><Trash2 size={13} /> Remove photo</button>}
      </div>
    </div>
  )

  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const { user } = await api('/me/profile', { method: 'PUT', body: Object.fromEntries(new FormData(e.currentTarget)) })
      updateUser(user); setEditing(false); setMsg({ text: 'Your changes were saved.', tone: 'green' })
    } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  const pickPhoto = async (file) => {
    if (!file) return
    setMsg({ text: '' }); setUploading(true)
    try { const photo = await toAvatar(file); const { user } = await api('/me/photo', { method: 'PUT', body: { photo } }); updateUser(user); setMsg({ text: 'Profile picture updated.', tone: 'green' }) }
    catch (e) { setMsg({ text: e.message, tone: 'red' }) } finally { setUploading(false) }
  }
  const removePhoto = async () => { const { user } = await api('/me/photo', { method: 'DELETE' }); updateUser(user) }
  const location = [employee.workCity, employee.workState].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <PageHead title="Profile & security" sub="Keep your contact details current. Changes to your address may change the state and local taxes withheld." />
      {msg.text && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pickPhoto(e.target.files[0]); e.target.value = '' }} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Personal information" action={!editing && <button onClick={() => { setEditing(true); setPhone(employee.phone); setMsg({ text: '' }) }} className="text-[14px] text-bridge-700 hover:underline">Edit</button>}>
          {editing ? (
            <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><span className="field-label">Profile picture</span>{photoPicker(true)}</div>
              <div><label className="field-label" htmlFor="p-pref">Preferred first name</label><input id="p-pref" name="preferred" defaultValue={me.preferred || employee.first} maxLength={50} className="field" /></div>
              <div><label className="field-label" htmlFor="p-phone">Mobile phone</label><input id="p-phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="field" /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="p-email">Personal email</label><input id="p-email" name="email" type="email" required defaultValue={employee.email} className="field" />
                <p className="mt-1 text-[12.5px] text-slate">This is also the email you log in with.</p></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="p-addr">Home address</label><input id="p-addr" name="street" defaultValue={me.street || (me.cityState ? '' : employee.address[0] || '')} maxLength={120} className="field" /></div>
              <div><label className="field-label" htmlFor="p-city">City, state</label><input id="p-city" name="cityState" defaultValue={me.cityState || ''} placeholder="Columbus, OH" maxLength={80} className="field" /></div>
              <div><label className="field-label" htmlFor="p-zip">ZIP code</label><input id="p-zip" name="zip" inputMode="numeric" maxLength={10} defaultValue={me.zip || ''} className="field" /></div>
              <div><label className="field-label" htmlFor="p-dob">Date of birth</label><input id="p-dob" name="dob" type="date" defaultValue={me.dob || ''} className="field" /></div>
              <div><label className="field-label" htmlFor="p-ssn">Last 4 of Social Security number</label><input id="p-ssn" name="ssnLast4" inputMode="numeric" maxLength={4} placeholder={me.ssnLast4 ? '••••' : ''} className="field" /></div>
              <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="btn-primary disabled:opacity-60">Save changes</button><button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button></div>
            </form>
          ) : (
            <div className="flex flex-col gap-6 sm:flex-row">
              {photoPicker()}

              <dl className="grid flex-1 gap-5 sm:grid-cols-2">
                <Field label="Legal name" value={`${employee.first} ${employee.last}`} />
                <Field label="Preferred name" value={employee.preferred} />
                <Field label="Personal email" value={employee.email} />
                <Field label="Employee ID" value={employee.id} />
                <Field label="Mobile phone" value={employee.phone || 'Not added yet'} />
                <Field label="Home address" value={employee.address.join(', ') || 'Not added yet'} />
                <div>
                  <dt className="text-[13px] text-slate">Social Security number</dt>
                  <dd className="mt-1 flex items-center gap-2 text-[15.5px]">
                    <span className="tabular-nums">{!employee.ssnLast4 ? 'Not added yet' : showId ? `•••-••-${employee.ssnLast4}` : '•••-••-••••'}</span>
                    {employee.ssnLast4 && <button onClick={() => setShowId(!showId)} className="text-slate hover:text-ink" aria-label={showId ? 'Hide last four digits' : 'Show last four digits'}>{showId ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                  </dd>
                </div>
                <Field label="Date of birth" value={!employee.dob ? 'Not added yet' : showId ? longDay(employee.dob) : '••• ••, ••••'} />
              </dl>
            </div>
          )}
        </Card>

        <Card title="Job details">
          <dl className="space-y-4">
            <Field label="Job title" value={employee.title} />
            <Field label="Client and department" value={[employee.client, employee.hasDepartment && employee.department].filter(Boolean).join(' · ') || 'Not assigned yet'} />
            <Field label="Manager" value={employee.manager} />
            <Field label="Employment type" value={employee.type} />
            <Field label="Start date" value={employee.startDate} />
            <Field label="Work location" value={`Remote${location ? ` · ${location}` : ''}`} />
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Emergency />
        <Security />
      </div>
    </div>
  )
}
