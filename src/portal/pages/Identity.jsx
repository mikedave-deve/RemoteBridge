import { useState } from 'react'
import { BadgeCheck, FileCheck2, Lock, UploadCloud, X } from 'lucide-react'
import { identity } from '../../data/portalExtra'
import { Badge, Card, Field, Notice, PageHead, Table, statusTone } from '../ui'

const MAX = 10 * 1024 * 1024
// Accept only real JPEG, PNG or PDF files, checked by their first bytes.
const sniff = (file) => new Promise((resolve) => {
  const r = new FileReader()
  r.onload = () => {
    const h = [...new Uint8Array(r.result)].map((x) => x.toString(16).padStart(2, '0')).join('')
    resolve(h.startsWith('ffd8ff') || h.startsWith('89504e47') || h.startsWith('25504446'))
  }
  r.onerror = () => resolve(false)
  r.readAsArrayBuffer(file.slice(0, 8))
})

function Drop({ label, file, onFile, error }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl bg-mist p-4 ring-1 ring-line">
          <FileCheck2 size={20} className="text-bridge-700" />
          <span className="min-w-0 flex-1 truncate text-[14px]">{file.name}</span>
          <button type="button" onClick={() => onFile(null)} aria-label={`Remove ${label}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white"><X size={15} /></button>
        </div>
      ) : (
        <label className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-[14px] transition-colors ${error ? 'border-red-300' : 'border-line hover:border-bridge-300 hover:bg-paper'}`}>
          <UploadCloud size={24} className="text-bridge-600" />
          <span className="mt-2 font-medium">Choose a file</span>
          <span className="text-[13px] text-slate">JPG, PNG or PDF, up to 10 MB</span>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="sr-only" onChange={(e) => { onFile(e.target.files[0]); e.target.value = '' }} />
        </label>
      )}
    </div>
  )
}

export default function Identity() {
  const [front, setFront] = useState(null)
  const [back, setBack] = useState(null)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)

  const take = (set) => async (f) => {
    if (!f) return set(null)
    if (f.size > MAX) return setErr('That file is over 10 MB. Take a smaller photo or scan and try again.')
    if (!(await sniff(f))) return setErr('That file is not a real JPG, PNG or PDF.')
    setErr(''); set(f)
  }

  return (
    <div className="space-y-6">
      <PageHead title="Identity verification" sub="Your Form I-9, E-Verify and pre-employment screening records. Federal law requires every U.S. employer to verify identity and work authorization." />

      <div className="flex flex-col gap-4 rounded-2xl bg-bridge-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-bridge-200"><BadgeCheck size={28} /></span>
        <div className="flex-1">
          <p className="font-display text-[28px] leading-tight">Your identity and work authorization are verified</p>
          <p className="mt-1 text-[15px] text-white/70">{identity.reverifyNote}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Form I-9" action={<Badge tone="green">{identity.i9.status}</Badge>}>
          <dl className="space-y-4">
            <Field label="Section 1 (your information and attestation)" value={identity.i9.section1} />
            <Field label="Section 2 (document review)" value={identity.i9.section2} />
          </dl>
          <div className="mt-5 space-y-2">
            {identity.documents.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 text-[14px] ring-1 ring-line">
                <span><span className="font-medium">{d.list}: {d.name}</span><span className="block text-slate">No. {d.number} · Expires {d.expires}</span></span>
                <Badge tone="green">{d.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="E-Verify" action={<Badge tone="green">Authorized</Badge>}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Case number" value={identity.everify.case} />
            <Field label="Result" value={identity.everify.result} />
            <Field label="Case closed" value={identity.everify.closed} />
            <Field label="Run by" value="PremierRemoteBridge, Inc." />
          </dl>
          <p className="mt-5 text-[13.5px] text-slate">E-Verify confirms the information from your Form I-9 with the Department of Homeland Security and the Social Security Administration.</p>
        </Card>
      </div>

      <Card title="Pre-employment screening" pad={false}>
        <Table head={['Check', 'Provider', 'Completed', 'Result']}
          rows={identity.screening.map((s) => [s.name, s.vendor, s.date, <Badge key="r" tone={statusTone(s.status)}>{s.status}</Badge>])} />
        <p className="border-t border-line px-6 py-4 text-[13.5px] text-slate">Screening follows the Fair Credit Reporting Act. You can request a free copy of any report from HR.</p>
      </Card>

      <Card title="Update an identity document">
        {sent ? <Notice>Documents received. An HR specialist will review them within two business days and update your record. You will get an email either way.</Notice> : (
          <form onSubmit={(e) => { e.preventDefault(); if (!front) return setErr('Add a photo or scan of the front of your document.'); setSent(true) }} className="space-y-5">
            <p className="text-[14.5px] text-slate">Only needed if your document was renewed, your legal name changed, or HR asked you to. Upload a clear color photo of the whole document.</p>
            <div><label className="field-label" htmlFor="id-type">Document type</label>
              <select id="id-type" className="field sm:max-w-sm"><option>U.S. passport</option><option>Permanent resident card</option><option>Driver’s license</option><option>Social Security card</option><option>Employment authorization document</option></select></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Drop label="Front of document" file={front} onFile={take(setFront)} error={!!err && !front} />
              <Drop label="Back of document (if any)" file={back} onFile={take(setBack)} />
            </div>
            {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
            <p className="flex items-start gap-2 text-[13.5px] text-slate"><Lock size={15} className="mt-0.5 shrink-0" />Files are encrypted and visible only to HR staff who handle I-9 records. Never send identity documents by email or chat.</p>
            <button className="btn-primary">Submit for review</button>
          </form>
        )}
      </Card>
    </div>
  )
}
