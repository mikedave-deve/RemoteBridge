import { useMemo, useRef, useState } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import JobRow from '../components/JobRow'
import { jobs, departments, timezones, types, levels } from '../data/jobs'
import { gsap, useGSAP } from '../lib/gsap'

const PAGE = 20
// Compare hourly and salaried roles on one scale (full-time hours).
const annual = (p) => (p[0] === 'h' ? p[2] * 2.08 : p[2])

function Group({ title, field, options, value, onChange }) {
  return (
    <fieldset className="border-t border-line py-6">
      <legend className="float-left mb-4 w-full text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">{title}</legend>
      <div className="clear-both space-y-1">
        {options.map((o) => {
          const on = value.includes(o)
          const count = jobs.filter((j) => j[field] === o).length
          return (
            <label key={o} className="group flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[15px] transition-colors hover:bg-mist">
              <span className="flex items-center gap-3">
                <input type="checkbox" className="peer sr-only" checked={on} onChange={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])} />
                <span className="grid h-5 w-5 place-items-center rounded-md ring-1 ring-inset ring-line transition-colors peer-checked:bg-bridge-600 peer-checked:ring-bridge-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bridge-500">
                  <svg viewBox="0 0 12 12" className={`h-3 w-3 text-white ${on ? 'opacity-100' : 'opacity-0'}`}><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
                </span>
                <span className={on ? 'text-ink' : 'text-slate'}>{o}</span>
              </span>
              <span className="text-[13px] text-slate-soft">{count}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// Re-read the filters when only the query string changes (e.g. a footer category link).
export default function JobsPage() {
  const { search } = useLocation()
  return <Jobs key={search} />
}

function Jobs() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [dept, setDept] = useState(params.get('dept') ? [params.get('dept')] : [])
  const [tz, setTz] = useState([])
  const [type, setType] = useState([])
  const [level, setLevel] = useState([])
  const [anywhere, setAnywhere] = useState(params.get('anywhere') === '1')
  const [sort, setSort] = useState('recent')
  const [shown, setShown] = useState(PAGE)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const list = useRef(null)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    let r = jobs.filter((j) =>
      (!dept.length || dept.includes(j.department)) && (!tz.length || tz.includes(j.timezone)) &&
      (!type.length || type.includes(j.type)) && (!level.length || level.includes(j.level)) &&
      (!anywhere || j.anywhere) &&
      (!term || [j.title, j.company, j.department, j.stateName, j.state, j.location, ...j.stack].join(' ').toLowerCase().includes(term)))
    if (sort === 'pay') r = [...r].sort((a, b) => annual(b.pay) - annual(a.pay))
    else r = [...r].sort((a, b) => a.posted - b.posted)
    return r
  }, [q, dept, tz, type, level, anywhere, sort])

  const visible = results.slice(0, shown)

  useGSAP(() => {
    gsap.fromTo(list.current.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.03, duration: 0.7, ease: 'expo.out' })
  }, { scope: list, dependencies: [results] })

  const active = [...dept, ...tz, ...type, ...level]
  const reset = () => setShown(PAGE)
  const clear = () => { setDept([]); setTz([]); setType([]); setLevel([]); setQ(''); setAnywhere(false); reset() }
  const wrap = (fn) => (v) => { fn(v); reset() }

  const filters = (
    <>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
        <span><span className="block text-[15px] font-medium text-ink">Anywhere in the US</span><span className="text-[13px] text-slate">Open to all 50 states</span></span>
        <input type="checkbox" checked={anywhere} onChange={(e) => { setAnywhere(e.target.checked); reset() }} className="peer sr-only" />
        <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-bridge-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-bridge-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
      </label>
      <div className="mt-4" />
      <Group title="Category" field="department" options={departments} value={dept} onChange={wrap(setDept)} />
      <Group title="Time zone" field="timezone" options={timezones} value={tz} onChange={wrap(setTz)} />
      <Group title="Job type" field="type" options={types} value={type} onChange={wrap(setType)} />
      <Group title="Experience" field="level" options={levels} value={level} onChange={wrap(setLevel)} />
    </>
  )

  return (
    <>
      <PageHeader kicker="Browse jobs" image="openOffice" title={<>{jobs.length} remote jobs. <span className="">Pay on every one.</span></>}>
        Every role is fully work-from-home within the United States, with a verified employer, a confirmed pay range and a PremierRemoteBridge recruiter who reviews your application.
      </PageHeader>

      <section className="bg-paper py-14 lg:py-20">
        <div className="frame">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search jobs</span>
              <Search size={20} strokeWidth={1.6} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-soft" />
              <input value={q} onChange={(e) => { setQ(e.target.value.slice(0, 80)); reset() }} placeholder="Search by job title, company, skill or state"
                className="field h-14 rounded-full pl-14 text-[16px]" />
            </label>
            <div className="flex gap-3">
              <button onClick={() => setFiltersOpen(true)} className="btn-ghost h-14 flex-1 lg:hidden"><SlidersHorizontal size={18} /> Filters{active.length ? ` (${active.length})` : ''}</button>
              <label className="relative">
                <span className="sr-only">Sort by</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="field h-14 appearance-none rounded-full pl-5 pr-12">
                  <option value="recent">Most recent</option>
                  <option value="pay">Highest pay</option>
                </select>
                <svg className="pointer-events-none absolute right-5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate" viewBox="0 0 12 12"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
              </label>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <aside className="hidden lg:col-span-3 lg:block" aria-label="Filters">
              <div data-lenis-prevent className="no-scrollbar sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-6">{filters}</div>
            </aside>

            <div className="lg:col-span-9">
              <div className="mb-5 flex flex-wrap items-center gap-2 text-[15px] text-slate">
                <span aria-live="polite"><strong className="font-semibold text-ink">{results.length}</strong> {results.length === 1 ? 'job' : 'jobs'}</span>
                {anywhere && <span className="ml-1 rounded-full bg-bridge-50 px-3 py-1 text-[13px] text-bridge-700">Anywhere in the US</span>}
                {active.map((a) => (
                  <button key={a} onClick={() => { setDept(dept.filter((v) => v !== a)); setTz(tz.filter((v) => v !== a)); setType(type.filter((v) => v !== a)); setLevel(level.filter((v) => v !== a)) }}
                    className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-bridge-50 px-3 py-1 text-[13px] text-bridge-800 ring-1 ring-bridge-100 hover:ring-bridge-300">
                    {a}<X size={13} /><span className="sr-only">Remove filter</span>
                  </button>
                ))}
                {(active.length > 0 || q || anywhere) && <button onClick={clear} className="ml-1 text-[14px] text-bridge-600 underline underline-offset-4">Clear all</button>}
              </div>
              <div ref={list} className="grid gap-4">
                {visible.map((j) => <JobRow key={j.id} job={j} />)}
              </div>
              {results.length > shown && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-[14px] text-slate">Showing {visible.length} of {results.length} jobs</p>
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-bridge-600" style={{ width: `${(visible.length / results.length) * 100}%` }} /></div>
                  <button onClick={() => setShown((s) => s + PAGE)} className="btn-dark mt-3 h-12 px-8">Show more jobs</button>
                </div>
              )}
              {results.length === 0 && (
                <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-line">
                  <p className="font-display text-[28px]">No jobs match these filters.</p>
                  <p className="mx-auto mt-3 max-w-md text-slate">Remove a filter or two, or send us your résumé and we will contact you when a matching job opens.</p>
                  <div className="mt-6 flex justify-center gap-3"><button onClick={clear} className="btn-ghost">Clear filters</button><Link to="/submit-resume" className="btn-primary">Submit your résumé</Link></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-bridge-950/50" onClick={() => setFiltersOpen(false)} />
          <div data-lenis-prevent className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-paper px-6 pb-8 pt-6">
            <div className="flex items-center justify-between pb-4"><p className="font-display text-[26px]">Filters</p>
              <button onClick={() => setFiltersOpen(false)} className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-line" aria-label="Close filters"><X size={18} /></button></div>
            {filters}
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-4 w-full">Show {results.length} jobs</button>
          </div>
        </div>
      )}
    </>
  )
}
