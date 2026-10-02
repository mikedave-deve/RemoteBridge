import { useRef, useState } from 'react'
import { Check, FileSignature, Landmark, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Img from '../components/Img'
import CtaBand from '../components/CtaBand'
import useReveal from '../lib/useReveal'
import { gsap, useGSAP } from '../lib/gsap'
import { photo } from '../data/photos'

const history = [
  ['2018', 'Founded in Atlanta', 'Daniel Brooks and William Parker place their first 14 remote customer support reps with a regional insurer, running payroll from a spreadsheet.'],
  ['2019', 'Payroll in every state', 'We register to run payroll and withhold taxes in all 50 states, so employers can hire anyone in the country as a W-2 employee.'],
  ['2021', 'Specialist recruiting teams', 'Recruiting splits into specialist teams led by people from each field, starting with finance, payroll and customer support.'],
  ['2023', '5,000 Americans placed', 'We pass five thousand placements and begin publishing our retention and pay figures every year.'],
  ['2025', 'Verified employer program', 'Every employer on our board is now verified in person or by video, with SOC 2 Type II certification for our platform.'],
  ['2026', '12,400 people and counting', 'Today 180 RemoteBridge staff in 31 states support 12,400 placed professionals and 640 US employers.'],
]

const services = [
  { icon: Users, t: 'Remote recruiting', d: 'Specialist search and screening across 12 job categories. Shortlist of three in ten business days, flat fee agreed upfront.', p: ['Skills assessments', 'Structured interviews', '90-day replacement'] },
  { icon: Landmark, t: 'Multi-state payroll', d: 'We employ your remote staff as W-2 employees in any state, handling registration, withholding, benefits and filings.', p: ['All 50 states', 'Health and 401(k) benefits', 'Quarterly tax filings'] },
  { icon: FileSignature, t: 'Onboarding & compliance', d: 'Background checks, I-9 and E-Verify, equipment shipping and day-one setup, done before your new hire logs on.', p: ['Background checks', 'I-9 and E-Verify', 'Laptop shipped'] },
]

function Contact() {
  const [sent, setSent] = useState(false)
  return (
    <section id="contact" className="scroll-mt-24 bg-white py-28 lg:py-36">
      <div className="frame grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 data-split className="text-[clamp(38px,4.4vw,60px)] tracking-tightest">Talk to our hiring team</h2>
          <p data-fade className="mt-6 text-[17px] leading-relaxed text-slate">Tell us about the role. A partner from the right recruiting team will reply within one business day with a proposed approach, timeline and flat fee.</p>
          <dl data-fade className="mt-10 space-y-5 text-[16px]">
            <div><dt className="text-slate">Employers</dt><dd className="font-medium"><a className="link-u" href="mailto:hire@remotebridge.com">hire@remotebridge.com</a></dd></div>
            <div><dt className="text-slate">Professionals</dt><dd className="font-medium"><a className="link-u" href="mailto:talent@remotebridge.com">talent@remotebridge.com</a></dd></div>
            <div><dt className="text-slate">Offices</dt><dd className="font-medium">Atlanta, New York, Chicago, Dallas, Denver</dd></div>
          </dl>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          {sent ? (
            <div className="grid h-full place-items-center rounded-[28px] bg-mist p-12 text-center">
              <div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bridge-500 text-white"><Check /></span>
                <p className="mt-6 font-display text-[32px]">Message sent</p><p className="mt-2 text-slate">A partner will reply within one business day.</p></div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="grid gap-5 rounded-[28px] bg-mist p-6 sm:grid-cols-2 sm:p-10">
              <div><label className="field-label" htmlFor="c-name">Your name</label><input id="c-name" required autoComplete="name" className="field" /></div>
              <div><label className="field-label" htmlFor="c-co">Company</label><input id="c-co" required autoComplete="organization" className="field" /></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="c-mail">Work email</label><input id="c-mail" type="email" required autoComplete="email" className="field" /></div>
              <div><label className="field-label" htmlFor="c-need">What do you need?</label>
                <select id="c-need" className="field"><option>Remote recruiting</option><option>Multi-state payroll</option><option>Onboarding & compliance</option><option>All three</option></select></div>
              <div><label className="field-label" htmlFor="c-n">Roles to fill</label>
                <select id="c-n" className="field"><option>1</option><option>2–5</option><option>6–20</option><option>20+</option></select></div>
              <div className="sm:col-span-2"><label className="field-label" htmlFor="c-msg">About the role</label><textarea id="c-msg" rows={4} className="field-area" placeholder="Job title, schedule, time zone, pay range, start date" /></div>
              <button className="btn-primary sm:col-span-2">Send message</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default function About() {
  const ref = useRef(null)
  useReveal(ref)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-line]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '[data-history]', start: 'top 70%', end: 'bottom 70%', scrub: true } })
      gsap.utils.toArray('[data-year]').forEach((el) => {
        gsap.from(el, { autoAlpha: 0.2, x: -20, duration: 1, scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
      })
    })
  }, { scope: ref })

  return (
    <div ref={ref}>
      <PageHeader kicker="About RemoteBridge" image="townhall" title="We build the bridge, then we look after it.">
        RemoteBridge is an American recruiting and employment company for remote work. We find the right person, employ them properly in their home state, and stay involved long after the start date.
      </PageHeader>

      <section className="bg-paper py-24 lg:py-32">
        <div className="frame grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
              <Img src={photo('teamTable', 1200, 1500)} alt="Colleagues working together at a shared table" label="Remote Bridge" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-10">
            <h2 data-split className="text-[clamp(34px,3.6vw,52px)] tracking-tightest">A company started by people who had been on both sides of the hire.</h2>
            <div data-fade className="mt-8 space-y-5 font-display text-[20px] leading-[1.65] text-ink/85">
              <p>Daniel spent twelve years filling call-center and back-office roles for insurers in the Southeast. The talent was never the problem. The problem was geography: great people in small towns could not reach good jobs in big cities, and employers could not reach them.</p>
              <p>William had run payroll and compliance for a national staffing firm and knew how employment worked in every state. In 2018 they started RemoteBridge to do remote recruiting and employment as one job, done carefully, for a flat fee.</p>
              <p>Eight years later we are 180 people in 31 states. The idea has not changed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-24 lg:pb-32">
        <div data-stagger className="frame grid gap-4 md:grid-cols-12">
          {[['openOffice', 'Our Atlanta headquarters', 'md:col-span-5'], ['homeVideo', 'A recruiter on a candidate call', 'md:col-span-4'], ['roundtable', 'Employer onboarding session', 'md:col-span-3']].map(([k, cap, span]) => (
            <figure key={k} className={`group relative h-[300px] overflow-hidden rounded-[22px] lg:h-[440px] ${span}`}>
              <img src={photo(k, 1200, 900)} alt={cap} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.03]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bridge-950/80 to-transparent p-5 pt-14 text-[14px] text-white">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="employers" className="scroll-mt-24 bg-bridge-900 py-28 text-white lg:py-36">
        <div className="frame">
          <div className="grid gap-8 lg:grid-cols-12">
            <h2 data-split className="text-[clamp(38px,4.4vw,64px)] tracking-tightest text-white lg:col-span-6">Three services, one agreement</h2>
            <p data-fade className="self-end text-[17px] text-white/70 lg:col-span-5 lg:col-start-8">Use one, or all three. Most employers start with recruiting and move their existing remote staff onto our payroll within a year.</p>
          </div>
          <div data-stagger className="mt-16 grid gap-5 md:grid-cols-3">
            {services.map(({ icon: Icon, t, d, p }) => (
              <article key={t} className="flex flex-col rounded-[24px] bg-white/[0.04] p-8 ring-1 ring-white/10 transition-colors duration-500 hover:bg-white/[0.07]">
                <Icon size={28} strokeWidth={1.4} className="text-bridge-300" />
                <h3 className="mt-10 text-[30px] text-white">{t}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-white/70">{d}</p>
                <ul className="mt-6 space-y-2 border-t border-white/10 pt-6 text-[15px] text-white/80">{p.map((x) => <li key={x} className="flex gap-3"><Check size={16} className="mt-1 text-bridge-300" />{x}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-28 lg:py-36">
        <div className="frame grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4"><div className="lg:sticky lg:top-32">
            <h2 data-split className="text-[clamp(38px,4.4vw,60px)] tracking-tightest">Eight years, in brief</h2>
            <p data-fade className="mt-5 text-[17px] text-slate">From fourteen placements and a spreadsheet to all 50 states.</p>
          </div></div>
          <ol data-history className="relative lg:col-span-7 lg:col-start-6">
            <span className="absolute left-[7px] top-2 bottom-2 w-px bg-line" />
            <span data-line className="absolute left-[7px] top-2 bottom-2 w-px origin-top bg-bridge-500" />
            {history.map(([y, t, d]) => (
              <li key={y} data-year className="relative pb-14 pl-12 last:pb-0">
                <span className="absolute left-0 top-2 h-[15px] w-[15px] rounded-full bg-paper ring-[3px] ring-bridge-500" />
                <p className="font-display text-[48px] leading-none text-bridge-600" style={{ fontVariantNumeric: 'tabular-nums' }}>{y}</p>
                <h3 className="mt-3 font-sans text-[20px] font-medium tracking-normal">{t}</h3>
                <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-slate">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Contact />
      <CtaBand />
    </div>
  )
}
