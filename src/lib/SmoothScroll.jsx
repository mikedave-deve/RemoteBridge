import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis = null
export const getLenis = () => lenis

export default function SmoothScroll({ children }) {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(tick); lenis.destroy(); lenis = null }
  }, [])

  useEffect(() => {
    lenis?.start() // a new page always starts with scrolling enabled
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
    const id = setTimeout(() => {
      ScrollTrigger.refresh()
      const target = hash && document.querySelector(hash)
      if (target) lenis ? lenis.scrollTo(target, { offset: -90, duration: 1.6 }) : target.scrollIntoView()
    }, hash ? 900 : 120)
    return () => clearTimeout(id)
  }, [pathname, hash])

  return children
}
