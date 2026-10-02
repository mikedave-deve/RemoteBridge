import { useState } from 'react'
import { HeartHandshake, Mail, Phone, ShieldAlert } from 'lucide-react'
import { employee } from '../../data/portal'
import { Card, Notice, PageHead } from '../ui'
import { site } from '../../lib/siteData'

const faqs = [
  ['When is payday?', 'Every other Friday by direct deposit. If payday falls on a bank holiday, you are paid the business day before.'],
  ['My paycheck looks wrong. What should I do?', 'Open a payroll request below with the pay date and what looks incorrect. Payroll replies within one business day and corrects underpayments on an off-cycle check.'],
  ['How do I change my tax withholding?', 'Update your W-4 in Tax forms. Changes apply from the next payroll.'],
  ['I moved to another state. What changes?', 'Update your address in Profile and tell HR before your move. Your state and local taxes, and sometimes your benefits, depend on where you work.'],
  ['Who do I ask about my laptop or equipment?', 'Choose “Equipment and IT” below. Replacement equipment ships within two business days.'],
]

export default function Help() {
  const [sent, setSent] = useState('')
  return (
    <div className="space-y-6">
      <PageHead title="Help & HR" sub="Payroll, benefits, equipment or a workplace concern. A real person replies within one business day." />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <Phone size={20} className="text-bridge-700" />
          <p className="mt-3 font-medium">HR and payroll line</p>
          <p className="text-[14px] text-slate">{site.contactPhone} · Mon–Fri, 8 AM–6 PM ET</p>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <Mail size={20} className="text-bridge-700" />
          <p className="mt-3 font-medium">Your recruiter</p>
          <p className="text-[14px] text-slate">{employee.recruiter} · s.adams@premierremotebridge.com</p>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <HeartHandshake size={20} className="text-bridge-700" />
          <p className="mt-3 font-medium">Employee Assistance Program</p>
          <p className="text-[14px] text-slate">Free, confidential support 24/7 · (800) 555-0134</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Send a request">
          {sent ? <Notice>{sent}</Notice> : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(`Request received. Reference HR-${Math.floor(10000 + Math.random() * 89999)}. We will reply to ${employee.email} within one business day.`) }} className="space-y-4">
              <div><label className="field-label" htmlFor="h-topic">Topic</label>
                <select id="h-topic" className="field"><option>Payroll and pay stubs</option><option>Benefits and enrollment</option><option>Time off and leave</option><option>Taxes and W-2</option><option>Equipment and IT</option><option>Something else</option></select></div>
              <div><label className="field-label" htmlFor="h-msg">How can we help?</label><textarea id="h-msg" rows={5} required maxLength={2000} className="field-area" placeholder="Include dates and amounts if your question is about pay." /></div>
              <p className="text-[13px] text-slate">Never include your full Social Security or bank account number in a message.</p>
              <button className="btn-primary">Send request</button>
            </form>
          )}
        </Card>

        <Card title="Common questions" pad={false}>
          <ul className="divide-y divide-line">
            {faqs.map(([q, a]) => (
              <li key={q}>
                <details className="group px-6 py-4">
                  <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">{q}</summary>
                  <p className="mt-2 text-[14.5px] text-slate">{a}</p>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-white p-6 ring-1 ring-line">
        <ShieldAlert size={22} className="mt-0.5 shrink-0 text-bridge-700" />
        <div>
          <p className="font-medium">Report a workplace concern</p>
          <p className="mt-1 text-[14.5px] text-slate">Harassment, discrimination, safety issues or wage concerns can be reported confidentially to HR or anonymously through our ethics line at (800) 555-0199. PremierRemoteBridge prohibits retaliation against anyone who raises a concern in good faith.</p>
        </div>
      </div>
    </div>
  )
}
