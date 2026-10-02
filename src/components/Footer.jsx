import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, MapPin, ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import { gsap, useGSAP } from '../lib/gsap'
import { site } from '../lib/siteData'

const cols = [
  { title: 'Find work', links: [['Browse all jobs', '/jobs'], ['Data entry jobs', '/jobs?dept=Data%20Entry'], ['Customer support jobs', '/jobs?dept=Customer%20Support'], ['Bookkeeping jobs', '/jobs?dept=Bookkeeping'], ['Payroll jobs', '/jobs?dept=Payroll']] },
  { title: 'Your account', links: [['Submit your résumé', '/submit-resume'], ['Create an account', '/create-account'], ['Log in', '/login'], ['Accounting jobs', '/jobs?dept=Accounting'], ['Admin jobs', '/jobs?dept=Administrative']] },
  { title: 'Company', links: [['About PremierRemoteBridge', '/about'], ['Our team', '/team'], ['For employers', '/about#employers'], ['Contact us', '/about#contact']] },
]

const WORD = 'PremierRemoteBridge'

export default function Footer() {
  const ref = useRef(null)
  const word = useRef(null)

  // Size the wordmark so it spans the full width of the footer, whatever the screen.
  useLayoutEffect(() => {
    const el = word.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = '100px'
      const w = el.scrollWidth
      const avail = el.parentElement.clientWidth
      if (w) el.style.fontSize = `${(100 * avail) / w}px`
    }
    fit()
    document.fonts?.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const chars = gsap.utils.toArray('[data-fchar]')
      // IntersectionObserver rather than ScrollTrigger: the footer sits at the very end of long pages,
      // where trigger positions can go stale as images above finish loading.
      const tl = gsap.timeline({ paused: true })
      tl.from(chars, { yPercent: 40, autoAlpha: 0, duration: 1.2, stagger: 0.04, ease: 'power3.out' })
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { tl.play(); io.disconnect() } }, { threshold: 0.25 })
      io.observe(word.current)
      gsap.from('[data-fcol]', { y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.08, scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } })
      return () => io.disconnect()
    })
  }, { scope: ref })

  return (
    <footer ref={ref} className="relative overflow-hidden bg-bridge-950 text-white/65">

      <div className="frame relative pt-24 lg:pt-28">
        <div data-fcol className="flex flex-col justify-between gap-8 border-b border-white/10 pb-14 lg:flex-row lg:items-end">
          <h2 className="max-w-3xl text-balance text-[clamp(36px,4.4vw,64px)] tracking-tightest text-white">
            Your next job could start at your kitchen table.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/jobs" className="btn-accent h-14 px-7 text-[16px]">Browse 100 remote jobs <ArrowRight size={18} /></Link>
            <Link to="/submit-resume" className="btn-outline-light h-14 px-7 text-[16px]">Submit your résumé</Link>
          </div>
        </div>

        <div className="grid gap-14 py-16 lg:grid-cols-12">
          <div data-fcol className="lg:col-span-4">
            <Logo tone="light" size="lg" />
            <p className="mt-7 max-w-sm text-[16px] leading-relaxed">
              PremierRemoteBridge connects people across all 50 states with vetted US employers hiring for fully remote, work-from-home roles.
            </p>
            <ul className="mt-7 space-y-2.5 text-[14px]">
              <li className="flex items-center gap-2.5"><MapPin size={16} className="text-bridge-200" /> {site.address}</li>
              <li className="flex items-center gap-2.5"><ShieldCheck size={16} className="text-bridge-200" /> SOC 2 Type II · E-Verify participant</li>
              <li className="flex items-center gap-2.5"><Lock size={16} className="text-bridge-200" /> Your data is stored in the United States</li>
            </ul>
          </div>
          {cols.map((c) => (
            <div data-fcol key={c.title} className="lg:col-span-2">
              <h3 className="font-sans text-[13px] font-semibold uppercase tracking-[0.18em] text-bridge-200">{c.title}</h3>
              <ul className="mt-6 space-y-3.5 text-[15px]">
                {c.links.map(([l, to]) => (
                  <li key={l}><Link to={to} className="link-u transition-colors hover:text-white">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div data-fcol className="lg:col-span-2">
            <h3 className="font-sans text-[13px] font-semibold uppercase tracking-[0.18em] text-bridge-200">New jobs weekly</h3>
            <form className="mt-6" onSubmit={(e) => { e.preventDefault(); e.currentTarget.reset() }}>
              <label htmlFor="news" className="text-[14px]">Get new remote roles in your inbox every Monday.</label>
              <input id="news" type="email" required placeholder="you@email.com" autoComplete="email"
                className="mt-4 h-12 w-full rounded-full bg-white/5 px-5 text-[15px] text-white ring-1 ring-white/15 placeholder:text-white/35 focus:outline-none focus:ring-bridge-200" />
              <button className="btn-light mt-3 h-11 w-full">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-7 text-[13.5px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PremierRemoteBridge, Inc. Equal opportunity employer. All jobs are 100% remote within the United States.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><a href="#" className="hover:text-white">Privacy policy</a></li>
            <li><a href="#" className="hover:text-white">Terms of use</a></li>
            <li><a href="#" className="hover:text-white">Do not sell my info</a></li>
            <li><a href="#" className="hover:text-white">Accessibility</a></li>
          </ul>
        </div>
      </div>

      <div className="relative px-3 pb-3 sm:px-5" aria-hidden="true">
        <div className="relative overflow-hidden">
          <p ref={word} className="inline-block whitespace-nowrap pr-[0.06em] font-sans font-[650] leading-[0.86] tracking-[-0.05em] select-none">
            {WORD.split('').map((c, i) => (
              <span key={i} data-fchar className={`inline-block bg-clip-text pt-[0.14em] pb-[0.2em] text-transparent `}
                style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.04) 100%)' }}>
                {c}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  )
}
