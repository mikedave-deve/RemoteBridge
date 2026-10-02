import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, useGSAP } from '../lib/gsap'
import Logo from './Logo'

/**
 * First visit: a brief branded splash with a thin progress line, then a fade.
 * Later route changes: the new page simply fades in.
 */
let first = true
/** How long a page should wait before its own entrance animations. */
export const enterDelay = () => (first ? 1.5 : 0.05)

export default function Transition({ children }) {
  const { pathname } = useLocation()
  const splash = useRef(null)
  const page = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (first && splash.current) {
        gsap.timeline({ onComplete: () => { first = false } })
          .fromTo('[data-splash-bar]', { scaleX: 0 }, { scaleX: 1, duration: 1.15, ease: 'power2.inOut' })
          .to(splash.current, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, '+=0.1')
      }
      gsap.fromTo(page.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity,visibility', delay: first ? 1.3 : 0 })
    })
    mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set(splash.current, { autoAlpha: 0 }); first = false })
  }, { dependencies: [pathname], revertOnUpdate: false })

  return (
    <>
      <div ref={splash} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-white">
        <div className="flex flex-col items-center">
          <Logo size="lg" />
          <div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-line">
            <div data-splash-bar className="h-full origin-left scale-x-0 bg-bridge-600" />
          </div>
        </div>
      </div>
      <div ref={page} key={pathname}>{children}</div>
    </>
  )
}
