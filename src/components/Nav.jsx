import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import Logo from './Logo'
import { gsap } from '../lib/gsap'
import { getLenis } from '../lib/SmoothScroll'
import { jobs } from '../data/jobs'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/jobs', label: 'Browse jobs' },
  { to: '/submit-resume', label: 'Submit résumé' },
  { to: '/about', label: 'About' },
  { to: '/team', label: 'Our team' },
]

// Pages that open on a dark photo header, so the bar starts in its light version.
const darkTop = (p) => /^\/(jobs|submit-resume|about|team)?(\/|$)/.test(p)

// The bar has no background, so its text follows whatever sits behind it:
// find the first solid background under the bar and check how dark it is.
const darkBehind = (header) => {
  const y = header.offsetHeight / 2
  const el = document.elementsFromPoint(window.innerWidth / 2, y).find((n) => !header.contains(n) && n.id !== 'mobile-menu')
  for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)
    if (m && (m[3] === undefined || +m[3] > 0.5)) return 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2] < 140
  }
  return false
}

export default function Nav() {
  const [overDark, setOverDark] = useState(null)
  const [open, setOpen] = useState(false)
  const header = useRef(null)
  const menuRef = useRef(null)
  const openRef = useRef(false)
  const { pathname } = useLocation()
  const onDark = overDark === null ? darkTop(pathname) : overDark

  // Hide on scroll down, reveal on scroll up. A small travel threshold stops the
  // bar from twitching on tiny direction changes.
  useEffect(() => {
    const el = header.current
    let last = window.scrollY
    let travel = 0
    let shown = true
    let dark = null
    let raf = 0
    const check = () => {
      raf = 0
      const v = window.scrollY < 30 ? null : darkBehind(el)
      if (v !== dark) { dark = v; setOverDark(v) }
    }
    const show = (v) => {
      if (v === shown) return
      shown = v
      gsap.to(el, v
        ? { yPercent: 0, duration: 0.75, ease: 'expo.out', overwrite: true }
        : { yPercent: -110, duration: 0.6, ease: 'power3.inOut', overwrite: true })
    }
    const onScroll = () => {
      const y = Math.max(0, window.scrollY)
      const d = y - last
      last = y
      if (d === 0) return
      if (Math.sign(d) !== Math.sign(travel)) travel = 0
      travel += d
      if (y < 140 || openRef.current) show(true)
      else if (travel > 18) show(false)
      else if (travel < -18) show(true)
      if (!raf) raf = requestAnimationFrame(check)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  // The open menu pauses page scrolling. If the bar unmounts while it is open (e.g. a menu link to
  // /login or /create-account, which hide the bar), make sure scrolling is switched back on.
  useEffect(() => () => getLenis()?.start(), [])

  useEffect(() => {
    setOpen(false)
    gsap.to(header.current, { yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: true })
  }, [pathname])

  useEffect(() => {
    openRef.current = open
    const lenis = getLenis()
    const el = menuRef.current
    if (!el) return
    if (open) {
      lenis?.stop()
      gsap.set(el, { display: 'flex' })
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
      gsap.from(el.querySelectorAll('[data-m]'), { yPercent: 100, autoAlpha: 0, stagger: 0.05, delay: 0.3, duration: 0.9 })
    } else {
      lenis?.start()
      gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', onComplete: () => gsap.set(el, { display: 'none' }) })
    }
  }, [open])

  const light = onDark || open
  return (
    <>
      <header ref={header}
        className="fixed inset-x-0 top-0 z-50 bg-transparent will-change-transform">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <nav className="frame flex h-[84px] items-center justify-between gap-6" aria-label="Main">
          <Link to="/" aria-label="PremierRemoteBridge home" className="relative z-50 shrink-0">
            <Logo size="xs" tone={light ? 'light' : 'brand'} className="sm:hidden" />
            <Logo tone={light ? 'light' : 'brand'} className="hidden sm:inline-flex" />
          </Link>
          <ul className="hidden items-center gap-1 xl:flex">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end}
                  className={({ isActive }) => `rounded-full px-4 py-2 text-[15px] transition-colors duration-200 ${
                    light ? (isActive ? 'font-medium text-white' : 'text-white/70 hover:text-white') : (isActive ? 'font-medium text-ink' : 'text-ink/65 hover:text-ink')}`}>
                  {l.label}
                  {l.to === '/jobs' && <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${light ? 'bg-white/15 text-white' : 'bg-bridge-50 text-bridge-700'}`}>{jobs.length}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/login" className={`px-3 py-2 text-[15px] transition-colors ${light ? 'text-white/80 hover:text-white' : 'text-ink/75 hover:text-ink'}`}>Log in</Link>
            <Link to="/create-account" className={`${light ? 'btn-outline-light' : 'btn-ghost'} h-11 px-5`}>Create account</Link>
            <Link to="/jobs" className="btn-accent group h-11 px-5">
              Browse jobs <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="flex items-center gap-2 xl:hidden">
            <Link to="/jobs" className={`btn-accent hidden h-10 px-4 text-[14px] sm:inline-flex lg:hidden ${open ? 'invisible' : ''}`}>Browse jobs</Link>
            <button
              className={`relative z-50 grid h-11 w-11 place-items-center rounded-full ${light ? 'text-white' : 'text-ink'}`}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X size={24} strokeWidth={1.6} /> : <Menu size={24} strokeWidth={1.6} />}
            </button>
          </div>
        </nav>
      </header>

      <div id="mobile-menu" ref={menuRef} style={{ display: 'none' }}
        className="fixed inset-0 z-40 flex-col justify-between bg-bridge-950 px-5 pb-10 pt-28 text-white sm:px-8 xl:hidden">
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.to} className="overflow-hidden">
              <Link data-m to={l.to} className="flex items-baseline gap-3 py-2 font-display text-[42px] leading-tight tracking-tight">
                {l.label}{l.to === '/jobs' && <span className="font-sans text-[14px] text-bridge-200">{jobs.length} open</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div data-m className="flex flex-col gap-3 sm:flex-row">
          <Link to="/jobs" className="btn-accent">Browse all jobs</Link>
          <Link to="/create-account" className="btn-light">Create account</Link>
          <Link to="/login" className="btn-outline-light">Log in</Link>
        </div>
      </div>
    </>
  )
}
