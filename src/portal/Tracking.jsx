import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check, ChevronRight, Pause, RefreshCw } from 'lucide-react'
import { SHIP_STEPS } from '../lib/support'

const TZ = 'America/New_York'
const longDay = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const mdy = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
const stamp = (d) => `${new Date(d).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ }).replace(',', '')} ET`
const eventDay = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ })
const eventTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })

/** A shipping box with the company mark, drawn for the banner (no photo needed). */
function Banner() {
  return (
    <div className="relative h-24 overflow-hidden bg-bridge-950 sm:h-28">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
      <svg viewBox="0 0 360 120" className="absolute left-1/2 top-0 h-full -translate-x-1/2" aria-hidden="true">
        <path d="M40 30 L180 6 L320 30 L320 140 L40 140 Z" fill="#B98C5A" />
        <path d="M40 30 L180 6 L320 30 L180 52 Z" fill="#CFA372" />
        <path d="M180 52 L320 30 L320 140 L180 140 Z" fill="#A47A4B" />
        <path d="M95 20 L135 14 L275 37 L235 44 Z" fill="#7A5B39" opacity="0.85" />
        <path d="M235 44 L275 37 L275 140 L235 140 Z" fill="#6B4F31" opacity="0.85" />
        <g transform="translate(118 76) scale(1.15)">
          <circle cx="17" cy="24" r="11" fill="#0F424D" opacity="0.9" /><circle cx="31" cy="24" r="11" fill="#4C99A7" opacity="0.9" />
          <path d="M24 15.515A11 11 0 0 1 24 32.485A11 11 0 0 1 24 15.515Z" fill="#06242B" />
        </g>
      </svg>
    </div>
  )
}

function Steps({ s }) {
  const at = SHIP_STEPS.indexOf(s.status)
  return (
    <ol className="grid grid-cols-4 px-2 py-7 sm:px-8">
      {SHIP_STEPS.map((step, i) => {
        const done = i < at || (i === at && s.status === 'Delivered')
        const current = i === at && s.status !== 'Delivered'
        const red = current && s.paused
        return (
          <li key={step} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-[15px] h-0 w-full -translate-y-1/2 ${i <= at ? `border-t-[3px] ${red ? 'border-red-600' : 'border-bridge-600'}` : 'border-t-[3px] border-dotted border-line'}`} style={{ marginRight: 18 }} aria-hidden="true" />}
            <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full ${done ? 'bg-bridge-600 text-white' : current ? (red ? 'bg-white text-red-600 ring-2 ring-red-600' : 'bg-white text-bridge-700 ring-2 ring-bridge-600') : 'bg-white ring-2 ring-line'}`}>
              {done ? <Check size={16} strokeWidth={3} /> : current ? (red ? <Pause size={15} strokeWidth={2.6} /> : <ArrowRight size={16} strokeWidth={2.6} />) : null}
            </span>
            <span className={`mt-3 text-[12.5px] sm:text-[14.5px] ${current ? `font-semibold ${red ? 'text-red-700' : 'text-ink'}` : 'text-slate'}`}>{step}</span>
            {current && <span className={`mt-2 h-[3px] w-16 rounded-full sm:w-28 ${red ? 'bg-red-600' : 'bg-bridge-500'}`} aria-hidden="true" />}
            {current && <span className="sr-only">{red ? 'Current step, paused' : 'Current step'}</span>}
          </li>
        )
      })}
    </ol>
  )
}

const Address = ({ label, a, strong }) => (
  <div>
    <p className="text-[13.5px] text-slate">{label}</p>
    <p className={`mt-2 text-[15px] leading-relaxed ${strong ? 'font-semibold text-ink' : 'text-ink'}`}>
      {strong && a.name && <span className="block">{a.name}</span>}
      <span className="block font-semibold">{a.street}{a.street2 ? `, ${a.street2}` : ''}</span>
      <span className={`block ${strong ? 'font-semibold' : ''}`}>{a.city}, {a.state} {a.zip}</span>
      {a.country && <span className={`block ${strong ? 'font-semibold' : ''}`}>{a.country}</span>}
    </p>
  </div>
)

export default function Tracking({ s, onRefresh, refreshing }) {
  const [progress, setProgress] = useState(false)
  const delivered = s.status === 'Delivered'
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <Banner />
        <div className="flex flex-col justify-between gap-5 border-b border-line px-6 py-6 sm:flex-row sm:px-8">
          <div>
            <p className="text-[14px] text-slate">Your shipment</p>
            <p className="mt-1 break-all text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.tracking}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14.5px]">
              {s.contents && <span className="text-slate">{s.contents}</span>}
              <button onClick={() => setProgress(!progress)} className="inline-flex items-center gap-1 text-bridge-700 hover:underline">View details <ChevronRight size={16} /></button>
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[14px] text-slate">{delivered ? 'Delivered' : s.paused ? 'Delivery status' : 'Estimated delivery'}</p>
            <p className={`mt-1 text-[20px] font-semibold sm:text-[23px] ${s.paused ? 'text-red-700' : 'text-bridge-700'}`}>
              {delivered ? `${eventDay(s.deliveredAt || s.updatedAt)} at ${eventTime(s.deliveredAt || s.updatedAt)}` : s.paused ? 'Delivery paused' : s.eta ? `${longDay(s.eta)}${s.window ? ` ${s.window}` : ''}` : 'Date to be confirmed'}
            </p>
            {!delivered && !s.paused && s.window && <p className="mt-1 text-[14px] text-slate">Delivery window: {s.window}</p>}
          </div>
        </div>

        {s.paused && (
          <div className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-6 py-4 text-red-800 sm:px-8" role="alert">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div><p className="font-semibold">Your delivery has been paused</p><p className="mt-0.5 text-[14.5px]">Reason: {s.pauseReason}</p></div>
          </div>
        )}

        <div className="border-b border-line"><Steps s={s} /></div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 md:grid-cols-3 md:divide-x md:divide-line md:gap-0">
          <div className="md:pr-6"><Address label="Ship From" a={s.from} /></div>
          <div className="md:px-6"><Address label="Ship To" a={s.to} strong /></div>
          <div className="space-y-5 md:pl-6">
            <div><p className="text-[13.5px] text-slate">Service</p><p className="mt-2 text-[15px] font-semibold">{s.service}</p></div>
            <div><p className="text-[13.5px] text-slate">Weight</p><p className="mt-2 text-[15px] font-semibold">{s.weight} {s.weightUnit}{s.packages > 1 ? ` · ${s.packages} packages` : ''}</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white ring-1 ring-line">
        <header className="flex items-center justify-between gap-4 px-6 pt-5 sm:px-8">
          <h2 className="font-sans text-[18px] font-semibold tracking-normal">Shipment Details</h2>
          <button onClick={() => setProgress(!progress)} className="inline-flex items-center gap-1 text-[14.5px] text-bridge-700 hover:underline">{progress ? 'Hide all details' : 'View all details'} <ChevronRight size={16} className={progress ? 'rotate-90' : ''} /></button>
        </header>
        <dl className="mx-6 mt-4 grid grid-cols-2 gap-y-5 border-t border-line py-5 sm:mx-8 md:grid-cols-4 md:divide-x md:divide-line">
          <div className="pr-4"><dt className="text-[13px] text-slate">Tracking Number</dt><dd className="mt-1 break-all text-[14.5px] font-semibold">{s.tracking}</dd></div>
          <div className="md:px-6"><dt className="text-[13px] text-slate">Reference Number</dt><dd className="mt-1 text-[14.5px] font-semibold">{s.reference || '—'}</dd></div>
          <div className="pr-4 md:px-6"><dt className="text-[13px] text-slate">Estimated Delivery Date</dt><dd className={`mt-1 text-[14.5px] font-semibold ${s.paused ? 'text-red-700' : ''}`}>{s.paused ? 'Paused' : s.eta ? mdy(s.eta) : '—'}</dd></div>
          <div className="md:pl-6"><dt className="text-[13px] text-slate">Shipment Progress</dt><dd className="mt-1"><button onClick={() => setProgress(!progress)} className="text-[14.5px] text-bridge-700 hover:underline">{progress ? 'Hide progress' : 'View progress'}</button></dd></div>
        </dl>

        {progress && (
          <ol className="mx-6 border-t border-line py-5 sm:mx-8">
            {s.events.map((e, i) => (
              <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                <span className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${e.alert ? 'bg-red-600' : i === 0 ? 'bg-bridge-600' : 'bg-line'}`} />
                {i < s.events.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden="true" />}
                <div className="grid flex-1 gap-1 sm:grid-cols-[220px_1fr]">
                  <p className="text-[13.5px] text-slate">{eventDay(e.at)}<br />{eventTime(e.at)} ET</p>
                  <p className={`text-[14.5px] ${e.alert ? 'font-medium text-red-700' : 'text-ink'}`}>{e.text}{e.location && <span className="block text-[13.5px] text-slate">{e.location}</span>}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <footer className="flex flex-col justify-between gap-4 border-t border-line px-6 py-5 sm:flex-row sm:items-center sm:px-8">
          <p className="text-[14px] text-slate">Last Updated: {stamp(s.updatedAt)}</p>
          <div className="flex gap-3">
            <button onClick={onRefresh} disabled={refreshing} className="btn-ghost h-11 px-5 text-[14.5px]"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Get Updates</button>
            <button onClick={() => setProgress(true)} className="btn-primary h-11 px-5 text-[14.5px]">View Progress</button>
          </div>
        </footer>
      </section>
    </div>
  )
}
