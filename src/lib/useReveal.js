import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { enterDelay } from '../components/Transition'

// Elements already on screen wait for the page curtain before they animate.
const wait = (el, d0) => (el.getBoundingClientRect().top < window.innerHeight ? d0 : 0)

/**
 * Scoped scroll reveals. Mark elements with:
 *  data-split      — headline split into masked lines that rise in
 *  data-fade       — fade + rise (use sparingly)
 *  data-stagger    — direct children reveal in sequence
 *  data-count="N"  — number counts up to N (data-decimals, data-suffix)
 *  data-draw       — SVG path draws on
 */
export default function useReveal(scope, deps = []) {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const root = scope.current
      if (!root) return
      const d0 = enterDelay()
      // A nested useReveal (e.g. PageHeader inside a page) owns its own elements; animating
      // them twice would make the second from() start at the hidden state and never show.
      root.setAttribute('data-reveal-scope', '')
      const own = (sel) => [...root.querySelectorAll(sel)].filter((el) => el.parentElement.closest('[data-reveal-scope]') === root)

      own('[data-split]').forEach((el) => {
        gsap.from(el, { y: 16, autoAlpha: 0, duration: 0.7, ease: 'power2.out', delay: wait(el, d0),
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
      })

      own('[data-fade]').forEach((el) => {
        gsap.from(el, { y: 16, autoAlpha: 0, duration: 0.7, ease: 'power2.out', delay: wait(el, d0) + Number(el.dataset.delay || 0),
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
      })

      own('[data-stagger]').forEach((el) => {
        gsap.from(el.children, { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: wait(el, d0),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })

      own('[data-draw]').forEach((el) => {
        const len = el.getTotalLength()
        gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut',
          scrollTrigger: { trigger: el.closest('svg'), start: 'top 85%', once: true } })
      })
    })

    // counters run regardless of motion preference (they only end on the real value)
    scope.current?.querySelectorAll('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count)
      const dec = Number(el.dataset.decimals || 0)
      const obj = { v: 0 }
      const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      el.textContent = fmt(0)
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(obj, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(obj.v)) }),
      })
    })
    return () => mm.revert()
  }, { scope, dependencies: deps })
}
