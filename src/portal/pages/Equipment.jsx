import { useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'
import { EQUIPMENT_TYPES } from '../../lib/support'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'
import Tracking from '../Tracking'

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function Equipment() {
  const [number, setNumber] = useState('')
  const [shipment, setShipment] = useState(null)
  const [trackErr, setTrackErr] = useState('')
  const [tracking, setTracking] = useState(false)
  const [sent, setSent] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const mine = useApi('/me/shipments')
  const requests = useApi('/me/equipment-requests')

  const track = async (n = number) => {
    const t = n.trim()
    if (!t) return setTrackErr('Enter your tracking number.')
    setTracking(true); setTrackErr('')
    try { const r = await api(`/me/shipments/${encodeURIComponent(t)}`); setShipment(r.shipment); setNumber(r.shipment.tracking) }
    catch (e) { setShipment(null); setTrackErr(e.message) } finally { setTracking(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    setBusy(true); setErr('')
    try {
      const { request } = await api('/me/equipment-requests', { method: 'POST', body: Object.fromEntries(new FormData(form)) })
      setSent(`Request ${request.number} received. IT will reply within 2 hours on business days; approved items ship within 2 business days.`)
      form.reset(); requests.reload()
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Equipment & logistics" sub="Track company equipment on its way to you, or ask IT for help with a device." />

      <Card title="Track your equipment">
        <p className="mb-3 text-[14.5px] text-slate">Enter the tracking number from your equipment email to see where your delivery is.</p>
        <form onSubmit={(e) => { e.preventDefault(); track() }} className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="trk">Tracking number</label>
          <input id="trk" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Enter your tracking number" autoComplete="off" spellCheck={false}
            className="field h-16 flex-1 rounded-2xl text-[18px] tracking-wide uppercase placeholder:text-[16px] placeholder:normal-case placeholder:tracking-normal" />
          <button disabled={tracking} className="btn-primary h-16 shrink-0 rounded-2xl px-8 text-[16px] disabled:opacity-60"><Search size={19} /> Track</button>
        </form>
        {trackErr && <p role="alert" className="mt-3 text-[14px] text-red-700">{trackErr}</p>}
        {(mine.data?.shipments || []).length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13.5px] text-slate">Your shipments:
            {mine.data.shipments.map((s) => <button key={s.tracking} onClick={() => track(s.tracking)} className={`hover:underline ${s.paused ? 'text-red-700' : 'text-bridge-700'}`}>{s.tracking}{s.contents ? ` (${s.contents})` : ''}</button>)}
          </p>
        )}
      </Card>

      {shipment && <Tracking s={shipment} onRefresh={() => track(shipment.tracking)} refreshing={tracking} />}

      <Card title="Request equipment or report a problem">
        {sent && <div className="mb-5"><Notice>{sent}</Notice></div>}
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div><label className="field-label" htmlFor="eq-type">Request type</label>
            <select id="eq-type" name="type" className="field">{EQUIPMENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="field-label" htmlFor="eq-item">Item</label>
            <input id="eq-item" name="item" required maxLength={120} placeholder="e.g. Laptop, headset, monitor" className="field" /></div>
          <div className="md:col-span-2"><label className="field-label" htmlFor="eq-msg">Details</label><textarea id="eq-msg" name="details" rows={4} required maxLength={1000} className="field-area" placeholder="What happened, and when?" /></div>
          {err && <p role="alert" className="text-[14px] text-red-700 md:col-span-2">{err}</p>}
          <div><button disabled={busy} className="btn-primary disabled:opacity-60">Send request</button></div>
        </form>
      </Card>

      {(requests.data?.requests || []).length > 0 && (
        <Card title="Your equipment requests" pad={false}>
          <Table head={['Request', 'Type', 'Item', 'Opened', 'Status']}
            rows={requests.data.requests.map((r) => [<span key="n" className="text-slate">{r.number}</span>, r.type,
              <span key="i">{r.item}{r.reply && <span className="block text-[13px] text-slate">Reply: {r.reply}</span>}</span>, fmt(r.createdAt), <Badge key="s" tone={statusTone(r.status)}>{r.status}</Badge>])} />
        </Card>
      )}
    </div>
  )
}
