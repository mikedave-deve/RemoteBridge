import { useState } from 'react'
import { FileText, GraduationCap, ScrollText } from 'lucide-react'
import { documents, notices, training } from '../../data/portal'
import { Badge, Card, PageHead, Tabs, statusTone } from '../ui'

export default function Documents() {
  const cats = ['All', ...new Set(documents.map((d) => d.category))]
  const [cat, setCat] = useState('All')
  const [docs, setDocs] = useState(documents)
  const list = docs.filter((d) => cat === 'All' || d.category === cat)
  const acknowledge = (name) => setDocs((ds) => ds.map((d) => (d.name === name ? { ...d, status: 'Acknowledged', date: 'Today' } : d)))

  return (
    <div className="space-y-6">
      <PageHead title="Documents" sub="Your employment paperwork, company policies, required notices and training." />

      <Card pad={false}>
        <div className="px-6 pt-2"><Tabs tabs={cats} value={cat} onChange={setCat} /></div>
        <ul className="divide-y divide-line">
          {list.map((d) => (
            <li key={d.name} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
              <FileText size={18} className="hidden shrink-0 text-bridge-700 sm:block" />
              <div className="flex-1">
                <p className="font-medium text-ink">{d.name}</p>
                <p className="text-[13px] text-slate">{d.category} · {d.date}</p>
              </div>
              <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              {d.status === 'Action required'
                ? <button onClick={() => acknowledge(d.name)} className="btn-primary h-10 px-4 text-[14px]">Read and acknowledge</button>
                : <button className="btn-ghost h-10 px-4 text-[14px]">View</button>}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Required training" pad={false}>
          <ul className="divide-y divide-line">
            {training.map((t) => (
              <li key={t.name} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <GraduationCap size={18} className="mt-0.5 shrink-0 text-bridge-700" />
                  <div className="flex-1"><p className="font-medium">{t.name}</p><p className="text-[13px] text-slate">{t.due}</p></div>
                  <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                </div>
                {t.progress !== undefined && t.status !== 'Complete' && (
                  <div className="ml-[30px] mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-bridge-600" style={{ width: `${t.progress}%` }} /></div>
                    <span className="text-[13px] text-slate">{t.progress}%</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Workplace notices">
          <p className="text-[14px] text-slate">Federal and state employment law posters, provided electronically because you work remotely.</p>
          <ul className="mt-4 space-y-2.5">
            {notices.map((n) => (
              <li key={n}><a href="#" className="flex items-start gap-2.5 text-[14.5px] text-ink hover:text-bridge-700"><ScrollText size={16} className="mt-0.5 shrink-0 text-bridge-700" />{n}</a></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
