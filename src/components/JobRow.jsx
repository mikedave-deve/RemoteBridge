import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { money, postedLabel } from '../data/jobs'
import { photo } from '../data/photos'

export { money }

/** A small photo of the kind of work the job involves. */
export function JobPhoto({ job, className = 'h-[72px] w-[72px]' }) {
  return (
    <img src={photo(job.photo, 160, 160)} alt="" loading="lazy" decoding="async" width="72" height="72"
      className={`shrink-0 rounded-xl bg-mist object-cover ${className}`} />
  )
}

export default function JobRow({ job }) {
  return (
    <Link to={`/jobs/${job.id}`}
      className="group grid gap-5 rounded-2xl bg-white p-6 ring-1 ring-line transition-[box-shadow,transform] duration-500 ease-expo hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(11,54,64,.45)] hover:ring-bridge-300 sm:p-7 md:grid-cols-[1.7fr_1fr_auto] md:items-center">
      <div className="flex gap-5">
        <JobPhoto job={job} />
        <div className="min-w-0">
          <p className="text-[14px] text-slate">{job.company} <span className="text-slate-soft">· {job.department}</span></p>
          <h3 className="mt-1 font-display text-[24px] leading-tight transition-colors group-hover:text-bridge-700">{job.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-bridge-50 px-3 py-1 text-[13px] font-medium text-bridge-700">{job.type}</span>
            <span className="rounded-full bg-mist px-3 py-1 text-[13px] text-slate">{job.level}</span>
            {job.stack.slice(0, 2).map((t) => <span key={t} className="hidden rounded-full bg-mist px-3 py-1 text-[13px] text-slate sm:inline">{t}</span>)}
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-y-2 text-[14px] text-slate">
        <div className="flex items-center gap-2"><MapPin size={16} strokeWidth={1.6} className="shrink-0 text-bridge-500" /><dt className="sr-only">Location</dt><dd>{job.location}</dd></div>
        <div className="flex items-center gap-2"><Clock size={16} strokeWidth={1.6} className="shrink-0 text-bridge-500" /><dt className="sr-only">Schedule</dt><dd>{job.schedule} {job.timezone === 'Mountain' ? 'MT' : job.timezone[0] + 'T'}</dd></div>
      </dl>
      <div className="flex items-center justify-between gap-6 md:justify-end">
        <div className="md:text-right">
          <p className="text-[17px] font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{money(job.pay)}</p>
          <p className="text-[13px] text-slate-soft">{postedLabel(job.posted)}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mist text-ink transition-all duration-500 group-hover:bg-bridge-600 group-hover:text-white">
          <ArrowUpRight size={18} strokeWidth={1.6} />
        </span>
      </div>
    </Link>
  )
}

export function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`}
      className="group flex h-full flex-col rounded-[22px] bg-white p-7 ring-1 ring-line transition-[box-shadow,transform] duration-500 ease-expo hover:-translate-y-1 hover:shadow-[0_30px_60px_-34px_rgba(11,54,64,.5)] hover:ring-bridge-300">
      <div className="flex items-start justify-between gap-4">
        <JobPhoto job={job} />
        <span className="rounded-full bg-bridge-50 px-3 py-1 text-[12.5px] font-medium text-bridge-700">{job.type}</span>
      </div>
      <p className="mt-6 text-[14px] text-slate">{job.company}</p>
      <h3 className="mt-1 font-display text-[26px] leading-[1.1] transition-colors group-hover:text-bridge-700">{job.title}</h3>
      <p className="mt-4 flex items-center gap-2 text-[14px] text-slate"><MapPin size={15} className="text-bridge-500" />{job.location}</p>
      <div className="mt-auto pt-7">
        <div className="flex items-end justify-between border-t border-line pt-5">
          <div>
            <p className="text-[17px] font-semibold text-ink">{money(job.pay)}</p>
            <p className="text-[13px] text-slate-soft">{postedLabel(job.posted)}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-bridge-700">
            Apply <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
