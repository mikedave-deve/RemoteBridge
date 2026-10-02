import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import useReveal from '../../lib/useReveal'
import { categories, countBy, jobs } from '../../data/jobs'
import { photo } from '../../data/photos'

export default function Sectors() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section ref={ref} className="bg-white py-24 lg:py-32">
      <div className="frame">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="kicker" data-fade>Browse by category</p>
            <h2 data-split className="mt-5 text-[clamp(40px,4.8vw,76px)] tracking-tightest">Find the work you already know how to do</h2>
          </div>
          <p data-fade className="text-[18px] leading-relaxed text-slate lg:col-span-4 lg:col-start-9">
            From your first data entry job to a senior accounting role, every category is staffed by recruiters who have done the work themselves.
          </p>
        </div>

        <ul data-stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <li key={c.name}>
              <Link to={`/jobs?dept=${encodeURIComponent(c.name)}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[22px] bg-bridge-900 xl:aspect-[5/6]">
                <img src={photo(c.photo, 900, 1000)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-bridge-950/95 via-bridge-950/35 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white">
                  <div>
                    <p className="text-[13px] font-medium text-bridge-200">{countBy('department', c.name)} open roles</p>
                    <h3 className="mt-1.5 text-[28px] leading-tight text-white">{c.name}</h3>
                    <p className="mt-1 text-[14px] text-white/70">{c.blurb}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur transition-all duration-500 group-hover:rotate-45 group-hover:bg-bridge-200 group-hover:text-bridge-950">
                    <ArrowUpRight size={18} strokeWidth={1.6} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link to="/jobs" className="btn-ghost h-12 px-6">See all {jobs.length} remote jobs</Link>
        </div>
      </div>
    </section>
  )
}
