import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck } from 'lucide-react'
import { gsap, useGSAP } from '../../lib/gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { enterDelay } from '../Transition'
import { US_VIEWBOX, US_NATION, US_STATES, US_CITIES } from '../../data/usMap'
import { categories, jobs } from '../../data/jobs'
import { portrait } from '../../data/photos'
import { site } from '../../lib/siteData'

gsap.registerPlugin(MotionPathPlugin)

const by = Object.fromEntries(US_CITIES.map((c) => [c.id, c]))
const labelled = { nyc: 'r', chi: 'l', dal: 'r', den: 'r', sea: 'r', lax: 'r', atl: 'l', mia: 'l' }
// Worker home city → employer city, drawn as arcs over the map.
const routes = [['phx', 'chi'], ['atl', 'nyc'], ['sea', 'dal'], ['den', 'bos'], ['mia', 'chi'], ['lax', 'atl'], ['msp', 'hou'], ['clt', 'sfo']]
const arc = ([a, b]) => {
  const p = by[a], q = by[b]
  const mx = (p.x + q.x) / 2, my = Math.min(p.y, q.y) - 40 - Math.abs(p.x - q.x) * 0.16
  return `M${p.x} ${p.y} Q${mx} ${my} ${q.x} ${q.y}`
}

const zones = [['Eastern', 'America/New_York', 'ET'], ['Central', 'America/Chicago', 'CT'], ['Mountain', 'America/Denver', 'MT'], ['Pacific', 'America/Los_Angeles', 'PT']]

const placed = [
  { who: 'Data Entry Clerk', from: 'Phoenix, AZ', to: 'Lakeshore Supply Co., Chicago', days: 'Hired in 9 days' },
  { who: 'Customer Support Rep', from: 'Atlanta, GA', to: 'Old Harbor Bank, Boston', days: 'Hired in 6 days' },
  { who: 'Bookkeeper', from: 'Seattle, WA', to: 'Ironwood Payroll, Dallas', days: 'Hired in 11 days' },
  { who: 'Payroll Specialist', from: 'Denver, CO', to: 'Granite State Mutual, NH', days: 'Hired in 8 days' },
]

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id) }, [])
  return now
}
const timeIn = (tz, d) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(d)
const hourIn = (tz, d) => Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(d))

export default function Hero() {
  const ref = useRef(null)
  const video = useRef(null)
  const now = useClock()
  const nav = useNavigate()
  const [p, setP] = useState(0)
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')

  useEffect(() => { const id = setInterval(() => setP((i) => (i + 1) % placed.length), 4800); return () => clearInterval(id) }, [])
  useEffect(() => { video.current?.play?.().catch(() => {}) }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const d = enterDelay()
      // One calm entrance for the whole hero; the video and map stay still.
      gsap.timeline({ delay: d, defaults: { ease: 'power2.out', duration: 0.7 } })
        .from('[data-hero-title], [data-hero-sub] > *', { y: 18, autoAlpha: 0, stagger: 0.06 })
        .from('[data-chart]', { y: 18, autoAlpha: 0 }, 0.15)
        .from('[data-stat]', { autoAlpha: 0, stagger: 0.05 }, 0.3)

      // Placement routes draw slowly across the map, one at a time.
      gsap.utils.toArray('[data-route]').forEach((path, i) => {
        const len = path.getTotalLength()
        const dot = ref.current.querySelector(`[data-pulse="${i}"]`)
        const loop = gsap.timeline({ repeat: -1, repeatDelay: 3, delay: d + 0.8 + i * 0.7 })
        loop.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' })
          .fromTo(dot, { autoAlpha: 1 }, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.8, ease: 'power2.inOut', immediateRender: false }, 0)
          .to(dot, { autoAlpha: 0, duration: 0.3 })
          .to(path, { strokeDashoffset: -len, duration: 1.4, ease: 'power2.inOut' }, '+=2')
      })
    })
  }, { scope: ref })

  useGSAP(() => {
    gsap.fromTo('[data-ticket] > *', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.8, ease: 'expo.out' })
  }, { scope: ref, dependencies: [p] })

  const submit = (e) => {
    e.preventDefault()
    const s = new URLSearchParams()
    if (q.trim()) s.set('q', q.trim().slice(0, 80))
    if (dept) s.set('dept', dept)
    nav(`/jobs${s.toString() ? `?${s}` : ''}`)
  }

  const pl = placed[p]
  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-bridge-950 text-white">
      <div data-video-wrap className="absolute inset-0 -z-20">
        <video ref={video} data-video className="h-full w-full object-cover" src="/media/hero-office.mp4" poster="/media/hero-office.jpg"
          autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bridge-950/95 via-bridge-950/70 to-bridge-950/40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bridge-950 via-transparent to-bridge-950/60" />

      <div data-hero-content className="frame relative grid flex-1 items-center gap-14 pt-36 pb-12 lg:grid-cols-12 lg:gap-10 lg:pt-40">
        <div className="lg:col-span-7">
          <h1 data-hero-title className="text-balance text-[clamp(48px,6.6vw,112px)] leading-[0.95] tracking-tightest text-white">
            {site.heroTitle}
          </h1>
          <div data-hero-sub>
            <p className="mt-8 max-w-[58ch] text-[19px] leading-relaxed text-white/75">
              {site.heroSubtitle}
            </p>

            <form onSubmit={submit} role="search" className="mt-10 flex max-w-[760px] flex-col gap-2 rounded-[22px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] sm:flex-row sm:rounded-full">
              <label className="relative flex-1">
                <span className="sr-only">Job title or keyword</span>
                <Search size={20} strokeWidth={1.6} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-soft" />
                <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Job title, skill or company"
                  className="h-14 w-full rounded-full bg-transparent pl-14 pr-4 text-[16px] text-ink placeholder:text-slate-soft focus:outline-none" />
              </label>
              <label className="relative sm:w-[230px] sm:border-l sm:border-line">
                <span className="sr-only">Category</span>
                <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-14 w-full appearance-none rounded-full bg-transparent pl-5 pr-10 text-[16px] text-ink focus:outline-none">
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate" viewBox="0 0 12 12"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
              </label>
              <button className="btn-dark h-14 px-8 text-[16px]">Search jobs</button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-[14px]">
              <span className="mr-1 text-white/55">Popular:</span>
              {['Data Entry', 'Customer Support', 'Bookkeeping', 'Payroll', 'Administrative', 'Accounting'].map((c) => (
                <Link key={c} to={`/jobs?dept=${encodeURIComponent(c)}`} className="rounded-full bg-white/10 px-3.5 py-1.5 text-white/85 ring-1 ring-white/15 transition-colors hover:bg-white hover:text-bridge-900">{c}</Link>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-[14px] text-white/70">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {['w4', 'm3', 'w2', 'm7', 'w5'].map((k) => (
                    <img key={k} src={portrait(k, 96)} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-bridge-900" />
                  ))}
                </div>
                <span><strong className="font-semibold text-white">12,400+</strong> Americans placed in remote jobs</span>
              </div>
              <span className="flex items-center gap-2"><ShieldCheck size={18} strokeWidth={1.6} className="text-bridge-200" /> Every employer verified</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div data-chart className="relative rounded-[28px] bg-bridge-950/80 p-5 ring-1 ring-white/15 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="font-display text-[23px] text-white">Hiring across America</p>
              <div className="flex items-center gap-4 text-[12px] text-white/60">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-bridge-200" /> Working hours</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-[1.5px] ring-inset ring-bridge-200" /> After hours</span>
              </div>
            </div>
            <svg viewBox={US_VIEWBOX} className="mt-4 w-full" role="img" aria-label="Map of the United States showing cities where PremierRemoteBridge professionals work and the employers they joined">
              <path data-state d={US_NATION} fill="rgba(255,255,255,.07)" stroke="rgba(127,185,195,.45)" strokeWidth="1.2" strokeLinejoin="round" />
              <path data-state d={US_STATES} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth=".8" strokeLinejoin="round" />
              {routes.map((r, i) => (
                <g key={i}>
                  <path d={arc(r)} stroke="rgba(255,255,255,.12)" strokeWidth="1.4" fill="none" />
                  <path data-route d={arc(r)} stroke="#AFD5DB" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  <circle data-pulse={i} r="6" fill="#FFFFFF" opacity="0" />
                </g>
              ))}
              {US_CITIES.map((c) => {
                const h = hourIn(c.tz, now)
                const working = h >= 8 && h < 18
                const side = labelled[c.id]
                return (
                  <g key={c.id}>
                    <g data-node>
                      {working && <circle cx={c.x} cy={c.y} r="15" fill="#AFD5DB" opacity=".18" />}
                      <circle cx={c.x} cy={c.y} r="6.5" fill={working ? '#AFD5DB' : '#0B3640'} stroke="#AFD5DB" strokeWidth="2.2" />
                    </g>
                    {side && (
                      <g data-label style={{ fontFamily: 'Hanken Grotesk Variable, sans-serif' }}>
                        <text x={side === 'l' ? c.x - 14 : c.x + 14} y={c.y - 3} textAnchor={side === 'l' ? 'end' : 'start'} fill="#fff" fontSize="21" fontWeight="600">{c.name}</text>
                        <text x={side === 'l' ? c.x - 14 : c.x + 14} y={c.y + 19} textAnchor={side === 'l' ? 'end' : 'start'} fill="rgba(255,255,255,.6)" fontSize="18" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeIn(c.tz, now)}</text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
            <dl className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
              {zones.map(([name, tz, abbr]) => (
                <div key={abbr} className="bg-bridge-950/60 px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-white/50"><span className="sm:hidden">{abbr}</span><span className="hidden sm:inline">{name}</span></dt>
                  <dd className="mt-0.5 text-[15px] font-medium text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeIn(tz, now)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 rounded-2xl bg-white p-5 text-ink" aria-live="polite">
              <div data-ticket>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bridge-700">Just hired</p>
                <p className="mt-1.5 font-display text-[22px] leading-tight">{pl.who}</p>
                <p className="mt-1 text-[14px] text-slate">{pl.from} → {pl.to}</p>
                <p className="mt-3 border-t border-line pt-3 text-[13px] text-bridge-700">{pl.days}, working from home</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-bridge-950/80">
        <dl className="frame grid grid-cols-2 gap-y-6 py-7 lg:grid-cols-4">
          {[[`${jobs.length}`, 'Open remote jobs'], ['50', 'States we hire in'], ['5 days', 'Average recruiter reply'], ['$0', 'Cost to apply, ever']].map(([n, l], i) => (
            <div key={l} data-stat className={`${i ? 'lg:border-l lg:border-white/10 lg:pl-8' : ''} ${i % 2 ? 'border-l border-white/10 pl-6 lg:pl-8' : ''}`}>
              <dt className="sr-only">{l}</dt>
              <dd><p className="font-display text-[clamp(30px,3vw,44px)] leading-none text-white">{n}</p><p className="mt-2 text-[14px] text-white/60">{l}</p></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
