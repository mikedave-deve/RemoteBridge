import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, CalendarClock, Check, FileText, MapPin, ShieldCheck, Users, Wallet } from 'lucide-react'
import { getJob, jobs, categories, money, postedLabel } from '../data/jobs'
import { photo } from '../data/photos'
import JobRow, { JobPhoto } from '../components/JobRow'
import useReveal from '../lib/useReveal'
import NotFound from './NotFound'

export default function JobDetail() {
  const { id } = useParams()
  const job = getJob(id)
  const ref = useRef(null)
  useReveal(ref, [id])
  if (!job) return <NotFound />
  const related = jobs.filter((j) => j.department === job.department && j.id !== job.id).slice(0, 3)
  const cat = categories.find((c) => c.name === job.department)

  const facts = [
    [Wallet, 'Pay', money(job.pay)],
    [MapPin, 'Location', job.location],
    [CalendarClock, 'Schedule', `${job.schedule} (${job.timezone})`],
    [Briefcase, 'Employment', `${job.type}, ${job.employment}`],
  ]

  return (
    <div ref={ref}>
      <section className="relative isolate overflow-hidden bg-bridge-950 pt-36 pb-16 text-white lg:pt-44">
        <img src={photo(cat?.photo || 'openOffice', 2200)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bridge-950 via-bridge-950/80 to-bridge-950/50" />
        <div className="frame">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-[15px] text-white/70 hover:text-bridge-200"><ArrowLeft size={16} /> All jobs</Link>
          <div className="mt-10 flex items-center gap-4">
            <JobPhoto job={job} className="h-20 w-20 ring-2 ring-white/20" />
            <div>
              <p className="text-[17px] text-white">{job.company}</p>
              <p className="text-[14px] text-white/60">Headquartered in {job.companyCity} · {job.department}</p>
            </div>
          </div>
          <h1 data-split className="mt-8 max-w-5xl text-balance text-[clamp(40px,5.4vw,84px)] leading-[1] tracking-tightest text-white">{job.title}</h1>
          <div data-fade className="mt-6 flex flex-wrap gap-2 text-[14px]">
            <span className="rounded-full bg-bridge-200 px-3.5 py-1 font-medium text-bridge-950">100% remote</span>
            <span className="rounded-full bg-white/10 px-3.5 py-1 text-white/85 ring-1 ring-white/15">{job.level}</span>
            <span className="rounded-full bg-white/10 px-3.5 py-1 text-white/85 ring-1 ring-white/15">{postedLabel(job.posted)}</span>
            <span className="rounded-full bg-white/10 px-3.5 py-1 text-white/85 ring-1 ring-white/15">{job.applicants} applicants</span>
          </div>
          <dl data-stagger className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(([Icon, k, v]) => (
              <div key={k} className="bg-bridge-950/70 p-6 backdrop-blur">
                <dt className="flex items-center gap-2 text-[14px] text-white/60"><Icon size={16} strokeWidth={1.6} className="text-bridge-200" />{k}</dt>
                <dd className="mt-2 text-[17px] font-medium text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-paper py-20">
        <div className="frame grid gap-14 lg:grid-cols-12">
          <article className="lg:col-span-7">
            <h2 className="text-[34px]">About the job</h2>
            <p className="mt-5 font-display text-[22px] leading-[1.6] text-ink/85">{job.summary}</p>
            <h2 className="mt-14 text-[34px]">What you will do</h2>
            <ul className="mt-5 space-y-4">{job.responsibilities.map((r) => <li key={r} className="flex gap-4 text-[17px] leading-relaxed text-slate"><span className="mt-3 h-px w-5 shrink-0 bg-bridge-500" />{r}</li>)}</ul>
            <h2 className="mt-14 text-[34px]">What you need</h2>
            <ul className="mt-5 space-y-4">{job.requirements.map((r) => <li key={r} className="flex gap-4 text-[17px] leading-relaxed text-slate"><span className="mt-3 h-px w-5 shrink-0 bg-bridge-500" />{r}</li>)}</ul>
            <h2 className="mt-14 text-[34px]">Skills</h2>
            <div className="mt-5 flex flex-wrap gap-2">{job.stack.map((t) => <span key={t} className="rounded-full bg-white px-4 py-2 text-[15px] text-ink ring-1 ring-line">{t}</span>)}</div>
            <h2 className="mt-14 text-[34px]">Pay and benefits</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-xl bg-bridge-900 p-5 text-[16px] text-white"><Wallet size={18} className="mt-0.5 shrink-0 text-bridge-200" />{money(job.pay)}, paid by direct deposit</li>
              {job.benefits.map((b) => <li key={b} className="flex items-start gap-3 rounded-xl bg-white p-5 text-[16px] text-ink ring-1 ring-line"><Check size={18} className="mt-0.5 shrink-0 text-bridge-500" />{b}</li>)}
            </ul>
            <div className="mt-14 flex gap-4 rounded-2xl bg-bridge-50/60 p-6 text-[15px] leading-relaxed text-ink ring-1 ring-bridge-200">
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-bridge-700" />
              <p><strong className="font-semibold">Verified employer.</strong> RemoteBridge has confirmed this company, the hiring manager and the pay range. You will never be asked to pay for training, equipment or a background check.</p>
            </div>
          </article>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="sticky top-28 overflow-hidden rounded-[24px] bg-bridge-900 text-white">
              <div className="relative h-40">
                <img src={photo('homeDesk', 900, 400)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-bridge-900 to-transparent" />
              </div>
              <div className="p-8 pt-2">
                <p className="font-display text-[30px] leading-tight">Apply for this job</p>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">A RemoteBridge recruiter reviews every application within five business days and replies either way.</p>
                <Link to={`/submit-resume?role=${job.id}`} className="btn-accent mt-8 w-full"><FileText size={18} /> Apply with your résumé</Link>
                <Link to="/create-account" className="btn-outline-light mt-3 w-full">Create an account to track it</Link>
                <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                  <img src={'/media/RB2.jpg'} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <div className="text-[14px]"><p className="text-white">Samuel Adams</p><p className="text-white/60">Your recruiter for {job.department}</p></div>
                </div>
                <p className="mt-5 flex items-center gap-2 text-[13px] text-white/55"><Users size={15} /> {job.applicants} people have applied</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-mist py-20">
          <div className="frame">
            <div className="flex items-end justify-between gap-6">
              <h2 className="text-[36px]">More {job.department.toLowerCase()} jobs</h2>
              <Link to={`/jobs?dept=${encodeURIComponent(job.department)}`} className="hidden text-[15px] text-bridge-700 underline underline-offset-4 sm:inline">See all</Link>
            </div>
            <div className="mt-8 grid gap-4">{related.map((j) => <JobRow key={j.id} job={j} />)}</div>
          </div>
        </section>
      )}
    </div>
  )
}
