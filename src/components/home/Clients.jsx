import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

// Invented client wordmarks, each set like a real brand would set itself.
const marks = [
  { n: 'Harborline', c: 'font-sans font-[800] tracking-[-0.04em] text-[30px]' },
  { n: 'Summit Ridge Health', c: 'font-display font-[500] text-[29px]' },
  { n: 'CLEARWATER', c: 'font-sans font-[600] tracking-[0.22em] text-[20px]' },
  { n: 'bluestem/financial', c: 'font-sans font-[500] tracking-[-0.02em] text-[24px]' },
  { n: 'Old Harbor Bank', c: 'font-display font-[500] text-[27px]' },
  { n: 'Copperline', c: 'font-sans font-[300] tracking-[0.04em] text-[28px]' },
  { n: 'Westbrook & Hale', c: 'font-display font-[700] tracking-[-0.03em] text-[28px]' },
  { n: 'Silverline', c: 'font-sans font-[700] tracking-[-0.03em] text-[27px]' },
  { n: 'Magnolia Benefits', c: 'font-display text-[28px]' },
  { n: 'IRONWOOD', c: 'font-sans font-[800] tracking-[0.08em] text-[19px]' },
]

export default function Clients() {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tween = gsap.to('[data-track]', { xPercent: -50, ease: 'none', duration: 48, repeat: -1 })
      const el = ref.current
      const slow = () => gsap.to(tween, { timeScale: 0.15, duration: 0.6 })
      const go = () => gsap.to(tween, { timeScale: 1, duration: 0.6 })
      el.addEventListener('pointerenter', slow); el.addEventListener('pointerleave', go)
      return () => { el.removeEventListener('pointerenter', slow); el.removeEventListener('pointerleave', go) }
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="border-b border-line bg-white py-12" aria-label="Companies hiring through RemoteBridge">
      <div className="frame mb-8 flex flex-col justify-between gap-2 text-[15px] text-slate sm:flex-row">
        <p>Trusted by 640 US employers, from family-owned practices to national brands.</p>
        <p className="text-slate-soft">Every employer verified before a single job is posted</p>
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div data-track className="flex w-max items-center">
          {[...marks, ...marks].map((m, i) => (
            <span key={i} aria-hidden={i >= marks.length} className={`mx-10 whitespace-nowrap text-ink/45 transition-colors duration-300 hover:text-bridge-700 sm:mx-14 ${m.c}`}>{m.n}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
