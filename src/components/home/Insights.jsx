import { useRef } from 'react'
import { insights } from '../../data/insights'
import { photo } from '../../data/photos'
import useReveal from '../../lib/useReveal'

export default function Insights() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section ref={ref} className="bg-paper py-24 lg:py-36">
      <div className="frame">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="kicker" data-fade>Career resources</p>
            <h2 data-split className="mt-5 text-[clamp(40px,4.6vw,72px)] tracking-tightest">Guides for working from home</h2>
          </div>
          <p data-fade className="max-w-md text-[17px] text-slate">Practical, plain-English advice from our recruiters for anyone starting or growing a remote career in the US.</p>
        </div>
        <div data-stagger className="mt-14 grid gap-8 md:grid-cols-3">
          {insights.map((a) => (
            <a key={a.slug} href="#" className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[22px]">
                <img src={photo(a.photo, 1000, 750)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.03]" />
                <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[13px] text-ink backdrop-blur">{a.kind}</span>
              </div>
              <p className="mt-6 text-[14px] text-slate">{a.read} read</p>
              <h3 className="mt-2 text-[28px] leading-tight"><span className="link-u">{a.title}</span></h3>
              <p className="mt-3 text-[16px] leading-relaxed text-slate">{a.excerpt}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
