import { useState } from 'react'
import { BookOpen, Briefcase, FileBadge, HeartHandshake, HeartPulse, Laptop, Receipt, Wallet } from 'lucide-react'
import { serviceRequests, services } from '../../data/portalExtra'
import { employee } from '../../data/portal'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'

const icons = { it: Laptop, payroll: Wallet, benefits: HeartPulse, reimburse: Receipt, learning: BookOpen, career: Briefcase, eap: HeartHandshake, verify: FileBadge }

// Plain-text letter generated in the browser; a real system would issue a signed PDF.
const downloadLetter = () => {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const text = `PremierRemoteBridge, Inc.\n1180 Peachtree St NE, Atlanta, GA 30309\n\n${today}\n\nTo whom it may concern,\n\nThis letter confirms that ${employee.first} ${employee.last} has been employed by PremierRemoteBridge, Inc. since ${employee.startDate}.\n\nJob title: ${employee.title}\nEmployment type: ${employee.type}\nWork location: Remote, ${employee.workCity}, ${employee.workState}\n\nFor salary details, please contact verifications@premierremotebridge.com with the employee's written consent.\n\nSincerely,\nPeople Operations\nPremierRemoteBridge, Inc.\n`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'employment-verification-letter.txt' })
  a.click(); URL.revokeObjectURL(url)
}

export default function Services() {
  const [active, setActive] = useState(null)
  const [requests, setRequests] = useState(serviceRequests)
  const [msg, setMsg] = useState('')
  const svc = services.find((s) => s.key === active)

  const submit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const id = `SR-${8903 + requests.length}`
    setRequests((r) => [{ id, service: svc.title, subject: String(f.get('subject')).slice(0, 120), opened: 'Today', status: 'Open' }, ...r])
    setMsg(`Request ${id} sent to ${svc.title}. Expected response: ${svc.response.toLowerCase()}.`)
    setActive(null)
  }

  return (
    <div className="space-y-6">
      <PageHead title="Company services" sub="Support PremierRemoteBridge provides to every employee, wherever you work from." />
      {msg && <Notice>{msg}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((s) => {
          const Icon = icons[s.key]
          return (
            <div key={s.key} className={`flex flex-col rounded-2xl bg-white p-6 ring-1 transition-shadow ${active === s.key ? 'ring-2 ring-bridge-500' : 'ring-line'}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-bridge-50 text-bridge-700"><Icon size={20} strokeWidth={1.7} /></span>
              <p className="mt-4 font-semibold">{s.title}</p>
              <p className="mt-1 text-[14px] text-slate">{s.desc}</p>
              <dl className="mt-4 space-y-1 text-[13px] text-slate">
                <div><dt className="inline">Hours: </dt><dd className="inline text-ink">{s.hours}</dd></div>
                <div><dt className="inline">Response: </dt><dd className="inline text-ink">{s.response}</dd></div>
              </dl>
              <div className="mt-auto pt-5">
                {s.key === 'verify'
                  ? <button onClick={downloadLetter} className="btn-ghost h-10 w-full text-[14px]">Download letter</button>
                  : s.key === 'eap'
                    ? <a href="tel:+18005550134" className="btn-ghost h-10 w-full text-[14px]">Call (800) 555-0134</a>
                    : <button onClick={() => { setActive(s.key); setMsg('') }} className="btn-ghost h-10 w-full text-[14px]">Request</button>}
              </div>
            </div>
          )
        })}
      </div>

      {svc && (
        <Card title={`New request · ${svc.title}`} action={<button onClick={() => setActive(null)} className="text-[14px] text-slate hover:text-ink">Cancel</button>}>
          <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2"><label className="field-label" htmlFor="sv-subject">Subject</label><input id="sv-subject" name="subject" required maxLength={120} className="field" /></div>
            <div className="lg:col-span-2"><label className="field-label" htmlFor="sv-msg">Details</label><textarea id="sv-msg" name="details" rows={4} required maxLength={2000} className="field-area" /></div>
            {svc.key === 'reimburse' && (
              <>
                <div><label className="field-label" htmlFor="sv-amt">Amount (USD)</label><input id="sv-amt" name="amount" type="number" min="0.01" step="0.01" required className="field" /></div>
                <div><label className="field-label" htmlFor="sv-rcpt">Receipt</label><input id="sv-rcpt" name="receipt" type="file" accept=".pdf,.jpg,.jpeg,.png" required className="field pt-2.5 text-[14px]" /></div>
              </>
            )}
            <p className="text-[13px] text-slate lg:col-span-2">Never include your full Social Security, bank account or password in a request.</p>
            <div><button className="btn-primary">Send request</button></div>
          </form>
        </Card>
      )}

      <Card title="Your requests" pad={false}>
        <Table head={['Request', 'Service', 'Subject', 'Opened', 'Status']}
          rows={requests.map((r) => [<span key="i" className="text-slate">{r.id}</span>, r.service, r.subject, r.opened, <Badge key="s" tone={statusTone(r.status)}>{r.status}</Badge>])} />
      </Card>
    </div>
  )
}
