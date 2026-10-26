import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { api } from '../lib/api'

// The employee list is shared by every admin page and kept in memory, so the picker fills
// instantly when you move between pages. Each page still refreshes it quietly in the background.
let state = { employees: null, error: '' }
let inflight = null
const listeners = new Set()
const publish = (next) => { state = { ...state, ...next }; listeners.forEach((f) => f(state)) }

export function loadEmployees() {
  inflight ??= api('/admin/employees')
    .then(({ employees }) => { publish({ employees, error: '' }); return employees })
    .catch((e) => { publish({ error: e.message || 'Could not load employees.' }); throw e })
    .finally(() => { inflight = null })
  return inflight
}
export const clearEmployees = () => { state = { employees: null, error: '' } }

function useEmployeeList() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    setS(state)
    loadEmployees().catch(() => {})
    return () => { listeners.delete(setS) }
  }, [])
  return s
}

/** Approved employees (not admins), and the one chosen in the page's ?user= parameter. */
export function useEmployees() {
  const s = useEmployeeList()
  const employees = s.employees || []
  const [params, setParams] = useSearchParams()
  const id = params.get('user') || ''
  const choose = (v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('user', v); else n.delete('user'); return n }, { replace: true })
  return { employees, loading: !s.employees && !s.error, id, chosen: employees.find((u) => u.id === id) || null, choose }
}

const nameOf = (u) => `${u.first} ${u.last}`
const detailOf = (u) => [u.employeeId, u.profile?.title].filter(Boolean).join(' · ')

/** A searchable dropdown that looks and works the same on phones and large screens. */
export default function EmployeePicker({ employees, id, choose, label = 'Employee' }) {
  const s = useEmployeeList()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const box = useRef(null)
  const list = useRef(null)
  const uid = useId()
  const chosen = employees.find((u) => u.id === id)

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? employees.filter((u) => `${nameOf(u)} ${u.email || ''} ${detailOf(u)}`.toLowerCase().includes(t)) : employees
  }, [employees, q])

  useEffect(() => {
    if (!open) return undefined
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active, open])

  const toggle = () => { setQ(''); setActive(Math.max(0, employees.findIndex((u) => u.id === id))); setOpen((o) => !o) }
  const pick = (u) => { choose(u ? u.id : ''); setOpen(false) }
  const onKey = (e) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) pick(shown[active]) }
  }

  const empty = !employees.length
  return (
    <div ref={box} className="relative md:w-[420px]">
      <span className="field-label" id={`${uid}-label`}>{label}</span>
      <button type="button" onClick={toggle} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${uid}-label`}
        className="field flex items-center justify-between gap-3 text-left">
        <span className={`min-w-0 truncate ${chosen ? '' : 'text-slate'}`}>
          {chosen ? <>{nameOf(chosen)}{detailOf(chosen) && <span className="text-slate"> · {detailOf(chosen)}</span>}</> : empty && !s.error ? 'Loading employees…' : 'Choose an employee'}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {s.error && empty && (
        <p role="alert" className="mt-2 text-[13.5px] text-red-700">{s.error} <button type="button" onClick={() => loadEmployees().catch(() => {})} className="font-medium underline">Retry</button></p>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-line">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search size={16} className="shrink-0 text-slate" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0) }} onKeyDown={onKey}
              placeholder="Search by name, ID or title" aria-label="Search employees" aria-controls={`${uid}-list`}
              className="h-11 w-full bg-transparent text-[15px] focus:outline-none" />
          </div>
          <ul ref={list} id={`${uid}-list`} role="listbox" aria-labelledby={`${uid}-label`} data-lenis-prevent className="max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain py-1">
            {shown.map((u, i) => (
              <li key={u.id} role="option" aria-selected={u.id === id} data-active={i === active}
                onPointerEnter={() => setActive(i)} onClick={() => pick(u)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[15px] ${i === active ? 'bg-mist' : ''}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink">{nameOf(u)}</span>
                  {detailOf(u) && <span className="block truncate text-[13px] text-slate">{detailOf(u)}</span>}
                </span>
                {u.id === id && <Check size={16} className="shrink-0 text-bridge-700" />}
              </li>
            ))}
            {!shown.length && <li className="px-4 py-6 text-center text-[14px] text-slate">{empty ? (s.error ? 'Could not load employees.' : 'Loading employees…') : 'No employees match your search.'}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
