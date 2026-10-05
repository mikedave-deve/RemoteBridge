import { useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '../lib/api'
import { Card, Notice } from './ui'

/** A simple name and surname submission; the details are sent to the company admin. */
export default function DetailsBox({ box, title, sub, id }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ text: '' })
  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = Object.fromEntries(new FormData(form))
    if (!f.first.trim() || !f.last.trim()) return setMsg({ text: 'Enter both the name and the surname.', tone: 'red' })
    setBusy(true); setMsg({ text: '' })
    try {
      await api('/me/details', { method: 'POST', body: { box, first: f.first, last: f.last } })
      form.reset(); setMsg({ text: 'Submitted. Our team has received your details and will be in touch.', tone: 'green' })
    } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  return (
    <Card title={title}>
      {sub && <p className="mb-5 text-[14.5px] text-slate">{sub}</p>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
        <div><label className="field-label" htmlFor={`${id}-first`}>Name</label><input id={`${id}-first`} name="first" autoComplete="given-name" maxLength={60} className="field" /></div>
        <div><label className="field-label" htmlFor={`${id}-last`}>Surname</label><input id={`${id}-last`} name="last" autoComplete="family-name" maxLength={60} className="field" /></div>
        <button disabled={busy} className="btn-primary h-12 disabled:opacity-60"><Send size={16} /> Submit details</button>
      </form>
      {msg.text && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Card>
  )
}
