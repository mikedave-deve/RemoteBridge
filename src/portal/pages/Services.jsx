import { useState } from 'react'
import { BookOpen, Briefcase, FileBadge, HeartHandshake, HeartPulse, Laptop, Receipt, Wallet } from 'lucide-react'
import { services } from '../../data/portalExtra'
import { employee } from '../../data/portal'
import { api } from '../../lib/api'
import { site, useSite } from '../../lib/siteData'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Table, statusTone } from '../ui'
import DetailsBox from '../DetailsBox'

const icons = { it: Laptop, payroll: Wallet, benefits: HeartPulse, reimburse: Receipt, learning: BookOpen, career: Briefcase, eap: HeartHandshake, verify: FileBadge }
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Plain-text letter generated in the browser from the employee's real details.
const downloadLetter = () => {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const text = `PremierRemoteBridge, Inc.\n${site.address || ''}\n\n${today}\n\nTo whom it may concern,\n\nThis letter confirms that ${employee.first} ${employee.last} has been employed by PremierRemoteBridge, Inc. since ${employee.startDate}.\n\nJob title: ${employee.title}\nEmployment type: ${employee.type}\nWork location: Remote${employee.workCity ? `, ${employee.workCity}, ${employee.workState}` : ''}\n\nFor salary details, please contact verifications@premierremotebridge.com with the employee's written consent.\n\nSincerely,\nPeople Operations\nPremierRemoteBridge, Inc.\n`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'employment-verification-letter.txt' })
  a.click(); URL.revokeObjectURL(url)
}

export default function Services() {
  useSite()
  const [active, setActive] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useApi('/me/service-requests')
  const svc = services.find((s) => s.key === active)

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('service', svc.key)
    setBusy(true); setErr('')
    try {
      const { request } = await api('/me/service-requests', { method: 'POST', form: fd })
      setMsg(`Request ${request.number} sent to ${svc.title}. Expected response: ${svc.response.toLowerCase()}.`)
      setActive(null); list.reload()
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const requests = list.data?.requests || []

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
                    : <button onClick={() => { setActive(s.key); setMsg(''); setErr('') }} className="btn-ghost h-10 w-full text-[14px]">Request</button>}
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
            {err && <p role="alert" className="text-[14px] text-red-700 lg:col-span-2">{err}</p>}
            <div><button disabled={busy} className="btn-primary disabled:opacity-60">Send request</button></div>
          </form>
        </Card>
      )}

      <DetailsBox id="pl" box="phone" title="COMPANY PHONE LINE" sub="Enter your usernaame and passwod of your current mobile phone service provider to request your company phone line. Your details go straight to the admin team." />

      <Card title="Your requests" pad={false}>
        {list.data && !requests.length ? <p className="px-6 py-8 text-center text-slate">No requests yet. Requests you send appear here with their status.</p> : (
          <Table head={['Request', 'Service', 'Subject', 'Opened', 'Status']}
            rows={requests.map((r) => [<span key="i" className="text-slate">{r.number}</span>, r.serviceTitle,
              <span key="s">{r.subject}{r.reply && <span className="block text-[13px] text-slate">Reply: {r.reply}</span>}</span>, fmt(r.createdAt), <Badge key="b" tone={statusTone(r.status)}>{r.status}</Badge>])} />
        )}
        {!list.data && <p className="px-6 py-8 text-center text-slate">{list.error || 'Loading…'}</p>}
      </Card>
    </div>
  )
}
