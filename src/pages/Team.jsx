import { useRef } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Img from '../components/Img'
import CtaBand from '../components/CtaBand'
import { leadership, people } from '../data/team'
import useReveal from '../lib/useReveal'
import { gsap, useGSAP } from '../lib/gsap'

export default function Team() {
  const ref = useRef(null)
  useReveal(ref)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('[data-portrait]').forEach((el) => {
        gsap.from(el, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        gsap.fromTo(el.querySelector('img, [role=img]'), { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })
    })
  }, { scope: ref })

  return (
    <div ref={ref}>
      <PageHeader kicker="Our team" image="teamDinner" title="180 people in 31 states. Most of them work from home, too."
        aside={<dl className="grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
          {[['180', 'Staff'], ['31', 'States'], ['14', 'Languages']].map(([n, l]) => (
            <div key={l}><dt className="sr-only">{l}</dt><dd><p className="font-display text-[40px] leading-none text-bridge-200">{n}</p><p className="mt-2 text-[14px] text-white/65">{l}</p></dd></div>))}
        </dl>} />

      <section className="bg-paper py-24 lg:py-32">
        <div className="frame">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 data-split className="text-[clamp(36px,4vw,56px)] tracking-tightest">Leadership</h2>
            <p data-fade className="max-w-md text-[17px] text-slate">Every member of our leadership team has hired, managed or worked on a remote team before joining PremierRemoteBridge.</p>
          </div>
          <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((p) => (
              <article key={p.name} className="group">
                <div data-portrait className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-bridge-100">
                  <Img src={p.img} alt={`Portrait of ${p.name}`} label={p.name} className="absolute inset-0 h-full w-full grayscale-[35%] transition-[filter,transform] duration-700 ease-expo group-hover:scale-[1.03] group-hover:grayscale-0" />
                  <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[13px] text-ink backdrop-blur">{p.city}</span>
                </div>
                <h3 className="mt-6 text-[26px]">{p.name}</h3>
                <p className="mt-1 text-[15px] text-bridge-700">{p.role}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-slate">{p.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-32">
        <div className="frame">
          <h2 data-split className="text-[clamp(36px,4vw,56px)] tracking-tightest">Recruiting and operations leads</h2>
          <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-6">
            {people.map((p) => (
              <article key={p.name} className="group">
                <div data-portrait className="relative aspect-square overflow-hidden rounded-[18px] bg-bridge-100">
                  <Img src={p.img} alt={`Portrait of ${p.name}`} label={p.name} className="absolute inset-0 h-full w-full grayscale-[35%] transition-[filter] duration-700 group-hover:grayscale-0" />
                </div>
                <h3 className="mt-4 font-sans text-[18px] font-medium tracking-normal">{p.name}</h3>
                <p className="text-[14px] text-slate">{p.role}, {p.city}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-mist py-24 lg:py-32">
        <div className="frame grid gap-12 lg:grid-cols-12">
          <h2 data-split className="text-[clamp(36px,4vw,56px)] tracking-tightest lg:col-span-5">How we work together</h2>
          <div data-stagger className="grid gap-px overflow-hidden rounded-[24px] bg-line ring-1 ring-line sm:grid-cols-2 lg:col-span-7">
            {[
              ['Written first', 'Decisions, proposals and handovers live in documents. Meetings are for the things writing cannot do.'],
              ['Core hours, not long hours', 'Every team agrees a shared window across US time zones. Outside it, nobody expects an instant reply.'],
              ['Paid like we pay others', 'Our own pay bands are published internally, by role and state, and reviewed every year.'],
              ['Together twice a year', 'Each team meets in person twice a year, in a city a different colleague calls home.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-white p-8"><h3 className="text-[24px]">{t}</h3><p className="mt-3 text-[15px] leading-relaxed text-slate">{d}</p></div>
            ))}
          </div>
        </div>
        <div className="frame mt-16 flex flex-col items-start justify-between gap-6 rounded-[24px] bg-bridge-900 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div><p className="font-display text-[30px]">Want to work with us?</p><p className="mt-2 text-white/70">We are hiring recruiters and payroll specialists in eight states.</p></div>
          <Link to="/jobs" className="btn-light">See PremierRemoteBridge roles</Link>
        </div>
      </section>
      <CtaBand />
    </div>
  )
}
