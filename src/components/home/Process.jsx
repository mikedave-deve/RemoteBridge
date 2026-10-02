import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { photo } from '../../data/photos'

const steps = [
  { when: 'Day 1', title: 'Apply in minutes', img: 'resume', body: 'Choose a job, or send your résumé once for every category. No account required, and you never pay a fee.', detail: ['Résumé upload', '5-minute form', 'Free to apply'] },
  { when: 'Days 2–5', title: 'Talk to a recruiter', img: 'headphones', body: 'A PremierRemoteBridge recruiter who knows your field calls you to talk about the work you want, the hours that suit you and the pay you expect.', detail: ['20-minute call', 'Pay expectations', 'Schedule fit'] },
  { when: 'Week 2', title: 'Show your skills', img: 'typing', body: 'A short, practical check that mirrors the real job: a typing test, a sample reconciliation or a mock support ticket. Nothing unpaid or open-ended.', detail: ['Typing test', 'Practical exercise', 'Written feedback'] },
  { when: 'Weeks 2–3', title: 'Meet the employer', img: 'videoCall', body: 'A video interview with the hiring manager. Your recruiter prepares you beforehand and reports back within two business days.', detail: ['Video interview', 'Interview prep', 'Fast feedback'] },
  { when: 'Week 4', title: 'Start from home', img: 'homeDesk', body: 'Sign your offer online. Your laptop ships to your door, payroll and benefits are set up, and your recruiter checks in after 30 and 90 days.', detail: ['Laptop shipped', 'Direct deposit', '30 and 90-day check-ins'] },
]

export default function Process() {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const track = ref.current.querySelector('[data-htrack]')
      const dist = () => track.scrollWidth - window.innerWidth + 96
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
      })
      gsap.to('[data-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${dist()}`, scrub: true } })
      gsap.utils.toArray('[data-step]').forEach((el) => {
        gsap.from(el.querySelectorAll('[data-in]'), { y: 40, autoAlpha: 0, stagger: 0.07, duration: 1,
          scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 80%', once: true } })
      })
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="relative overflow-hidden bg-bridge-900 text-white lg:h-screen">
      <div className="flex h-full flex-col py-24 lg:py-0">
        <div className="frame flex shrink-0 flex-col justify-between gap-6 lg:flex-row lg:items-end lg:pt-28">
          <h2 className="max-w-2xl text-balance text-[clamp(40px,5vw,72px)] tracking-tightest text-white">How you get hired</h2>
          <p className="max-w-sm text-[17px] text-white/65">Five steps, one recruiter by your side. Most people go from application to first day in under four weeks.</p>
        </div>
        <div className="frame mt-10 hidden shrink-0 lg:block">
          <div className="h-px w-full bg-white/10"><div data-progress className="h-px origin-left scale-x-0 bg-bridge-300" /></div>
        </div>
        <div className="mt-12 flex-1 lg:mt-0 lg:flex lg:items-center">
          <ol data-htrack className="frame flex flex-col gap-5 lg:w-max lg:max-w-none lg:flex-row lg:gap-6 lg:pr-24 lg:pl-[max(3.5rem,calc((100vw-1680px)/2+3.5rem))] 2xl:pl-[max(5rem,calc((100vw-1680px)/2+5rem))]">
            {steps.map((s, i) => (
              <li key={s.title} data-step className="relative flex flex-col rounded-[24px] bg-white/[0.04] p-8 ring-1 ring-white/10 lg:h-[66vh] lg:max-h-[620px] lg:w-[440px] xl:w-[500px] sm:p-8">
                <div data-in className="relative -mx-8 -mt-8 mb-6 h-40 overflow-hidden rounded-t-[24px] sm:h-44 lg:h-[34%] lg:max-h-[220px]"><img src={photo(s.img, 1000, 500)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-bridge-900/90 to-transparent" /></div>
                <div data-in className="flex items-baseline justify-between">
                  <span className="font-display text-[56px] leading-none text-bridge-200/90 lg:text-[72px]">{i + 1}</span>
                  <span className="text-[14px] text-white/55">{s.when}</span>
                </div>
                <h3 data-in className="mt-5 text-[30px] text-white lg:mt-auto">{s.title}</h3>
                <p data-in className="mt-4 text-[16px] leading-relaxed text-white/70">{s.body}</p>
                <ul data-in className="mt-6 flex flex-wrap gap-2">
                  {s.detail.map((d) => <li key={d} className="rounded-full px-3 py-1.5 text-[13px] text-white/80 ring-1 ring-white/15">{d}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
