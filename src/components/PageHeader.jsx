import { useRef } from 'react'
import useReveal from '../lib/useReveal'
import { gsap, useGSAP } from '../lib/gsap'
import { photo } from '../data/photos'
import { enterDelay } from './Transition'

export default function PageHeader({ kicker, title, children, aside, image = 'openOffice', compact = false }) {
  const ref = useRef(null)
  useReveal(ref)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-ph-img]', { scale: 1.06 }, { scale: 1, duration: 1, ease: 'power2.out', delay: enterDelay() })
      gsap.to('[data-ph-wrap]', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true } })
    })
  }, { scope: ref })

  return (
    <section ref={ref} className={`relative isolate overflow-hidden bg-bridge-950 text-white ${compact ? 'pt-40 pb-16 lg:pt-44 lg:pb-20' : 'flex min-h-[640px] items-end pt-44 pb-20 lg:min-h-[78vh] lg:pb-24'}`}>
      <div data-ph-wrap className="absolute inset-0 -z-10">
        <img data-ph-img src={photo(image, 2200)} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bridge-950 via-bridge-950/75 to-bridge-950/45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bridge-950/80 via-bridge-950/30 to-transparent" />
      <div className="frame relative grid w-full gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          {kicker && <p className="kicker-light" data-fade>{kicker}</p>}
          <h1 data-split className="mt-6 text-balance text-[clamp(44px,6.4vw,104px)] leading-[0.98] tracking-tightest text-white">{title}</h1>
        </div>
        {(children || aside) && (
          <div className="lg:col-span-4" data-fade data-delay=".2">
            {children && <p className="text-[18px] leading-relaxed text-white/75">{children}</p>}
            {aside}
          </div>
        )}
      </div>
    </section>
  )
}
