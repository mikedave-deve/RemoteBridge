import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import useReveal from '../../lib/useReveal'
import { jobs, states, timezones } from '../../data/jobs'
import { photo } from '../../data/photos'

export default function States() {
  const ref = useRef(null)
  useReveal(ref)
  const anywhere = jobs.filter((j) => j.anywhere).length
  const byState = Object.entries(
    jobs.filter((j) => !j.anywhere).reduce((m, j) => ({ ...m, [j.state]: (m[j.state] || 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  return (
    <section ref={ref} className="bg-paper py-24 lg:py-36">
      <div className="frame grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="kicker" data-fade>Hiring in every state</p>
            <h2 data-split className="mt-5 text-[clamp(40px,4.6vw,72px)] tracking-tightest">Wherever you live, there is a role for you</h2>
            <p data-fade className="mt-6 max-w-lg text-[18px] leading-relaxed text-slate">
              {anywhere} of our open jobs accept applicants anywhere in the US. The rest are open to residents of specific states, usually for payroll or licensing reasons. We show which on every listing.
            </p>
            <dl data-stagger className="mt-10 grid grid-cols-4 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
              {timezones.map((t) => (
                <div key={t} className="bg-white p-4 sm:p-5">
                  <dt className="text-[13px] text-slate">{t}</dt>
                  <dd className="mt-1 font-display text-[30px] leading-none text-bridge-700">{jobs.filter((j) => j.timezone === t).length}</dd>
                </div>
              ))}
            </dl>
            <div data-fade className="relative mt-6 hidden aspect-[16/10] overflow-hidden rounded-[22px] lg:block">
              <img src={photo('highrise', 1200, 750)} alt="A team working by the windows of a high-rise office" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <Link to="/jobs?anywhere=1" data-fade className="group flex items-center justify-between gap-6 rounded-[22px] bg-bridge-900 p-7 text-white transition-colors hover:bg-bridge-800 sm:p-9">
            <span className="flex items-center gap-5">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-bridge-200"><Globe2 size={26} strokeWidth={1.4} /></span>
              <span>
                <span className="block font-display text-[30px] leading-tight">Anywhere in the US</span>
                <span className="mt-1 block text-[15px] text-white/65">Open to residents of all 50 states</span>
              </span>
            </span>
            <span className="font-display text-[44px] text-bridge-200">{anywhere}</span>
          </Link>
          <ul data-stagger className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byState.map(([code, n]) => (
              <li key={code}>
                <Link to={`/jobs?q=${encodeURIComponent(states[code][0])}`} className="group flex items-center justify-between rounded-2xl bg-white px-5 py-4 ring-1 ring-line transition-all duration-300 hover:-translate-y-0.5 hover:ring-bridge-300">
                  <span>
                    <span className="block text-[12px] font-semibold tracking-[0.14em] text-bridge-700">{code}</span>
                    <span className="block text-[16px] text-ink group-hover:text-bridge-700">{states[code][0]}</span>
                  </span>
                  <span className="text-[14px] text-slate" style={{ fontVariantNumeric: 'tabular-nums' }}>{n} {n === 1 ? 'job' : 'jobs'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
