import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { photo } from '../../data/photos'

const items = [
  { t: 'We respect your time.', b: [
      'Too many job boards ask for an hour of effort before anyone mentions the pay. Ours starts with the pay. Every listing shows a range agreed with the employer, the schedule and the time zone you will work in.',
      'You hear back within five business days at every stage, including when the answer is no. When it is no, your recruiter tells you why and what to try next.' ] },
  { t: 'Every employer is real and verified.', b: [
      'Work-from-home scams are common. We check every employer before a job goes live: business registration, a named hiring manager we have spoken to, and a confirmed budget.',
      'We will never ask you to pay for training, buy equipment up front or cash a check for a new employer. If anyone does, it is not us.' ] },
  { t: 'Paid fairly and on time.', b: [
      'Most of our roles are W-2 employment with health insurance, a 401(k) and paid time off. Where a role is a 1099 contract, the listing says so clearly.',
      'Payroll runs by direct deposit on the same day every pay period. Overtime rules, state taxes and pay stubs are handled properly in every state we hire in.' ] },
  { t: 'We stay after your first day.', b: [
      'A hire is not a success on day one. Your recruiter checks in after 30 and 90 days, and earlier if you or your manager ask.',
      'If a job does not work out in the first 90 days, we help you find the next one first. 93 percent of the people we place are still in the role a year later.' ] },
]

export default function Principles() {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const markers = gsap.utils.toArray('[data-mark]')
      gsap.utils.toArray('[data-principle]').forEach((el, i) => {
        gsap.from(el, { autoAlpha: 0.25, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 40%', scrub: true } })
        gsap.to(el, { autoAlpha: i === markers.length - 1 ? 1 : 0.25, ease: 'none', scrollTrigger: { trigger: el, start: 'bottom 45%', end: 'bottom 15%', scrub: true } })
        ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => markers[i].classList.toggle('is-on', st.isActive) })
      })
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="bg-white py-24 lg:py-36">
      <div className="frame grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <h2 className="text-balance text-[clamp(38px,4.4vw,64px)] tracking-tightest">Remote work, done properly</h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-slate">
              Four promises we make to every job seeker and every employer. They are written into our agreements, not just our marketing.
            </p>
            <ol className="mt-10 hidden space-y-3 lg:block">
              {items.map((it, i) => (
                <li key={it.t} data-mark className="group flex items-center gap-4 text-[15px] text-slate-soft transition-colors duration-500 [&.is-on]:text-ink">
                  <span className="h-px w-6 bg-line transition-all duration-500 group-[.is-on]:w-12 group-[.is-on]:bg-bridge-500" />
                  {it.t}
                </li>
              ))}
            </ol>
            <div className="relative mt-12 hidden aspect-[4/3] overflow-hidden rounded-[22px] lg:block"><img src={photo('oneOnOne', 1000, 750)} alt="Two colleagues reviewing work together at a desk" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /></div>
          </div>
        </div>
        <div className="space-y-16 lg:col-span-6 lg:col-start-7 lg:space-y-28">
          {items.map((it) => (
            <article key={it.t} data-principle>
              <h3 className="text-[clamp(28px,2.8vw,40px)] leading-[1.12]">{it.t}</h3>
              {it.b.map((p, i) => (
                <p key={i} className="mt-5 font-display text-[20px] leading-[1.65] text-ink/80" style={{ fontVariationSettings: '"opsz" 18' }}>{p}</p>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
