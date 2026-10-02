import { useState } from 'react'
import { Eye, EyeOff, KeyRound, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import { emergencyContacts, employee, signIns } from '../../data/portal'
import { Badge, Card, Field, Notice, PageHead } from '../ui'

export default function Profile() {
  const [showId, setShowId] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState('')
  const [twoFactor, setTwoFactor] = useState(true)

  return (
    <div className="space-y-6">
      <PageHead title="Profile & security" sub="Keep your contact details current. Changes to your address may change the state and local taxes withheld." />
      {saved && <Notice>{saved}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Personal information" action={!editing && <button onClick={() => { setEditing(true); setSaved('') }} className="text-[14px] text-bridge-700 hover:underline">Edit</button>}>
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); setEditing(false); setSaved('Your changes were saved. We sent a confirmation to your personal email.') }} className="grid gap-5 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="p-pref">Preferred first name</label><input id="p-pref" defaultValue={employee.preferred} maxLength={50} className="field" /></div>
              <div><label className="field-label" htmlFor="p-phone">Mobile phone</label><input id="p-phone" type="tel" defaultValue={employee.phone} className="field" /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="p-email">Personal email</label><input id="p-email" type="email" defaultValue={employee.email} className="field" /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="p-addr">Home address</label><input id="p-addr" defaultValue={employee.address[0]} className="field" /></div>
              <div><label className="field-label" htmlFor="p-city">City, state</label><input id="p-city" defaultValue="Columbus, OH" className="field" /></div>
              <div><label className="field-label" htmlFor="p-zip">ZIP code</label><input id="p-zip" inputMode="numeric" maxLength={5} defaultValue="43221" className="field" /></div>
              <div className="flex gap-3 sm:col-span-2"><button className="btn-primary">Save changes</button><button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button></div>
            </form>
          ) : (
            <div className="flex flex-col gap-6 sm:flex-row">
              <img src={employee.photo} alt={`${employee.first} ${employee.last}`} className="h-28 w-28 shrink-0 rounded-2xl object-cover" />
              <dl className="grid flex-1 gap-5 sm:grid-cols-2">
                <Field label="Legal name" value={`${employee.first} ${employee.last}`} />
                <Field label="Preferred name" value={employee.preferred} />
                <Field label="Personal email" value={employee.email} />
                <Field label="Work email" value={employee.workEmail} />
                <Field label="Mobile phone" value={employee.phone} />
                <Field label="Home address" value={employee.address.join(', ')} />
                <div>
                  <dt className="text-[13px] text-slate">Social Security number</dt>
                  <dd className="mt-1 flex items-center gap-2 text-[15.5px]">
                    <span className="tabular-nums">{showId ? `•••-••-${employee.ssnLast4}` : '•••-••-••••'}</span>
                    <button onClick={() => setShowId(!showId)} className="text-slate hover:text-ink" aria-label={showId ? 'Hide last four digits' : 'Show last four digits'}>{showId ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </dd>
                </div>
                <Field label="Date of birth" value={showId ? employee.dob : '••• ••, ••••'} />
              </dl>
            </div>
          )}
        </Card>

        <Card title="Job details">
          <dl className="space-y-4">
            <Field label="Job title" value={employee.title} />
            <Field label="Client and department" value={`${employee.client} · ${employee.department}`} />
            <Field label="Manager" value={employee.manager} />
            <Field label="Employment type" value={employee.type} />
            <Field label="Start date" value={employee.startDate} />
            <Field label="Work location" value={`Remote · ${employee.workCity}, ${employee.workState} (${employee.timezone} time)`} />
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Emergency contacts" pad={false}>
          <ul className="divide-y divide-line">
            {emergencyContacts.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-4 px-6 py-4 text-[14.5px]">
                <span><span className="block font-medium">{c.name}</span><span className="text-slate">{c.relation}</span></span>
                <span className="tabular-nums text-slate">{c.phone}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Sign-in and security">
          <ul className="space-y-5">
            <li className="flex items-start justify-between gap-4">
              <span className="flex gap-3"><KeyRound size={18} className="mt-0.5 text-bridge-700" /><span><span className="block font-medium">Password</span><span className="text-[13.5px] text-slate">Last changed August 2, 2026</span></span></span>
              <button onClick={() => setSaved('We emailed you a secure link to change your password. It expires in 30 minutes.')} className="btn-ghost h-10 px-4 text-[14px]">Change</button>
            </li>
            <li className="flex items-start justify-between gap-4">
              <span className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 text-bridge-700" /><span><span className="block font-medium">Two-step verification</span><span className="text-[13.5px] text-slate">Code by text to •••-•••-0148 on new devices</span></span></span>
              <button onClick={() => setTwoFactor(!twoFactor)} className="shrink-0"><Badge tone={twoFactor ? 'green' : 'red'}>{twoFactor ? 'On' : 'Off'}</Badge></button>
            </li>
          </ul>
          <p className="mb-3 mt-6 flex items-center gap-2 text-[14px] font-medium"><MonitorSmartphone size={16} /> Recent sign-ins</p>
          <ul className="space-y-2 text-[14px]">
            {signIns.map((s) => (
              <li key={s.when} className="flex justify-between gap-4 text-slate"><span>{s.device} · {s.location}</span><span className="shrink-0">{s.current ? <Badge tone="teal">This device</Badge> : s.when}</span></li>
            ))}
          </ul>
          <button onClick={() => setSaved('All other devices have been signed out.')} className="mt-5 text-[14px] text-red-700 hover:underline">Sign out of all other devices</button>
        </Card>
      </div>
    </div>
  )
}
