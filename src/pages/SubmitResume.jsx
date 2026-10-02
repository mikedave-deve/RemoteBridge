import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, FileText, Lock, ShieldCheck, UploadCloud, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { departments, getJob } from '../data/jobs'
import { photo } from '../data/photos'
import { gsap, useGSAP } from '../lib/gsap'
import { formatPhone, validEmail, validPhone } from '../lib/validate'

const experience = ['Entry level (less than 1 year)', '1–2 years', '3–5 years', '6–10 years', 'More than 10 years']
const MAX = 8 * 1024 * 1024

// Check the file's first bytes, not just its name: PDF (%PDF), DOCX (zip "PK"), legacy DOC (OLE).
const sniff = (file) => new Promise((resolve) => {
  const r = new FileReader()
  r.onload = () => {
    const b = new Uint8Array(r.result)
    const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
    resolve(hex.startsWith('25504446') || hex.startsWith('504b0304') || hex.startsWith('d0cf11e0'))
  }
  r.onerror = () => resolve(false)
  r.readAsArrayBuffer(file.slice(0, 8))
})

function Field({ label, id, error, hint, optional, children }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}{optional && <span className="ml-1.5 font-normal text-slate-soft">(optional)</span>}</label>
      {children}
      {error ? <p id={`${id}-err`} className="mt-2 text-[14px] text-red-700">{error}</p> : hint && <p className="mt-2 text-[14px] text-slate-soft">{hint}</p>}
    </div>
  )
}

export default function SubmitResume() {
  const [params] = useSearchParams()
  const role = getJob(params.get('role'))
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const [data, setData] = useState({ first: '', last: '', email: '', phone: '', field: role?.department || '', level: '', note: '', consent: false, website: '' })
  const ref = useRef(null)
  const set = (k) => (e) => setData((d) => ({ ...d, [k]: k === 'phone' ? formatPhone(e.target.value) : e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useGSAP(() => {
    gsap.from('[data-panel] > *', { y: 22, autoAlpha: 0, stagger: 0.04, duration: 0.8, ease: 'expo.out' })
  }, { scope: ref, dependencies: [done] })

  const validate = () => {
    const e = {}
    if (!data.first.trim()) e.first = 'Enter your first name.'
    if (!data.last.trim()) e.last = 'Enter your last name.'
    if (!validEmail(data.email)) e.email = 'Enter an email address like name@example.com.'
    if (!validPhone(data.phone)) e.phone = 'Enter a 10-digit US phone number.'
    if (!data.field) e.field = 'Choose the field you are most interested in.'
    if (!data.level) e.level = 'Choose your experience level.'
    if (!file) e.file = 'Attach your résumé as a PDF or Word file.'
    if (!data.consent) e.consent = 'Please agree so we can store and share your résumé with employers.'
    setErrors(e)
    if (Object.keys(e).length) ref.current?.querySelector(`#${Object.keys(e)[0]}`)?.focus()
    return !Object.keys(e).length
  }

  const submit = (ev) => {
    ev.preventDefault()
    if (sending) return
    if (data.website) return setDone(true) // bot filled the hidden field: pretend success, send nothing
    if (!validate()) return
    setSending(true)
    setTimeout(() => { setSending(false); setDone(true) }, 1200)
  }

  const pick = async (f) => {
    if (!f) return
    if (!/\.(pdf|docx?)$/i.test(f.name)) return setErrors((e) => ({ ...e, file: 'Use a PDF or Word file (.pdf, .doc, .docx).' }))
    if (f.size > MAX) return setErrors((e) => ({ ...e, file: 'That file is over 8 MB. Save a smaller PDF and try again.' }))
    if (f.size < 100 || !(await sniff(f))) return setErrors((e) => ({ ...e, file: 'This file does not look like a real PDF or Word document. Try exporting it again.' }))
    setErrors((e) => { const next = { ...e }; delete next.file; return next })
    setFile(f)
  }

  const err = (k) => errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-err`, className: 'field ring-2 ring-red-500' } : { className: 'field' }

  return (
    <>
      <PageHeader kicker="Submit your résumé" image="laptopsMeeting" compact title={role ? `Apply: ${role.title}` : 'One résumé. Every remote job that fits.'}>
        {role ? `${role.company} · ${role.location}. A recruiter will review your application within five business days.` : 'Send your résumé once. A RemoteBridge recruiter reads every one and contacts you when a work-from-home job matches your skills.'}
      </PageHeader>

      <section ref={ref} className="bg-paper py-16 lg:py-24">
        <div className="frame grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_40px_80px_-50px_rgba(11,54,64,.35)] ring-1 ring-line sm:p-10 lg:p-12">
              {done ? (
                <div data-panel className="py-10 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-bridge-600 text-white"><Check size={28} /></span>
                  <h2 className="mt-8 text-[40px]">Résumé received</h2>
                  <p className="mx-auto mt-4 max-w-md text-[17px] text-slate">Thanks{data.first ? `, ${data.first}` : ''}. We sent a confirmation to {data.email || 'your email'}. A recruiter from our {data.field || 'talent'} team will be in touch within five business days.</p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/jobs" className="btn-primary">Browse open jobs</Link><Link to="/create-account" className="btn-ghost">Create an account</Link></div>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="flex items-center justify-between gap-4 border-b border-line pb-6">
                    <div>
                      <h2 className="text-[32px] leading-tight">Your details</h2>
                      <p className="mt-1 text-[15px] text-slate">Takes about three minutes. All fields are required unless marked optional.</p>
                    </div>
                    <span className="hidden items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-[13px] text-bridge-700 sm:inline-flex"><Lock size={14} /> Encrypted</span>
                  </div>
                  <div data-panel className="mt-8 grid gap-6 sm:grid-cols-2">
                    <Field label="First name" id="first" error={errors.first}><input id="first" autoComplete="given-name" maxLength={50} value={data.first} onChange={set('first')} {...err('first')} /></Field>
                    <Field label="Last name" id="last" error={errors.last}><input id="last" autoComplete="family-name" maxLength={50} value={data.last} onChange={set('last')} {...err('last')} /></Field>
                    <Field label="Email" id="email" error={errors.email}><input id="email" type="email" autoComplete="email" maxLength={120} placeholder="name@example.com" value={data.email} onChange={set('email')} {...err('email')} /></Field>
                    <Field label="Phone" id="phone" error={errors.phone}><input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(555) 123-4567" value={data.phone} onChange={set('phone')} {...err('phone')} /></Field>
                    <Field label="Field of interest" id="field" error={errors.field}>
                      <select id="field" value={data.field} onChange={set('field')} {...err('field')}><option value="">Choose one</option>{departments.map((d) => <option key={d}>{d}</option>)}</select>
                    </Field>
                    <Field label="Experience level" id="level" error={errors.level}>
                      <select id="level" value={data.level} onChange={set('level')} {...err('level')}><option value="">Choose one</option>{experience.map((y) => <option key={y}>{y}</option>)}</select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Anything else we should know?" id="note" optional hint="Preferred hours, time zone, roles you are not interested in, or anything else.">
                        <textarea id="note" rows={4} maxLength={1000} value={data.note} onChange={set('note')} className="field-area" />
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="field-label">Resume / CV</span>
                      {file ? (
                        <div className="flex items-center gap-4 rounded-2xl bg-mist p-5 ring-1 ring-line">
                          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-bridge-600"><FileText size={22} strokeWidth={1.6} /></span>
                          <div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="flex items-center gap-1.5 text-[14px] text-bridge-700"><ShieldCheck size={14} /> {(file.size / 1024).toFixed(0)} KB, checked and ready to send</p></div>
                          <button type="button" onClick={() => setFile(null)} className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line hover:bg-white" aria-label="Remove file"><X size={16} /></button>
                        </div>
                      ) : (
                        <label htmlFor="file" onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
                          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors duration-300 ${drag ? 'border-bridge-500 bg-bridge-50' : errors.file ? 'border-red-300 bg-red-50/40' : 'border-line hover:border-bridge-300 hover:bg-mist/60'}`}>
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-bridge-50 text-bridge-600"><UploadCloud size={26} strokeWidth={1.5} /></span>
                          <p className="mt-4 text-[17px] font-medium text-ink">Drop your résumé here, or <span className="text-bridge-600 underline underline-offset-4">choose a file</span></p>
                          <p className="mt-1 text-[14px] text-slate">PDF, DOC or DOCX, up to 8 MB</p>
                          <input id="file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
                        </label>
                      )}
                      {errors.file && <p id="file-err" className="mt-2 text-[14px] text-red-700">{errors.file}</p>}
                    </div>

                    {/* Honeypot: hidden from people, often filled in by bots. */}
                    <div className="absolute -left-[9999px]" aria-hidden="true">
                      <label htmlFor="website">Website</label>
                      <input id="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={set('website')} />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex gap-3 text-[15px] leading-relaxed text-slate">
                        <input id="consent" type="checkbox" checked={data.consent} onChange={set('consent')} className="mt-1 h-4 w-4 shrink-0 accent-bridge-600" />
                        I agree that RemoteBridge may store my résumé for 24 months and share it with employers only with my permission. I can ask for it to be deleted at any time.
                      </label>
                      {errors.consent && <p id="consent-err" className="mt-2 text-[14px] text-red-700">{errors.consent}</p>}
                    </div>
                  </div>
                  <div className="mt-10 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
                    <p className="flex items-center gap-2 text-[13.5px] text-slate"><Lock size={14} className="text-bridge-600" /> Sent over an encrypted connection</p>
                    <button disabled={sending} className="btn-primary h-[52px] w-full px-9 disabled:opacity-70 sm:w-auto">
                      {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending securely…</> : 'Submit résumé'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-28">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
                <img src={photo('cafeLaptop', 1000, 750)} alt="A man smiling while working on his laptop" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bridge-950/85 to-transparent p-6 pt-16 text-white">
                  <p className="font-display text-[22px] leading-tight">“I sent one résumé and had three interviews in two weeks.”</p>
                  <p className="mt-2 text-[13px] text-white/70">Jordan, Virtual Assistant, Raleigh NC</p>
                </div>
              </div>
              <h2 className="mt-10 text-[30px]">What happens next</h2>
              <ol className="relative mt-8 space-y-8 border-l border-line pl-8">
                {[
                  ['Within 5 business days', 'A recruiter from your field reads your résumé and replies, whether or not there is a match today.'],
                  ['A 20-minute phone call', 'We talk about the work you want, the hours that suit you and the pay you expect.'],
                  ['Matched jobs only', 'We share your résumé only with your OK, and only for verified jobs with confirmed pay.'],
                ].map(([t, d], i) => (
                  <li key={t} className="relative">
                    <span className="absolute -left-[41px] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-paper ring-1 ring-bridge-500"><span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-bridge-500' : 'bg-bridge-200'}`} /></span>
                    <p className="font-medium text-ink">{t}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-slate">{d}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex gap-3 rounded-2xl bg-mist p-6 text-[15px] leading-relaxed text-slate">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-bridge-600" />
                <p>Your data is encrypted and stored in the United States. We never sell it, and we never ask job seekers for payment or bank details.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
