import { useState } from 'react'
import { BadgeCheck, Clock, FileCheck2, Lock, UploadCloud, X } from 'lucide-react'
import { api } from '../../lib/api'
import { appendUpload, prepareUpload } from '../../lib/upload'
import { useApi } from '../../admin/useApi'
import { Badge, Card, Field, Notice, PageHead, Table, statusTone } from '../ui'

const MAX = 10 * 1024 * 1024
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')
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

function Drop({ label, hint, file, onFile, error }) {
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
          <span className="text-[13px] text-slate">{hint}</span>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="sr-only" onChange={(e) => { onFile(e.target.files[0]); e.target.value = '' }} />
        </label>
      )}
    </div>
  )
}

const BANNER = {
  Verified: ['Your identity and work authorization are verified', 'HR has verified your documents. We will contact you if your work authorization ever needs updating.'],
  'In progress': ['Your identity verification is in progress', 'HR is reviewing your documents. Each item below shows Verified as soon as it is done.'],
  'Not started': ['Verify your identity to finish your setup', 'Federal law requires every U.S. employer to verify identity and work authorization. Submit your document below to get started.'],
}

export default function Identity() {
  const { data: d, error, reload } = useApi('/me/identity')
  const [front, setFront] = useState(null)
  const [back, setBack] = useState(null)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [docType, setDocType] = useState('Driver’s license')
  const [ssn, setSsn] = useState('')
  const isSsn = docType === 'Social Security number'
  const formatSsn = (v) => { const x = v.replace(/\D/g, '').slice(0, 9); return x.length > 5 ? `${x.slice(0, 3)}-${x.slice(3, 5)}-${x.slice(5)}` : x.length > 3 ? `${x.slice(0, 3)}-${x.slice(3)}` : x }

  const take = (set) => async (f) => {
    if (!f) return set(null)
    if (f.size > MAX) return setErr('That file is over 10 MB. Take a smaller photo and try again.')
    if (!(await sniff(f))) return setErr('That file is not a real JPG, PNG or PDF.')
    setErr(''); set(f)
  }
  const submit = async (e) => {
    e.preventDefault()
    if (isSsn && ssn.replace(/\D/g, '').length !== 9) return setErr('Enter your 9-digit Social Security number.')
    if (!isSsn && !front) return setErr('Add your front selfie.')
    if (!isSsn && !back) return setErr('Add your back selfie.')
    setBusy(true); setErr('')
    try {
      const f = new FormData()
      f.append('type', docType)
      if (isSsn) {
        f.append('number', ssn)
      } else {
        const [upF, upB] = await Promise.all([prepareUpload(front, 'identity'), prepareUpload(back, 'identity')])
        appendUpload(f, upF, { fileField: 'front', refField: 'frontRef' })
        appendUpload(f, upB, { fileField: 'back', refField: 'backRef' })
      }
      await api('/me/identity', { method: 'POST', form: f }); setSent(true); setFront(null); setBack(null); setSsn(''); reload()
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  const [title, sub] = BANNER[d?.overall || 'Not started']
  const verified = d?.overall === 'Verified'
  const Icon = verified ? BadgeCheck : Clock

  return (
    <div className="space-y-6">
      <PageHead title="Identity verification" sub="Your Form I-9, E-Verify and pre-employment screening records. Federal law requires every U.S. employer to verify identity and work authorization." />
      {error && <Notice tone="red">{error}</Notice>}

      <div className="flex flex-col gap-4 rounded-2xl bg-bridge-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-bridge-200"><Icon size={28} /></span>
        <div className="flex-1">
          <p className="font-display text-[28px] leading-tight">{d ? title : 'Loading…'}</p>
          {d && <p className="mt-1 text-[15px] text-white/70">{sub}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Form I-9" action={d && <Badge tone={statusTone(d.i9.status)}>{d.i9.status}</Badge>}>
          <dl className="space-y-4">
            <Field label="Section 1 (your information and attestation)" value={d?.i9.section1At ? `Completed ${fmt(d.i9.section1At)}` : 'Not started. Submit your document below.'} />
            <Field label="Section 2 (document review)" value={d?.i9.section2At ? `Verified by HR, ${fmt(d.i9.section2At)}` : d?.documents.length ? 'Waiting for HR to review your document' : 'Not started'} />
          </dl>
          {d?.documents.length > 0 && (
            <div className="mt-5 space-y-2">
              {d.documents.map((x) => (
                <div key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 text-[14px] ring-1 ring-line">
                  <span><span className="font-medium">{x.type}</span><span className="block text-slate">{x.last4 ? `•••-••-${x.last4}` : 'Front and back selfies'} · Submitted {fmt(x.submittedAt)}{x.note ? ` · ${x.note}` : ''}</span></span>
                  <Badge tone={x.status === 'Rejected' ? 'red' : statusTone(x.status)}>{x.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="E-Verify" action={d && <Badge tone={d.everify.status === 'Authorized' ? 'green' : 'gray'}>{d.everify.status}</Badge>}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Case number" value={d?.everify.case ? `${d.everify.case.slice(0, 7)}•••••` : '—'} />
            <Field label="Result" value={d?.everify.status === 'Authorized' ? 'Employment authorized' : 'Not run yet'} />
            <Field label="Case closed" value={fmt(d?.everify.closedAt) || '—'} />
            <Field label="Run by" value="PremierRemoteBridge, Inc." />
          </dl>
          <p className="mt-5 text-[13.5px] text-slate">E-Verify confirms the information from your Form I-9 with the Department of Homeland Security and the Social Security Administration.</p>
        </Card>
      </div>

      <Card title="Pre-employment screening" pad={false}>
        <Table head={['Check', 'Provider', 'Completed', 'Result']}
          rows={(d?.screening || []).map((s) => [s.name, 'Accredited screening partner (FCRA compliant)', fmt(s.at) || '—', <Badge key="r" tone={statusTone(s.status)}>{s.status}</Badge>])} />
        <p className="border-t border-line px-6 py-4 text-[13.5px] text-slate">Screening follows the Fair Credit Reporting Act. You can request a free copy of any report from HR.</p>
      </Card>

      <Card title="Update an identity document">
        {sent ? (
          <div className="space-y-4">
            <Notice>Received. An HR specialist will review it within two business days and update your record.</Notice>
            <button onClick={() => setSent(false)} className="text-[14px] text-bridge-700 hover:underline">Submit another document</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <p className="text-[14.5px] text-slate">{isSsn
              ? 'Type your Social Security number exactly as it appears on your card. No picture is needed.'
              : 'Take a clear color selfie holding the front of your driver’s license, and another holding the back, so HR can match the license to you.'}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="id-type">Document type</label>
                <select id="id-type" value={docType} onChange={(e) => { setDocType(e.target.value); setErr('') }} className="field">
                  {(d?.types || ['Driver’s license', 'Social Security number']).map((t) => <option key={t}>{t}</option>)}
                </select></div>
              {isSsn && (
                <div><label className="field-label" htmlFor="id-ssn">Social Security number</label>
                  <input id="id-ssn" value={ssn} onChange={(e) => setSsn(formatSsn(e.target.value))} inputMode="numeric" autoComplete="off" placeholder="123-45-6789" className="field tabular-nums" /></div>
              )}
            </div>
            {!isSsn && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Drop label="ID Front" hint="You holding the front of your license · JPG, PNG or PDF up to 10 MB" file={front} onFile={take(setFront)} error={!!err && !front} />
                <Drop label="ID Back" hint="You holding the back of your license · JPG, PNG or PDF up to 10 MB" file={back} onFile={take(setBack)} error={!!err && !back} />
              </div>
            )}
            {err && <p role="alert" className="text-[14px] text-red-700">{err}</p>}
            <p className="flex items-start gap-2 text-[13.5px] text-slate"><Lock size={15} className="mt-0.5 shrink-0" />Only HR staff who handle I-9 records can see what you submit. Never send identity documents by email or chat.</p>
            <button disabled={busy} className="btn-primary disabled:opacity-60">{busy ? 'Sending…' : 'Submit for review'}</button>
          </form>
        )}
      </Card>
    </div>
  )
}
