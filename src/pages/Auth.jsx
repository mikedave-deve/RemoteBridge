import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signIn } from '../portal/session'
import { AlertTriangle, ArrowLeft, BadgeCheck, Check, Eye, EyeOff, Lock, ShieldCheck, X } from 'lucide-react'
import Logo from '../components/Logo'
import { gsap, useGSAP } from '../lib/gsap'
import { enterDelay } from '../components/Transition'
import { photo } from '../data/photos'
import { formatPhone, validEmail, validPhone } from '../lib/validate'

const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 30
const COMMON = ['password', 'password1', 'password123', '12345678', '123456789', 'qwerty123', 'iloveyou', 'letmein1', 'welcome1', 'admin123', 'abc12345', 'remotebridge']

function Shell({ title, sub, children, image, quote }) {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const d = enterDelay()
      gsap.from('[data-auth] > *', { y: 26, autoAlpha: 0, stagger: 0.06, duration: 1, delay: d })
      gsap.fromTo('[data-auth-img]', { scale: 1.15 }, { scale: 1, duration: 2.6, ease: 'expo.out', delay: d - 0.4 })
      gsap.from('[data-auth-side] > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 1.2, delay: d + 0.2 })
    })
  }, { scope: ref })

  return (
    <div ref={ref} className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-bridge-950 text-white lg:sticky lg:top-0 lg:block lg:h-screen">
        <img data-auth-img src={photo(image, 1800, 2000)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bridge-950 via-bridge-950/50 to-bridge-950/25" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-bridge-950/75 to-transparent" />
        <div data-auth-side className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" aria-label="RemoteBridge home"><Logo tone="light" /></Link>
          <div>
            <figure className="max-w-lg">
              <blockquote className="font-display text-[clamp(28px,2.4vw,38px)] leading-[1.22]">“{quote.q}”</blockquote>
              <figcaption className="mt-6 text-[15px] text-white/70">{quote.who}</figcaption>
            </figure>
            <ul className="mt-12 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 text-[13px] ring-1 ring-white/10 backdrop-blur">
              {[[Lock, '256-bit encryption'], [ShieldCheck, 'SOC 2 Type II audited'], [BadgeCheck, 'Verified employers']].map(([Icon, t]) => (
                <li key={t} className="flex items-center gap-2.5 bg-bridge-950/50 px-4 py-4"><Icon size={17} className="shrink-0 text-bridge-200" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      <div className="flex flex-col bg-paper px-5 py-7 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-[15px] text-slate hover:text-bridge-600"><ArrowLeft size={16} /> Back to site</Link>
          <Link to="/" className="lg:hidden" aria-label="RemoteBridge home"><Logo size="sm" /></Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] text-bridge-700 ring-1 ring-line lg:inline-flex"><Lock size={13} /> Secure connection</span>
        </div>
        <div data-auth className="mx-auto my-auto w-full max-w-[460px] py-14">
          <h1 className="text-[clamp(40px,4vw,54px)] tracking-tightest">{title}</h1>
          <p className="mt-3 text-[17px] text-slate">{sub}</p>
          {children}
        </div>
        <p className="mx-auto max-w-[460px] text-center text-[12.5px] leading-relaxed text-slate-soft">
          RemoteBridge will never ask for your password by email, text or phone. Never pay anyone to apply for a job.
        </p>
      </div>
    </div>
  )
}

function Password({ id, value, onChange, autoComplete, invalid, describedBy, onCaps, placeholder }) {
  const [show, setShow] = useState(false)
  const caps = (e) => onCaps?.(e.getModifierState?.('CapsLock'))
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={onChange} maxLength={128}
        onKeyDown={caps} onKeyUp={caps} placeholder={placeholder} spellCheck={false} autoCapitalize="off"
        aria-invalid={invalid || undefined} aria-describedby={describedBy}
        className={`field pr-12 ${invalid ? 'ring-2 ring-red-500' : ''}`} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-lg text-slate hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? <EyeOff size={18} strokeWidth={1.6} /> : <Eye size={18} strokeWidth={1.6} />}
      </button>
    </div>
  )
}

const CapsWarning = ({ on }) => on ? <p className="mt-2 flex items-center gap-1.5 text-[13px] text-bridge-700"><AlertTriangle size={14} /> Caps Lock is on</p> : null

function Honeypot({ value, onChange }) {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <label htmlFor="company-website">Company website</label>
      <input id="company-website" tabIndex={-1} autoComplete="off" value={value} onChange={onChange} />
    </div>
  )
}

const Spinner = () => <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

export function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [trap, setTrap] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedFor, setLockedFor] = useState(0)
  const nav = useNavigate()
  const { state } = useLocation()

  useEffect(() => {
    if (!lockedFor) return
    const id = setTimeout(() => setLockedFor((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [lockedFor])

  const fail = () => {
    const n = attempts + 1
    setAttempts(n)
    setPw('')
    if (n >= MAX_ATTEMPTS) { setLockedFor(LOCK_SECONDS); setAttempts(0); setErr(`Too many attempts. For your security, sign-in is paused for ${LOCK_SECONDS} seconds.`) }
    else setErr(`The email or password is incorrect. ${MAX_ATTEMPTS - n} ${MAX_ATTEMPTS - n === 1 ? 'attempt' : 'attempts'} left before a short pause.`)
  }

  const submit = (e) => {
    e.preventDefault()
    if (busy || lockedFor) return
    if (trap) return
    setErr('')
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (!validEmail(email) || pw.length < 8) return fail()
      signIn()
      nav(state?.next?.startsWith('/portal') ? state.next : '/portal', { replace: true })
    }, 900)
  }

  return (
    <Shell title="Welcome back" sub={state?.reason === 'timeout' ? 'You were signed out after 15 minutes of inactivity. Log in again to continue.' : 'Log in to your employee portal: pay, time off, benefits and documents.'} image="officeLead"
      quote={{ q: 'I can see every application, interview and offer in one place. My recruiter is one message away.', who: 'Keisha Robinson, Payroll Specialist, hired 2025 · Memphis, TN' }}>
      <form className="relative mt-10" noValidate onSubmit={submit}>
        <Honeypot value={trap} onChange={(e) => setTrap(e.target.value)} />
        <div className="space-y-5">
          <div>
            <label htmlFor="l-email" className="field-label">Email</label>
            <input id="l-email" type="email" autoComplete="username" inputMode="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value.trim())} className="field" disabled={!!lockedFor} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><label htmlFor="l-pw" className="text-[14px] font-medium">Password</label><a href="#" className="text-[14px] text-bridge-600 hover:underline">Forgot password?</a></div>
            <Password id="l-pw" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" onCaps={setCaps} />
            <CapsWarning on={caps} />
          </div>
          <label className="flex items-center gap-3 text-[15px] text-slate"><input type="checkbox" className="h-4 w-4 accent-bridge-600" /> Keep me logged in on this device</label>
          {err && <p role="alert" className="flex gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800 ring-1 ring-red-200"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{err}</p>}
          <button className="btn-dark h-[52px] w-full text-[16px] disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || !!lockedFor}>
            {busy ? <><Spinner /> Verifying…</> : lockedFor ? `Try again in ${lockedFor}s` : <><Lock size={16} /> Log in securely</>}
          </button>
        </div>
      </form>
      <p className="mt-8 text-center text-[15px] text-slate">New to RemoteBridge? <Link to="/create-account" className="font-medium text-bridge-600 hover:underline">Create an account</Link></p>
    </Shell>
  )
}

export function Signup() {
  const [d, setD] = useState({ first: '', last: '', email: '', phone: '', pw: '', confirm: '', terms: false, trap: '' })
  const [touched, setTouched] = useState({})
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setD((s) => ({ ...s, [k]: k === 'phone' ? formatPhone(e.target.value) : k === 'terms' ? e.target.checked : e.target.value }))
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const lower = d.pw.toLowerCase()
  const personal = [d.first, d.last, d.email.split('@')[0]].map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 3)
  const checks = [
    ['At least 8 characters', d.pw.length >= 8],
    ['Upper and lower case letters', /[a-z]/.test(d.pw) && /[A-Z]/.test(d.pw)],
    ['A number', /\d/.test(d.pw)],
    ['A symbol (e.g. ! @ # $)', /[^A-Za-z0-9]/.test(d.pw)],
    ['Not a common password or your name', d.pw.length > 0 && !COMMON.includes(lower) && !personal.some((p) => lower.includes(p))],
  ]
  const score = checks.filter((c) => c[1]).length
  const strength = ['Too weak', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const match = d.confirm.length > 0 && d.confirm === d.pw

  const errors = {
    first: !d.first.trim() && 'Enter your first name.',
    last: !d.last.trim() && 'Enter your last name.',
    email: !validEmail(d.email) && 'Enter an email address like name@example.com.',
    phone: !validPhone(d.phone) && 'Enter a 10-digit US phone number.',
    pw: score < 5 && 'Your password needs to meet every requirement below.',
    confirm: !match && 'Passwords do not match.',
    terms: !d.terms && 'Please accept the terms to continue.',
  }
  const show = (k) => touched[k] && errors[k]
  const valid = !Object.values(errors).some(Boolean)

  const submit = (e) => {
    e.preventDefault()
    if (busy) return
    if (d.trap) return setDone(true)
    setTouched({ first: 1, last: 1, email: 1, phone: 1, pw: 1, confirm: 1, terms: 1 })
    if (!valid) return
    setBusy(true)
    setTimeout(() => { setBusy(false); setDone(true) }, 1100)
  }

  const input = (k, props) => (
    <input id={`s-${k}`} value={d[k]} onChange={set(k)} onBlur={blur(k)} aria-invalid={show(k) ? true : undefined} aria-describedby={show(k) ? `s-${k}-err` : undefined}
      className={`field ${show(k) ? 'ring-2 ring-red-500' : ''}`} {...props} />
  )
  const errMsg = (k) => show(k) ? <p id={`s-${k}-err`} className="mt-2 text-[13.5px] text-red-700">{errors[k]}</p> : null

  return (
    <Shell title={done ? 'Check your inbox' : 'Create your account'} image="hallway"
      sub={done ? `We sent a verification link to ${d.email || 'your email'}. It expires in 24 hours.` : 'Apply in one click, track every application and hear back from a real recruiter.'}
      quote={{ q: 'I set up my profile on a Sunday night. By Friday I had two interviews for remote bookkeeping jobs.', who: 'Marcus Lee, Bookkeeper, hired 2026 · Columbus, OH' }}>
      {done ? (
        <div className="mt-10 rounded-2xl bg-white p-8 ring-1 ring-line">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-bridge-600 text-white"><Check /></span>
          <p className="mt-5 text-slate">Once you verify your email, you can upload your résumé and start applying. For your security, the link works only once.</p>
          <Link to="/jobs" className="btn-primary mt-6">Browse jobs while you wait</Link>
        </div>
      ) : (
        <form className="relative mt-10" noValidate onSubmit={submit}>
          <Honeypot value={d.trap} onChange={set('trap')} />
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="s-first" className="field-label">First name</label>{input('first', { autoComplete: 'given-name', maxLength: 50 })}{errMsg('first')}</div>
              <div><label htmlFor="s-last" className="field-label">Last name</label>{input('last', { autoComplete: 'family-name', maxLength: 50 })}{errMsg('last')}</div>
            </div>
            <div><label htmlFor="s-email" className="field-label">Email</label>{input('email', { type: 'email', autoComplete: 'email', inputMode: 'email', maxLength: 120, placeholder: 'name@example.com' })}{errMsg('email')}</div>
            <div><label htmlFor="s-phone" className="field-label">Phone</label>{input('phone', { type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: '(555) 123-4567' })}{errMsg('phone')}</div>
            <div>
              <label htmlFor="s-pw" className="field-label">Password</label>
              <Password id="s-pw" value={d.pw} onChange={set('pw')} autoComplete="new-password" onCaps={setCaps} invalid={!!show('pw')} describedBy="s-pw-rules" />
              <CapsWarning on={caps} />
              <div className="mt-3 flex items-center gap-3" aria-hidden="true">
                <div className="flex flex-1 gap-1.5">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < score ? (score === 5 ? 'bg-bridge-600' : score >= 3 ? 'bg-bridge-400' : 'bg-red-400') : 'bg-line'}`} />)}</div>
                {d.pw && <span className={`w-16 text-right text-[12.5px] font-medium ${score === 5 ? 'text-bridge-700' : 'text-slate'}`}>{strength}</span>}
              </div>
              <ul id="s-pw-rules" className="mt-3 grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
                {checks.map(([l, ok]) => (
                  <li key={l} className={`flex items-center gap-1.5 ${l.startsWith('Not') ? 'sm:col-span-2' : ''} ${ok ? 'text-bridge-700' : 'text-slate-soft'}`}>
                    {ok ? <Check size={13} /> : <span className="h-[13px] w-[13px] rounded-full ring-1 ring-inset ring-line" />}{l}<span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label htmlFor="s-confirm" className="field-label">Confirm password</label>
              <div className="relative">
                <Password id="s-confirm" value={d.confirm} onChange={set('confirm')} autoComplete="new-password" onCaps={setCaps} invalid={!!show('confirm')} describedBy={show('confirm') ? 's-confirm-err' : undefined} />
              </div>
              {d.confirm && (
                <p className={`mt-2 flex items-center gap-1.5 text-[13px] ${match ? 'text-bridge-700' : 'text-red-700'}`} aria-live="polite">
                  {match ? <><Check size={14} /> Passwords match</> : <><X size={14} /> Passwords do not match</>}
                </p>
              )}
            </div>
            <div>
              <label className="flex gap-3 text-[14px] leading-relaxed text-slate">
                <input type="checkbox" checked={d.terms} onChange={set('terms')} className="mt-1 h-4 w-4 shrink-0 accent-bridge-600" />
                <span>I agree to the <a href="#" className="text-bridge-600 underline underline-offset-2">Terms of Use</a> and <a href="#" className="text-bridge-600 underline underline-offset-2">Privacy Policy</a>.</span>
              </label>
              {errMsg('terms')}
            </div>
            <button className="btn-dark h-[52px] w-full text-[16px] disabled:opacity-60" disabled={busy}>
              {busy ? <><Spinner /> Creating your account…</> : <><Lock size={16} /> Create account</>}
            </button>
          </div>
        </form>
      )}
      <p className="mt-8 text-center text-[15px] text-slate">Already have an account? <Link to="/login" className="font-medium text-bridge-600 hover:underline">Log in</Link></p>
    </Shell>
  )
}
