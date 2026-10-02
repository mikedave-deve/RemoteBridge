import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { gsap, useGSAP } from '../lib/gsap'
import { photo } from '../data/photos'

export default function CtaBand() {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.from('[data-cta] > *', { y: 16, autoAlpha: 0, stagger: 0.06, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: ref.current, start: 'top 70%', once: true } })
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-bridge-950 text-white">
      <img data-cta-img src={photo('eveningOffice', 2400)} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bridge-950/85 via-bridge-950/75 to-bridge-950" />
      <div data-cta className="frame relative py-32 text-center lg:py-48">
        <p className="kicker-light justify-center before:hidden">Ready when you are</p>
        <h2 className="mx-auto mt-6 max-w-5xl text-balance text-[clamp(42px,6vw,96px)] leading-[1] tracking-tightest text-white">
          The best job you have had might be the one you do from home.
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-[18px] text-white/70">
          Browse 100 open remote roles with verified US employers, or send us your résumé and let a recruiter find the right fit.
        </p>
        <div className="mt-11 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/jobs" className="btn-accent h-14 px-8 text-[16px]">Browse remote jobs <ArrowRight size={18} /></Link>
          <Link to="/about#contact" className="btn-outline-light h-14 px-8 text-[16px]">I’m an employer</Link>
        </div>
      </div>
    </section>
  )
}
