// Small building blocks shared by the portal pages. Same tokens as the public site.

export function PageHead({ title, sub, actions }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="text-[clamp(30px,3vw,40px)] tracking-tightest">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[15.5px] text-slate">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
    </div>
  )
}

export function Card({ title, action, children, className = '', pad = true }) {
  return (
    <section className={`rounded-2xl bg-white ring-1 ring-line ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="font-sans text-[16px] font-semibold tracking-normal text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? 'p-6' : ''}>{children}</div>
    </section>
  )
}

/** A headline number. Text stays in ink tokens; the label carries the meaning. */
export function Stat({ label, value, note, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-slate">{label}</p>
        {Icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-bridge-50 text-bridge-700"><Icon size={18} strokeWidth={1.7} /></span>}
      </div>
      <p className="mt-3 font-display text-[34px] leading-none text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {note && <p className="mt-2 text-[13.5px] text-slate">{note}</p>}
    </div>
  )
}

const tones = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-800 ring-red-200',
  teal: 'bg-bridge-50 text-bridge-800 ring-bridge-100',
  gray: 'bg-mist text-slate ring-line',
}
export function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ring-1 ring-inset ${tones[tone]}`}>{children}</span>
}

/** Map a status word to a badge tone, so state is always text plus color. */
export const statusTone = (s) => /approved|complete|verified|on file|signed|acknowledged|paid|active|taken/i.test(s) ? 'green'
  : /pending|progress|open|scheduled/i.test(s) ? 'amber' : /required|denied|overdue|not started/i.test(s) ? 'red' : 'gray'

export function Table({ head, rows, align = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-line text-[12.5px] uppercase tracking-[0.08em] text-slate">
            {head.map((h, i) => <th key={h} scope="col" className={`px-6 py-3 font-semibold ${align[i] === 'r' ? 'text-right' : ''}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0 hover:bg-paper">
              {r.map((c, j) => <td key={j} className={`px-6 py-3.5 text-ink ${align[j] === 'r' ? 'text-right' : ''}`} style={align[j] === 'r' ? { fontVariantNumeric: 'tabular-nums' } : undefined}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line print:hidden">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[15px] transition-colors ${value === t ? 'border-bridge-600 font-medium text-ink' : 'border-transparent text-slate hover:text-ink'}`}>
          {t}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="text-[13px] text-slate">{label}</dt>
      <dd className={`mt-1 text-[15.5px] text-ink ${mono ? 'tabular-nums' : ''}`}>{value}</dd>
    </div>
  )
}

/** Inline confirmation after a form submits (no backend in this demo). */
export function Notice({ children, tone = 'green' }) {
  return <p role="status" className={`rounded-xl px-4 py-3 text-[14px] ring-1 ${tones[tone]}`}>{children}</p>
}
