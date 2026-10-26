import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

// The employee list is shared by every admin page and kept in memory, so the picker fills
// instantly when you move between pages. Each page still refreshes it quietly in the background.
let cache = null
let inflight = null
const listeners = new Set()

export function loadEmployees() {
  inflight ??= api('/admin/employees')
    .then(({ employees }) => { cache = employees; listeners.forEach((f) => f(employees)); return employees })
    .finally(() => { inflight = null })
  return inflight
}
export const clearEmployees = () => { cache = null }

/** Approved employees (not admins), and the one chosen in the page's ?user= parameter. */
export function useEmployees() {
  const [employees, setEmployees] = useState(() => cache || [])
  const [loading, setLoading] = useState(!cache)
  useEffect(() => {
    listeners.add(setEmployees)
    loadEmployees().catch(() => {}).finally(() => setLoading(false))
    return () => { listeners.delete(setEmployees) }
  }, [])
  const [params, setParams] = useSearchParams()
  const id = params.get('user') || ''
  const choose = (v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('user', v); else n.delete('user'); return n }, { replace: true })
  return { employees, loading, id, chosen: employees.find((u) => u.id === id) || null, choose }
}

export default function EmployeePicker({ employees, id, choose, label = 'Employee' }) {
  return (
    <label className="block md:w-[420px]">
      <span className="field-label">{label}</span>
      <select value={id} onChange={(e) => choose(e.target.value)} className="field">
        <option value="">{employees.length ? 'Choose an employee' : 'Loading employees…'}</option>
        {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}{u.employeeId ? ` · ${u.employeeId}` : ''}{u.profile?.title ? ` · ${u.profile.title}` : ''}</option>)}
      </select>
    </label>
  )
}
