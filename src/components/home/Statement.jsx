import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import Img from '../Img'
import { photo } from '../../data/photos'

export default function Statement() {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-words]', { y: 16, autoAlpha: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '[data-words]', start: 'top 85%', once: true } })
      gsap.fromTo('[data-plx] img, [data-plx] [role=img]', { yPercent: -6 }, { yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '[data-plx]', start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.from('[data-side-img]', { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '[data-words]', start: 'top 85%', once: true } })
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="bg-paper py-24 lg:py-36">
      <div className="frame grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-8">
          <p className="kicker">Why we exist</p>
          <p data-words className="mt-8 text-balance font-display text-[clamp(30px,3.9vw,62px)] leading-[1.1] tracking-[-0.025em] text-ink">
            Good work should not depend on your zip code. Since 2018 we have helped 12,400 Americans build real careers from home, in small towns and big cities, and helped 640 US employers hire with the same care they would give someone across the hall.
          </p>
        </div>
        <div className="hidden gap-4 lg:col-span-4 lg:grid lg:grid-cols-2">
          <div data-side-img className="relative mt-16 aspect-[3/4] overflow-hidden rounded-[22px]"><Img src={photo('couchCall', 600, 800)} alt="A woman on a call while working from her living room" className="absolute inset-0 h-full w-full" /></div>
          <div data-side-img className="relative aspect-[3/4] overflow-hidden rounded-[22px]"><Img src={photo('officeLead', 600, 800)} alt="A team lead standing in a bright open office" className="absolute inset-0 h-full w-full" /></div>
        </div>
      </div>
      <div className="frame mt-20 lg:mt-24">
        <div data-plx className="relative h-[56vh] min-h-[380px] overflow-hidden rounded-[28px] lg:h-[82vh]">
          <Img src={photo('highFive', 2400)} alt="Two colleagues celebrating a result at their desks"
            label="Premier Remote Bridge" className="absolute inset-0 -top-[6%] h-[112%] w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-bridge-950/85 via-bridge-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 grid gap-6 p-6 text-white sm:p-10 md:grid-cols-3 lg:p-14">
            {[
              ['Verified employers only', 'Every company is checked: business registration, a real hiring manager and a confirmed pay range.'],
              ['W-2 jobs with benefits', 'Most of our roles are full employment with health insurance, 401(k) and paid time off.'],
              ['A recruiter who replies', 'A real person reviews your application within five business days, whatever the answer.'],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-white/25 pt-5">
                <p className="font-display text-[24px]">{t}</p>
                <p className="mt-2 text-[15.5px] leading-relaxed text-white/75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
