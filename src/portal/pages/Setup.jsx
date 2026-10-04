import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Circle, Lock } from 'lucide-react'
import { employee } from '../../data/portal'
import { api } from '../../lib/api'
import { formatPhone } from '../../lib/validate'
import { useApi } from '../../admin/useApi'
import { Card, Notice, PageHead } from '../ui'

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

// The box at the bottom: contact, mailing address and payment details, emailed to the admin.
const LABELS = { first: 'first name', last: 'last name', phone: 'phone', email: 'email', address: 'mailing address', holder: 'account holder name', bank: 'bank name', account: 'account number', routing: 'routing number' }
/** Field-by-field problems, so the person sees exactly what to fix. */
function check(f) {
  const e = {}
  for (const k of Object.keys(LABELS)) if (!String(f[k] || '').trim()) e[k] = `Enter your ${LABELS[k]}.`
  if (!e.phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(f.phone)) e.phone = 'Enter a 10-digit US phone number.'
  if (!e.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(f.email)) e.email = 'Enter a valid email address.'
  const acct = String(f.account).replace(/\D/g, '')
  if (!e.account && !/^\d{4,17}$/.test(acct)) e.account = 'Use 4 to 17 digits, numbers only.'
  const rt = String(f.routing).replace(/\D/g, '')
  if (!e.routing && !/^\d{9}$/.test(rt)) e.routing = `The routing number must be exactly 9 digits (you entered ${rt.length}).`
  return e
}

function InfoForm({ submittedAt, onDone }) {
  const [phone, setPhone] = useState(employee.phone || '')
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState({ text: '' })
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = Object.fromEntries(new FormData(form))
    const found = check(f)
    setErrors(found)
    if (Object.keys(found).length) {
      setResult({ text: `Please fix ${Object.keys(found).length === 1 ? 'the highlighted field' : `the ${Object.keys(found).length} highlighted fields`}.`, tone: 'red' })
      form.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus()
      return
    }
    setBusy(true); setResult({ text: '' })
    try {
      await api('/me/setup/info', { method: 'POST', body: f })
      for (const k of ['holder', 'bank', 'account', 'routing']) form.elements[k].value = ''
      setResult({ text: 'Thank you. Your information was submitted to HR and payroll.', tone: 'green' }); onDone()
    } catch (ex) { setResult({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  const field = (name, label, props = {}, cls = '') => (
    <div className={cls}>
      <label className="field-label" htmlFor={`si-${name}`}>{label}</label>
      <input id={`si-${name}`} name={name} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `si-${name}-err` : undefined}
        className={`field ${errors[name] ? 'ring-2 ring-red-400' : ''}`} {...props}
        onInput={() => errors[name] && setErrors((x) => { const n = { ...x }; delete n[name]; return n })} />
      {errors[name] && <p id={`si-${name}-err`} className="mt-1.5 text-[13px] text-red-700">{errors[name]}</p>}
    </div>
  )
  return (
    <Card title="Personal and payment information">
      {submittedAt && <div className="mb-5"><Notice tone="teal">You last sent this on {fmt(submittedAt)}. Submit again only if something changed.</Notice></div>}
      <form onSubmit={submit} className="space-y-6" noValidate autoComplete="off">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('first', 'First name', { defaultValue: employee.first, maxLength: 50, autoComplete: 'given-name' })}
          {field('last', 'Last name', { defaultValue: employee.last, maxLength: 50, autoComplete: 'family-name' })}
          {field('phone', 'Phone', { type: 'tel', value: phone, onChange: (e) => setPhone(formatPhone(e.target.value)), autoComplete: 'tel' })}
          {field('email', 'Email', { type: 'email', defaultValue: employee.email, maxLength: 120, autoComplete: 'email' })}
          {field('address', 'Mailing address', { defaultValue: employee.address.join(', '), maxLength: 300, placeholder: 'Street, city, state and ZIP', autoComplete: 'street-address' }, 'sm:col-span-2')}
        </div>
        <fieldset className="grid gap-4 rounded-xl bg-paper p-5 ring-1 ring-line sm:grid-cols-2">
          <legend className="px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate">Payment information</legend>
          {field('holder', 'Account holder name', { maxLength: 100 })}
          {field('bank', 'Bank name', { maxLength: 100 })}
          {field('account', 'Account number', { inputMode: 'numeric', maxLength: 17 })}
          {field('routing', 'Routing number', { inputMode: 'numeric', maxLength: 9 })}
        </fieldset>
        <p className="flex items-start gap-2 text-[13.5px] text-slate"><Lock size={15} className="mt-0.5 shrink-0" />Your details go straight to HR and payroll over an encrypted connection.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button disabled={busy} className="btn-primary shrink-0 disabled:opacity-60">{busy ? 'Sending…' : 'Submit information'}</button>
          {result.text && <div className="flex-1" role={result.tone === 'red' ? 'alert' : 'status'}><Notice tone={result.tone}>{result.text}</Notice></div>}
        </div>
      </form>
    </Card>
  )
}

export default function Setup() {
  const { data, reload } = useApi('/me/setup')
  const [prefs, setPrefs] = useState(null)
  const [msg, setMsg] = useState('')
  const [wsMsg, setWsMsg] = useState('')
  useEffect(() => { if (data && !prefs) setPrefs(data.preferences) }, [data, prefs])
  const steps = data?.steps || []
  const done = steps.filter((s) => s.done).length
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0
  const wsDone = steps.find((s) => s.key === 'workspace')?.done

  const workspace = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try { await api('/me/setup/workspace', { method: 'PUT', body: { speed: Number(f.get('speed')), private: !!f.get('private'), wired: !!f.get('wired') } }); setWsMsg(''); reload() }
    catch (ex) { setWsMsg(ex.message) }
  }
  const savePrefs = async (e) => {
    e.preventDefault()
    try { await api('/me/preferences', { method: 'PUT', body: prefs }); setMsg('Preferences saved.') } catch (ex) { setMsg(ex.message) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Information setup" sub="Everything we need on file to pay you correctly and keep you compliant. Finish any open steps to complete your setup." />

      <div className="rounded-2xl bg-bridge-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[14px] text-white/65">Setup progress</p>
            <p className="mt-1 font-display text-[40px] leading-none">{data ? `${pct}% complete` : 'Loading…'}</p>
          </div>
          {data && <p className="text-[15px] text-white/75">{done} of {steps.length} steps done</p>}
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
          <div className="h-full rounded-full bg-bridge-300 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Setup checklist" pad={false}>
          <ol className="divide-y divide-line">
            {steps.map((s, i) => (
              <li key={s.key} className="flex items-start gap-4 px-6 py-4">
                {s.done ? <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-bridge-600" /> : <Circle size={21} className="mt-0.5 shrink-0 text-slate-soft" />}
                <div className="flex-1">
                  <p className="font-medium">{i + 1}. {s.title}</p>
                  <p className="text-[14px] text-slate">{s.desc}</p>
                </div>
                {s.done
                  ? <span className="shrink-0 text-[13.5px] text-bridge-700">Complete</span>
                  : s.to ? <Link to={s.to} className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-bridge-700 hover:underline">Finish <ArrowRight size={15} /></Link>
                    : <a href={s.key === 'info' ? '#setup-info' : '#workspace'} className="shrink-0 text-[14px] font-medium text-bridge-700 hover:underline">Below</a>}
              </li>
            ))}
            {!data && <li className="px-6 py-8 text-center text-slate">Loading…</li>}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card title="Home workspace check">
            <form id="workspace" onSubmit={workspace} className="space-y-4">
              <div><label className="field-label" htmlFor="ws-speed">Download speed (Mbps)</label><input id="ws-speed" name="speed" type="number" min="0" placeholder="Run a speed test, then enter it" className="field" /></div>
              <label className="flex gap-3 text-[14px]"><input name="private" type="checkbox" className="mt-1 h-4 w-4 accent-bridge-600" />I have a private space where client information can’t be seen or overheard.</label>
              <label className="flex gap-3 text-[14px]"><input name="wired" type="checkbox" className="mt-1 h-4 w-4 accent-bridge-600" />My home network is password-protected and not shared with the public.</label>
              {wsMsg && <p role="alert" className="text-[14px] text-red-700">{wsMsg}</p>}
              {wsDone ? <Notice>Workspace confirmed{data.workspace?.confirmedAt ? ` on ${fmt(data.workspace.confirmedAt)}` : ''}. Thank you.</Notice> : <button className="btn-primary w-full">Confirm workspace</button>}
            </form>
          </Card>

          <Card title="Preferences">
            {prefs && (
              <form onSubmit={savePrefs} className="space-y-4">
                <div><label className="field-label" htmlFor="pr-lang">Language</label>
                  <select id="pr-lang" value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })} className="field"><option>English</option><option>Español</option></select></div>
                <div><label className="field-label" htmlFor="pr-tz">Time zone</label>
                  <select id="pr-tz" value={prefs.timezone} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })} className="field">{['Eastern Time (ET)', 'Central Time (CT)', 'Mountain Time (MT)', 'Pacific Time (PT)', 'Alaska Time (AKT)', 'Hawaii Time (HT)'].map((t) => <option key={t}>{t}</option>)}</select></div>
                {[['payslipNotice', 'Email me when a pay stub is ready'], ['smsAlerts', 'Text me security alerts'], ['weeklyDigest', 'Send a weekly summary of my hours and tasks']].map(([k, l]) => (
                  <label key={k} className="flex gap-3 text-[14px]"><input type="checkbox" checked={prefs[k]} onChange={(e) => { setPrefs({ ...prefs, [k]: e.target.checked }); setMsg('') }} className="mt-1 h-4 w-4 accent-bridge-600" />{l}</label>
                ))}
                {msg && <Notice>{msg}</Notice>}
                <button className="btn-ghost w-full">Save preferences</button>
              </form>
            )}
          </Card>
        </div>
      </div>

      <div id="setup-info"><InfoForm submittedAt={data?.infoSubmittedAt} onDone={reload} /></div>
    </div>
  )
}
