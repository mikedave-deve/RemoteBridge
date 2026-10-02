import { useState } from 'react'
import { fmtDate, usd } from '../data/portal'

// Categorical slots, fixed order. Validated (light, white surface): CVD ΔE ≥ 13, normal ΔE ≥ 27.
// Slot 4 sits below 3:1 contrast, so every segment also carries a visible label and amount.
export const SERIES = ['#008BA3', '#EB6834', '#4A3AA7', '#E87BA4', '#2A78D6']

/** Where one paycheck goes: a single 100% bar split into five parts, each labelled. */
export function PayBreakdown({ stub }) {
  const [hover, setHover] = useState(null)
  const sum = (g) => stub.taxes.filter((t) => t.group === g).reduce((s, t) => s + t.amount, 0)
  const parts = [
    { label: 'Take-home pay', value: stub.net },
    { label: 'Federal income tax', value: sum('federal') },
    { label: 'Social Security & Medicare', value: sum('fica') },
    { label: 'State & local tax', value: sum('state') },
    { label: '401(k) & benefits', value: stub.totalDed },
  ].map((p, i) => ({ ...p, color: SERIES[i], pct: (p.value / stub.gross) * 100 }))

  return (
    <figure>
      <div className="relative">
        <div className="flex h-4 w-full gap-[2px]" role="img" aria-label={`Gross pay ${usd(stub.gross)}: ${parts.map((p) => `${p.label} ${usd(p.value)}`).join(', ')}`}>
          {parts.map((p, i) => (
            <div key={p.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
              className={`h-full transition-opacity first:rounded-l-[4px] last:rounded-r-[4px] ${hover !== null && hover !== i ? 'opacity-40' : ''}`}
              style={{ width: `${p.pct}%`, background: p.color }} />
          ))}
        </div>
        {hover !== null && (
          <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-[13px] text-white shadow-lg">
            {parts[hover].label}: <strong>{usd(parts[hover].value)}</strong> ({parts[hover].pct.toFixed(1)}%)
          </div>
        )}
      </div>
      <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {parts.map((p, i) => (
          <div key={p.label} className="flex items-center justify-between gap-3 text-[14px]" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <dt className="flex items-center gap-2.5 text-slate"><span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />{p.label}</dt>
            <dd className="text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{usd(p.value)} <span className="text-slate">· {p.pct.toFixed(0)}%</span></dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

/** Gross pay per paycheck this year: one series, so the title names it and no legend box. */
export function GrossByPeriod({ stubs }) {
  const data = [...stubs].reverse()
  const [hover, setHover] = useState(null)
  const [table, setTable] = useState(false)
  const W = 720, H = 220, pad = { l: 52, r: 8, t: 12, b: 28 }
  const max = Math.ceil(Math.max(...data.map((d) => d.gross)) / 500) * 500
  const step = (W - pad.l - pad.r) / data.length
  const bw = Math.min(18, step - 6)
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  const ticks = Array.from({ length: Math.floor(max / 1000) + 1 }, (_, i) => i * 1000)

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setTable(!table)} className="text-[13.5px] text-bridge-700 underline underline-offset-4">{table ? 'View as chart' : 'View as table'}</button>
      </div>
      {table ? (
        <div className="max-h-[260px] overflow-y-auto">
          <table className="w-full text-[14px]">
            <thead><tr className="text-left text-slate"><th className="py-1.5 font-medium">Pay date</th><th className="py-1.5 text-right font-medium">Gross</th><th className="py-1.5 text-right font-medium">Net</th></tr></thead>
            <tbody>{data.map((d) => <tr key={d.id} className="border-t border-line"><td className="py-1.5">{fmtDate(d.payDate)}</td><td className="py-1.5 text-right tabular-nums">{usd(d.gross)}</td><td className="py-1.5 text-right tabular-nums">{usd(d.net)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gross pay for each paycheck in 2026">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E3EBEC" strokeWidth="1" />
                <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#6B8086">${t / 1000}k</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = pad.l + i * step + (step - bw) / 2
              const showLabel = i % 4 === 0
              return (
                <g key={d.id}>
                  <rect x={pad.l + i * step} y={pad.t} width={step} height={H - pad.t - pad.b} fill="transparent"
                    onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
                  <path d={`M${x} ${y(0)}V${y(d.gross) + 4}a4 4 0 0 1 4 -4h${bw - 8}a4 4 0 0 1 4 4V${y(0)}Z`}
                    fill={SERIES[0]} opacity={hover === null || hover === i ? 1 : 0.45} pointerEvents="none" />
                  {showLabel && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#6B8086">{fmtDate(d.payDate, { month: 'short', day: 'numeric' })}</text>}
                </g>
              )
            })}
          </svg>
          {hover !== null && (
            <div className="pointer-events-none absolute top-0 rounded-lg bg-ink px-3 py-2 text-[13px] text-white shadow-lg"
              style={{ left: `${((pad.l + hover * step + step / 2) / W) * 100}%`, transform: 'translateX(-50%)' }}>
              <p className="font-medium">{fmtDate(data[hover].payDate)}</p>
              <p>Gross {usd(data[hover].gross)} · Net {usd(data[hover].net)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
