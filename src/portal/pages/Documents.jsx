import { useState } from 'react'
import { ExternalLink, FileText, ScrollText } from 'lucide-react'
import { notices } from '../../data/portal'
import { api, fileUrl } from '../../lib/api'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Notice, PageHead, Tabs, statusTone } from '../ui'

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Official government pages for each required workplace poster.
const NOTICE_LINKS = [
  [/flsa|minimum wage and overtime/i, 'https://www.dol.gov/agencies/whd/posters/flsa'],
  [/eeoc|know your rights|discrimination/i, 'https://www.eeoc.gov/poster'],
  [/fmla|family and medical/i, 'https://www.dol.gov/agencies/whd/posters/fmla'],
  [/polygraph/i, 'https://www.dol.gov/agencies/whd/posters/eppa'],
  [/userra|uniformed services/i, 'https://www.dol.gov/agencies/vets/programs/userra'],
  [/osha|job safety/i, 'https://www.osha.gov/publications/poster'],
  [/ohio/i, 'https://com.ohio.gov/divisions-and-programs/industrial-compliance/wage-and-hour'],
]
const noticeLink = (n) => (NOTICE_LINKS.find(([re]) => re.test(n)) || [])[1]

export default function Documents() {
  const { data, error, reload } = useApi('/me/documents')
  const [cat, setCat] = useState('All')
  const [err, setErr] = useState('')
  const docs = data?.documents || []
  const cats = ['All', ...new Set(docs.map((d) => d.category))]
  const list = docs.filter((d) => cat === 'All' || d.category === cat)

  const acknowledge = async (d) => {
    // Open the document first, then record the acknowledgement.
    window.open(fileUrl(`/me/documents/${d.id}/file?view=1`), '_blank', 'noopener')
    try { await api(`/me/documents/${d.id}/ack`, { method: 'POST' }); reload() } catch (e) { setErr(e.message) }
  }

  return (
    <div className="space-y-6">
      <PageHead title="Documents" sub="Your employment paperwork, company policies and required notices." />
      {(error || err) && <Notice tone="red">{error || err}</Notice>}

      <Card pad={false}>
        {cats.length > 2 && <div className="px-6 pt-2"><Tabs tabs={cats} value={cat} onChange={setCat} /></div>}
        <ul className="divide-y divide-line">
          {list.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
              <FileText size={18} className="hidden shrink-0 text-bridge-700 sm:block" />
              <div className="flex-1">
                <p className="font-medium text-ink">{d.name}</p>
                <p className="text-[13px] text-slate">{d.category} · {d.acknowledgedAt ? `Acknowledged ${fmt(d.acknowledgedAt)}` : fmt(d.createdAt)}</p>
              </div>
              <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              {d.status === 'Action required'
                ? <button onClick={() => acknowledge(d)} className="btn-primary h-10 px-4 text-[14px]">Read and acknowledge</button>
                : <a href={fileUrl(`/me/documents/${d.id}/file?view=1`)} target="_blank" rel="noopener noreferrer" className="btn-ghost h-10 px-4 text-[14px]">View</a>}
            </li>
          ))}
          {data && !docs.length && <li className="px-6 py-10 text-center text-slate">No documents yet. Paperwork and policies HR shares with you will appear here.</li>}
          {!data && !error && <li className="px-6 py-10 text-center text-slate">Loading…</li>}
        </ul>
      </Card>

      <Card title="Workplace notices">
        <p className="text-[14px] text-slate">Federal and state employment law posters, provided electronically because you work remotely. Click a notice to read the official version.</p>
        <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
          {notices.map((n) => {
            const href = noticeLink(n)
            return (
              <li key={n}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2.5 text-[14.5px] text-ink hover:text-bridge-700">
                    <ScrollText size={16} className="mt-0.5 shrink-0 text-bridge-700" />
                    <span className="underline decoration-line underline-offset-2 group-hover:decoration-bridge-400">{n}</span>
                    <ExternalLink size={13} className="mt-1 shrink-0 text-slate-soft" />
                  </a>
                ) : (
                  <span className="flex items-start gap-2.5 text-[14.5px] text-ink"><ScrollText size={16} className="mt-0.5 shrink-0 text-bridge-700" />{n}</span>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
