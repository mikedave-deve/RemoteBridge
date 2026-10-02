import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { preferences, setupSteps } from '../../data/portalExtra'
import { Card, Notice, PageHead } from '../ui'

export default function Setup() {
  const [steps, setSteps] = useState(setupSteps)
  const [prefs, setPrefs] = useState(preferences)
  const [msg, setMsg] = useState('')
  const [wsMsg, setWsMsg] = useState('')
  const done = steps.filter((s) => s.done).length
  const pct = Math.round((done / steps.length) * 100)

  const workspace = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const speed = Number(f.get('speed'))
    if (!(speed >= 25)) return setWsMsg('Your internet speed needs to be at least 25 Mbps for video calls. Contact the IT help desk if you need help upgrading.')
    if (!f.get('private') || !f.get('wired')) return setWsMsg('Please confirm both workspace requirements.')
    setWsMsg('')
    setSteps((s) => s.map((x) => (x.key === 'workspace' ? { ...x, done: true } : x)))
  }

  return (
    <div className="space-y-6">
      <PageHead title="Information setup" sub="Everything we need on file to pay you correctly and keep you compliant. Finish any open steps to complete your setup." />

      <div className="rounded-2xl bg-bridge-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[14px] text-white/65">Setup progress</p>
            <p className="mt-1 font-display text-[40px] leading-none">{pct}% complete</p>
          </div>
          <p className="text-[15px] text-white/75">{done} of {steps.length} steps done</p>
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
                    : <a href="#workspace" className="shrink-0 text-[14px] font-medium text-bridge-700 hover:underline">Below</a>}
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card title="Home workspace check">
            <form id="workspace" onSubmit={workspace} className="space-y-4">
              <div><label className="field-label" htmlFor="ws-speed">Download speed (Mbps)</label><input id="ws-speed" name="speed" type="number" min="0" placeholder="Run a speed test, then enter it" className="field" /></div>
              <label className="flex gap-3 text-[14px]"><input name="private" type="checkbox" className="mt-1 h-4 w-4 accent-bridge-600" />I have a private space where client information can’t be seen or overheard.</label>
              <label className="flex gap-3 text-[14px]"><input name="wired" type="checkbox" className="mt-1 h-4 w-4 accent-bridge-600" />My home network is password-protected and not shared with the public.</label>
              {wsMsg && <p role="alert" className="text-[14px] text-red-700">{wsMsg}</p>}
              {steps.find((s) => s.key === 'workspace').done ? <Notice>Workspace confirmed. Thank you.</Notice> : <button className="btn-primary w-full">Confirm workspace</button>}
            </form>
          </Card>

          <Card title="Preferences">
            <form onSubmit={(e) => { e.preventDefault(); setMsg('Preferences saved.') }} className="space-y-4">
              <div><label className="field-label" htmlFor="pr-lang">Language</label>
                <select id="pr-lang" value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })} className="field"><option>English</option><option>Español</option></select></div>
              <div><label className="field-label" htmlFor="pr-tz">Time zone</label>
                <select id="pr-tz" value={prefs.timezone} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })} className="field">{['Eastern Time (ET)', 'Central Time (CT)', 'Mountain Time (MT)', 'Pacific Time (PT)', 'Alaska Time (AKT)', 'Hawaii Time (HT)'].map((t) => <option key={t}>{t}</option>)}</select></div>
              {[['payslipNotice', 'Email me when a pay stub is ready'], ['smsAlerts', 'Text me security alerts'], ['weeklyDigest', 'Send a weekly summary of my hours and tasks']].map(([k, l]) => (
                <label key={k} className="flex gap-3 text-[14px]"><input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} className="mt-1 h-4 w-4 accent-bridge-600" />{l}</label>
              ))}
              {msg && <Notice>{msg}</Notice>}
              <button className="btn-ghost w-full">Save preferences</button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
