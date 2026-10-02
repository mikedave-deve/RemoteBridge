import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { photo } from '../../data/photos'

// Two rows drifting in opposite directions, speed nudged by scroll.
const rowA = [
  ['videoCall', 'Customer support lead', 'Tampa, FL'], ['openOffice', 'Client office', 'Chicago, IL'], ['homeDesk', 'Bookkeeper', 'Boise, ID'],
  ['pairWork', 'Payroll team', 'Atlanta, GA'], ['cafeLaptop', 'Virtual assistant', 'Austin, TX'], ['loftTeam', 'Client office', 'Denver, CO'],
]
const rowB = [
  ['couchCall', 'Account manager', 'Charlotte, NC'], ['roundtable', 'Employer onboarding', 'New York, NY'], ['twoAtLaptops', 'Data entry team', 'Columbus, OH'],
  ['homeVideo', 'Recruiting coordinator', 'Portland, OR'], ['whiteboard', 'Client workshop', 'Seattle, WA'], ['typing', 'Medical billing', 'Phoenix, AZ'],
]

function Row({ items, dir }) {
  return (
    <div data-row={dir} className="flex w-max gap-4 will-change-transform">
      {[...items, ...items].map(([k, role, city], i) => (
        <figure key={i} aria-hidden={i >= items.length} className="group relative h-[240px] w-[340px] shrink-0 overflow-hidden rounded-[20px] sm:h-[300px] sm:w-[440px] lg:h-[340px] lg:w-[500px]">
          <img src={photo(k, 1000, 680)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-bridge-950/80 via-transparent to-transparent" />
          <figcaption className="absolute bottom-5 left-5 text-white">
            <p className="text-[15px] font-medium">{role}</p>
            <p className="text-[13px] text-white/70">{city}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export default function Gallery() {
  const ref = useRef(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const a = gsap.to('[data-row="l"]', { xPercent: -50, ease: 'none', duration: 70, repeat: -1 })
      const b = gsap.fromTo('[data-row="r"]', { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 70, repeat: -1 })
      gsap.from('[data-gal-head] > *', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1.1, scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
      return () => { a.kill(); b.kill() }
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="overflow-hidden bg-bridge-950 py-24 text-white lg:py-32">
      <div data-gal-head className="frame mb-14 grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="kicker-light">Across America</p>
          <h2 className="mt-5 text-balance text-[clamp(40px,4.8vw,76px)] tracking-tightest text-white">Home offices, client offices and everything in between</h2>
        </div>
        <p className="text-[18px] leading-relaxed text-white/65 lg:col-span-4 lg:col-start-9">
          Our people work from spare rooms, kitchen tables and co-working spaces in every state. Our employers range from local practices to national brands.
        </p>
      </div>
      <div className="space-y-4">
        <Row items={rowA} dir="l" />
        <Row items={rowB} dir="r" />
      </div>
    </section>
  )
}
