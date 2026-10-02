import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { jobs } from '../../data/jobs'
import { JobCard } from '../JobRow'
import useReveal from '../../lib/useReveal'
import { gsap, useGSAP } from '../../lib/gsap'

const tabs = ['Featured', 'Data Entry', 'Customer Support', 'Bookkeeping', 'Accounting', 'Payroll', 'Administrative']

export default function FeaturedJobs() {
  const ref = useRef(null)
  const grid = useRef(null)
  const [tab, setTab] = useState('Featured')
  useReveal(ref)

  const list = tab === 'Featured'
    ? jobs.filter((j) => j.featured).slice(0, 9)
    : jobs.filter((j) => j.department === tab).sort((a, b) => a.posted - b.posted).slice(0, 9)

  useGSAP(() => {
    gsap.fromTo(grid.current.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.8, ease: 'expo.out' })
  }, { scope: grid, dependencies: [tab], revertOnUpdate: true })

  return (
    <section ref={ref} id="open-jobs" className="scroll-mt-24 bg-paper py-24 lg:py-32">
      <div className="frame">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="kicker" data-fade>PremierRemoteBridge jobs</p>
            <h2 data-split className="mt-5 text-[clamp(40px,4.8vw,76px)] tracking-tightest">Remote jobs open right now</h2>
            <p data-fade className="mt-5 max-w-2xl text-[18px] text-slate">
              {jobs.length} work-from-home roles with verified US employers. Pay is listed on every job, and a PremierRemoteBridge recruiter reviews every application.
            </p>
          </div>
          <Link data-fade to="/jobs" className="btn-dark h-14 shrink-0 px-7 text-[16px]">View all {jobs.length} jobs <ArrowRight size={18} /></Link>
        </div>

        <div className="no-scrollbar -mx-5 mt-12 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist" aria-label="Job categories">
          <div className="flex w-max gap-2">
            {tabs.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={`h-11 rounded-full px-5 text-[15px] transition-colors duration-300 ${tab === t ? 'bg-bridge-900 text-white' : 'bg-white text-slate ring-1 ring-line hover:text-ink hover:ring-bridge-300'}`}>
                {t}
                {t !== 'Featured' && <span className={`ml-2 text-[12.5px] ${tab === t ? 'text-bridge-200' : 'text-slate-soft'}`}>{jobs.filter((j) => j.department === t).length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div ref={grid} role="tabpanel" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((j) => <JobCard key={j.id} job={j} />)}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-[24px] bg-bridge-900 p-8 text-white sm:flex-row sm:p-10">
          <div>
            <p className="font-display text-[30px] leading-tight">Not sure which role fits?</p>
            <p className="mt-2 text-white/70">Send your résumé once. A recruiter matches you to the right openings, in any state.</p>
          </div>
          <Link to="/submit-resume" className="btn-accent h-12 shrink-0 px-6">Submit your résumé</Link>
        </div>
      </div>
    </section>
  )
}
