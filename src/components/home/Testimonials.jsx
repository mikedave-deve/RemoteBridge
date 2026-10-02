import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { gsap, useGSAP } from '../../lib/gsap'
import { portrait } from '../../data/photos'

const quotes = [
  { q: 'I went from a two-hour commute to a desk in my spare room. Same company benefits, a better paycheck, and I am home when my kids get off the bus.', who: 'Tanya Morales', role: 'Data Entry Specialist, Harborline Insurance', place: 'El Paso, TX', side: 'Job seeker', img: 'w4' },
  { q: 'We needed six customer support reps across three time zones in a month. RemoteBridge sent shortlists in eight days and handled payroll registration in four new states.', who: 'Greg Whitfield', role: 'VP Customer Experience, Old Harbor Bank', place: 'Boston, MA', side: 'Employer', img: 'm5' },
  { q: 'It was the first time I knew the pay before the first call. My recruiter told me exactly what to expect in the interview, and I had an offer ten days later.', who: 'Andre Williams', role: 'Bookkeeper, Westbrook & Hale CPAs', place: 'Columbus, OH', side: 'Job seeker', img: 'm7' },
  { q: 'Our payroll team is fully remote now, spread across five states. Every one of them came through RemoteBridge, and every one is still here.', who: 'Linda Park', role: 'Controller, Ironwood Payroll Services', place: 'Dallas, TX', side: 'Employer', img: 'w8' },
]

export default function Testimonials() {
  const ref = useRef(null)
  const [i, setI] = useState(0)
  const { contextSafe } = useGSAP({ scope: ref })

  const go = contextSafe((dir) => {
    const next = (i + dir + quotes.length) % quotes.length
    gsap.timeline()
      .to('[data-q], [data-qimg]', { yPercent: -4 * dir, autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: () => setI(next) })
      .fromTo('[data-q], [data-qimg]', { yPercent: 4 * dir, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', immediateRender: false })
  })

  const t = quotes[i]
  return (
    <section ref={ref} className="bg-mist py-24 lg:py-36" aria-roledescription="carousel" aria-label="What job seekers and employers say">
      <div className="frame grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <div data-qimg className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-bridge-100">
            <img src={portrait(t.img, 900)} alt={`Portrait of ${t.who}`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bridge-950/85 to-transparent p-6 pt-20 text-white">
              <p className="font-medium">{t.who}</p>
              <p className="text-[14px] text-white/70">{t.place}</p>
            </div>
            <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[13px] text-ink backdrop-blur">{t.side}</span>
          </div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <h2 className="text-[clamp(32px,3vw,44px)] tracking-tightest">In their words</h2>
          <figure data-q className="mt-10" aria-live="polite">
            <svg width="44" height="34" viewBox="0 0 44 34" className="text-bridge-400" aria-hidden="true"><path fill="currentColor" d="M0 34V20C0 8 6 1.5 18 0l1.6 4.4C12.6 6 9.6 10 9.4 16H18v18H0Zm26 0V20c0-12 6-18.5 18-20l1.6 4.4C38.6 6 35.6 10 35.4 16H44v18H26Z" /></svg>
            <blockquote className="mt-8 text-balance font-display text-[clamp(28px,3vw,46px)] leading-[1.2] tracking-[-0.02em] text-ink">{t.q}</blockquote>
            <figcaption className="mt-10 border-t border-line pt-6">
              <p className="font-medium text-ink">{t.who}</p>
              <p className="text-[15px] text-slate">{t.role}</p>
            </figcaption>
          </figure>
          <div className="mt-10 flex items-center gap-4">
            <button onClick={() => go(-1)} className="grid h-12 w-12 place-items-center rounded-full bg-white ring-1 ring-line transition-colors hover:bg-bridge-700 hover:text-white hover:ring-bridge-700" aria-label="Previous testimonial"><ArrowLeft size={18} /></button>
            <button onClick={() => go(1)} className="grid h-12 w-12 place-items-center rounded-full bg-white ring-1 ring-line transition-colors hover:bg-bridge-700 hover:text-white hover:ring-bridge-700" aria-label="Next testimonial"><ArrowRight size={18} /></button>
            <span className="ml-2 text-[14px] text-slate" style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1} of {quotes.length}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
