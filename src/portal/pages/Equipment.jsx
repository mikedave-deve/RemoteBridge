import { useState } from 'react'
import { Laptop, Package, Truck } from 'lucide-react'
import { equipment } from '../../data/portalExtra'
import { usd } from '../../data/portal'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'

export default function Equipment() {
  const [sent, setSent] = useState('')
  const left = equipment.stipend.annual - equipment.stipend.used

  return (
    <div className="space-y-6">
      <PageHead title="Equipment & logistics" sub="Company equipment assigned to you, deliveries on the way, and your home-office budget." />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line"><p className="text-[14px] text-slate">Items assigned</p><p className="mt-2 font-display text-[34px] leading-none">{equipment.assets.length}</p><p className="mt-2 text-[13.5px] text-slate">All in use and covered by IT support</p></div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line"><p className="text-[14px] text-slate">Deliveries on the way</p><p className="mt-2 font-display text-[34px] leading-none">{equipment.shipments.filter((s) => s.status !== 'Delivered').length}</p><p className="mt-2 text-[13.5px] text-slate">Next arrives {equipment.shipments[0].eta}</p></div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line"><p className="text-[14px] text-slate">Home-office budget left</p><p className="mt-2 font-display text-[34px] leading-none">{usd(left)}</p><p className="mt-2 text-[13.5px] text-slate">of {usd(equipment.stipend.annual)} for 2026</p></div>
      </div>

      <Card title="Assigned equipment" pad={false}>
        <Table head={['Item', 'Asset tag', 'Serial', 'Issued', 'Status']}
          rows={equipment.assets.map((a) => [
            <span key="i" className="flex items-start gap-3"><Laptop size={17} className="mt-0.5 shrink-0 text-bridge-700" /><span><span className="block">{a.item}</span>{a.note && <span className="text-[13px] text-slate">{a.note}</span>}</span></span>,
            a.tag, a.serial, a.issued, <Badge key="s" tone="green">{a.status}</Badge>,
          ])} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Shipments" pad={false}>
          <ul className="divide-y divide-line">
            {equipment.shipments.map((s) => (
              <li key={s.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3"><Truck size={18} className="mt-0.5 shrink-0 text-bridge-700" />
                    <div><p className="font-medium">{s.item}</p><p className="text-[13.5px] text-slate">{s.carrier} · {s.tracking}</p></div></div>
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </div>
                <ol className="ml-[30px] mt-3 space-y-1.5 border-l border-line pl-4 text-[13.5px] text-slate">
                  {s.events.map(([t, e]) => <li key={t}><span className="text-ink">{e}</span> · {t}</li>)}
                </ol>
                <p className="ml-[30px] mt-2 text-[13.5px] text-slate">{s.status === 'Delivered' ? s.eta : `Estimated delivery ${s.eta}`} · to {equipment.shipTo}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Home-office stipend">
          <div className="h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={equipment.stipend.used} aria-valuemin={0} aria-valuemax={equipment.stipend.annual} aria-label="Stipend used">
            <div className="h-full rounded-full bg-bridge-600" style={{ width: `${(equipment.stipend.used / equipment.stipend.annual) * 100}%` }} />
          </div>
          <p className="mt-2 text-[13.5px] text-slate">{usd(equipment.stipend.used)} used · {usd(left)} left · resets January 1</p>
          <ul className="mt-5 divide-y divide-line text-[14.5px]">
            {equipment.stipend.items.map(([n, a, d]) => <li key={n} className="flex justify-between gap-4 py-3"><span>{n}<span className="block text-[13px] text-slate">{d}</span></span><span className="tabular-nums">{usd(a)}</span></li>)}
          </ul>
          <p className="mt-4 text-[13.5px] text-slate">Submit receipts for desks, chairs, lighting or headsets under Company services → Expense reimbursement.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Request equipment or report a problem">
          {sent ? <Notice>{sent}</Notice> : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(`Request EQ-${Math.floor(1000 + Math.random() * 8999)} received. IT will reply within 2 hours on business days; approved items ship within 2 business days.`) }} className="space-y-4">
              <div><label className="field-label" htmlFor="eq-type">Request type</label>
                <select id="eq-type" className="field"><option>Something is broken or not working</option><option>Request new equipment</option><option>Lost or stolen device (urgent)</option><option>Change my shipping address</option></select></div>
              <div><label className="field-label" htmlFor="eq-item">Item</label>
                <select id="eq-item" className="field">{equipment.assets.map((a) => <option key={a.tag}>{a.item} ({a.tag})</option>)}<option>Other</option></select></div>
              <div><label className="field-label" htmlFor="eq-msg">Details</label><textarea id="eq-msg" rows={4} required maxLength={1000} className="field-area" placeholder="What happened, and when?" /></div>
              <button className="btn-primary">Send request</button>
            </form>
          )}
        </Card>
        <Card title="Returning equipment">
          <div className="flex gap-3"><Package size={20} className="mt-0.5 shrink-0 text-bridge-700" />
            <div className="space-y-3 text-[14.5px] text-slate">
              <p>If you leave PremierRemoteBridge or an item is replaced, we email you a prepaid return label and send a box if you need one.</p>
              <p>Please return equipment within 10 business days. Don’t wipe the laptop yourself; IT does this securely once it arrives.</p>
              <p>A lost or stolen laptop must be reported right away so IT can lock it remotely and protect client data.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
