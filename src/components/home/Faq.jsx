import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { gsap, useGSAP } from '../../lib/gsap'
import { site } from '../../lib/siteData'

export const faqs = [
  ['Do I have to pay anything to apply?', 'No. PremierRemoteBridge is paid by employers. Job seekers never pay a fee, and no legitimate employer on our board will ask you to pay for training, equipment or a background check.'],
  ['Are these jobs really 100% remote?', 'Yes. Every job on PremierRemoteBridge is fully work-from-home within the United States. Some roles are open to residents of specific states for payroll or licensing reasons, and the listing always says which.'],
  ['Will I be a W-2 employee or a 1099 contractor?', 'Most roles are W-2 employment with benefits such as health insurance, a 401(k) and paid time off. Contract roles are clearly marked as 1099 on the listing, along with how pay works.'],
  ['What equipment do I need?', 'Usually a quiet workspace and reliable high-speed internet (25 Mbps or more). Most full-time employers ship a laptop and headset to your home before your first day.'],
  ['I have never worked remotely. Can I still apply?', 'Absolutely. Many of our data entry, customer support and administrative roles are entry level and include paid training. Your recruiter will help you prepare.'],
  ['How do I spot a work-from-home scam?', 'Real employers never ask you to pay upfront, deposit a check and send money back, or interview only by text message. Every employer on PremierRemoteBridge is verified, and your recruiter is always a real person you can call.'],
]

export default function Faq() {
  const ref = useRef(null)
  const [open, setOpen] = useState(0)
  const { contextSafe } = useGSAP({ scope: ref })
  const toggle = contextSafe((i) => {
    const panels = ref.current.querySelectorAll('[data-panel]')
    panels.forEach((p, j) => {
      const opening = j === i && open !== i
      gsap.to(p, { height: opening ? 'auto' : 0, duration: 0.6, ease: 'expo.inOut' })
    })
    setOpen(open === i ? -1 : i)
  })

  return (
    <section ref={ref} className="bg-white py-28 lg:py-36">
      <div className="frame grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="text-[clamp(38px,4.4vw,56px)] tracking-tightest">Questions we hear most</h2>
          <p className="mt-5 text-[17px] text-slate">Something else? Email <a href={`mailto:${site.contactEmail}`} className="text-bridge-600 underline decoration-bridge-200 underline-offset-4 hover:decoration-bridge-500">{site.contactEmail}</a> and a person will reply within one business day.</p>
        </div>
        <div className="border-t border-line lg:col-span-7 lg:col-start-6">
          {faqs.map(([q, a], i) => (
            <div key={q} className="border-b border-line">
              <h3 className="font-sans text-[19px] font-medium tracking-normal">
                <button onClick={() => toggle(i)} aria-expanded={open === i} aria-controls={`faq-${i}`}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-bridge-700">
                  {q}
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 transition-all duration-500 ease-expo ${open === i ? 'rotate-45 bg-bridge-500 text-white ring-bridge-500' : 'ring-line'}`}>
                    <Plus size={18} strokeWidth={1.6} />
                  </span>
                </button>
              </h3>
              <div id={`faq-${i}`} data-panel className="overflow-hidden" style={{ height: i === 0 ? 'auto' : 0 }}>
                <p className="max-w-[62ch] pb-7 pr-14 text-[17px] leading-relaxed text-slate">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
