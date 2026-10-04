import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from './useApi'

/** Approved employees (not admins), and the one chosen in the page's ?user= parameter. */
export function useEmployees() {
  const people = useApi('/admin/users?status=approved')
  const employees = useMemo(() => (people.data?.users || []).filter((u) => u.role !== 'admin'), [people.data])
  const [params, setParams] = useSearchParams()
  const id = params.get('user') || ''
  const choose = (v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('user', v); else n.delete('user'); return n }, { replace: true })
  return { employees, loading: people.loading, id, chosen: employees.find((u) => u.id === id) || null, choose }
}

export default function EmployeePicker({ employees, id, choose, label = 'Employee' }) {
  return (
    <label className="block md:w-[420px]">
      <span className="field-label">{label}</span>
      <select value={id} onChange={(e) => choose(e.target.value)} className="field">
        <option value="">Choose an employee</option>
        {employees.map((u) => <option key={u.id} value={u.id}>{u.first} {u.last}{u.employeeId ? ` · ${u.employeeId}` : ''}{u.profile?.title ? ` · ${u.profile.title}` : ''}</option>)}
      </select>
    </label>
  )
}
