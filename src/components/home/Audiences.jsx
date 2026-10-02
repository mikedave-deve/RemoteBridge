import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import useReveal from '../../lib/useReveal'
import { photo } from '../../data/photos'

const sides = [
  {
    id: 'pros', title: 'For job seekers', lead: 'A real job, from home, with a real paycheck.',
    body: 'We only post roles we have confirmed with the hiring manager. You see the pay, the schedule and the time zone before you apply, and you get an answer either way.',
    points: ['Pay range on every listing', 'One recruiter from application to offer', 'W-2 roles with health benefits', 'Free to apply, always'],
    cta: ['Browse open jobs', '/jobs'], tone: 'light', img: 'homeVideo', alt: 'A man on a video interview from his home office',
  },
  {
    id: 'employers', title: 'For US employers', lead: 'Vetted remote staff in any state, without the paperwork.',
    body: 'Tell us the role. We source, screen and shortlist candidates, then handle multi-state payroll, tax registration and onboarding so your new hire starts on time.',
    points: ['Shortlist of three in ten business days', 'Payroll and tax in all 50 states', 'Background and E-Verify checks', 'Free replacement within 90 days'],
    cta: ['Hire through PremierRemoteBridge', '/about#contact'], tone: 'dark', img: 'boardroom', alt: 'A hiring team meeting in a glass-walled boardroom',
  },
]

export default function Audiences() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section ref={ref} className="bg-paper pb-24 lg:pb-36">
      <div className="frame grid gap-5 lg:grid-cols-2">
        {sides.map((s) => {
          const dark = s.tone === 'dark'
          return (
            <article key={s.id} id={s.id} data-fade className={`relative flex scroll-mt-24 flex-col overflow-hidden rounded-[28px] ${dark ? 'bg-bridge-900 text-white' : 'bg-white ring-1 ring-line'}`}>
              <div className="relative h-[280px] overflow-hidden sm:h-[340px]">
                <img src={photo(s.img, 1400, 700)} alt={s.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${dark ? 'from-bridge-900' : 'from-white'} via-transparent to-transparent`} />
                <span className={`absolute left-6 top-6 rounded-full px-4 py-1.5 text-[13px] font-medium backdrop-blur sm:left-10 ${dark ? 'bg-bridge-950/60 text-bridge-200' : 'bg-white/85 text-bridge-700'}`}>{s.title}</span>
              </div>
              <div className="flex flex-1 flex-col p-8 pt-2 sm:p-12 sm:pt-2">
                <h2 className={`text-balance text-[clamp(32px,3.2vw,48px)] ${dark ? 'text-white' : ''}`}>{s.lead}</h2>
                <p className={`mt-6 max-w-[56ch] text-[17px] leading-relaxed ${dark ? 'text-white/70' : 'text-slate'}`}>{s.body}</p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {s.points.map((p) => (
                    <li key={p} className={`flex gap-3 text-[15px] ${dark ? 'text-white/85' : 'text-ink'}`}>
                      <Check size={18} strokeWidth={2} className={`mt-0.5 shrink-0 ${dark ? 'text-bridge-200' : 'text-bridge-500'}`} />{p}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-12">
                  <Link to={s.cta[1]} className={dark ? 'btn-accent' : 'btn-primary'}>{s.cta[0]}</Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
