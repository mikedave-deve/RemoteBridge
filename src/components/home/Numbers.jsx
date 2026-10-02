import { useRef } from 'react'
import useReveal from '../../lib/useReveal'

const stats = [
  { n: 12400, s: '+', label: 'Americans placed in remote jobs', note: 'in data entry, support, finance, admin, healthcare and more' },
  { n: 93, s: '%', label: 'Still in the job after 12 months', note: 'compared with an industry average near 70% for remote hires' },
  { n: 9, s: ' days', label: 'Median time from application to offer', note: 'for entry-level and mid-level roles in 2025' },
  { n: 50, s: '', label: 'States we hire in', note: 'plus Washington, D.C., with payroll and tax handled in each' },
]

export default function Numbers() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section ref={ref} className="bg-white py-24 lg:py-36">
      <div className="frame">
        <div className="grid gap-8 lg:grid-cols-12">
          <h2 data-split className="text-balance text-[clamp(38px,4.4vw,64px)] tracking-tightest lg:col-span-6">Measured by who stays, not just who starts.</h2>
          <p data-fade className="lede self-end lg:col-span-5 lg:col-start-8">
            A placement only counts when it lasts. We track retention, pay accuracy and satisfaction for every person we place, on both sides, and publish the numbers every year.
          </p>
        </div>
        <dl className="mt-20 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`border-b border-line py-10 sm:pr-8 ${i % 2 ? 'sm:border-l sm:pl-8' : ''} lg:border-b-0 ${i ? 'lg:border-l lg:pl-8' : ''}`}>
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <p className="font-display text-[clamp(56px,6vw,92px)] leading-none tracking-[-0.04em] text-bridge-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span data-count={s.n}>{s.n.toLocaleString('en-US')}</span><span className={`text-bridge-400 ${s.s.length > 2 ? 'ml-2 text-[0.38em] tracking-normal' : ''}`}>{s.s.trim()}</span>
                </p>
                <p className="mt-5 text-[17px] font-medium text-ink">{s.label}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate">{s.note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
