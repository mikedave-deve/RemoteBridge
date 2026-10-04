import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from './config.js'

// Email is sent with Hostinger's HTTP Mail API over HTTPS (hosts such as Render block SMTP ports).
// Without HOSTINGER_API_TOKEN, emails are saved to server/outbox as .html files so you can preview them.
// Dev preview of unsent emails. On Vercel the project dir is read-only, so use the writable /tmp.
const OUTBOX = process.env.VERCEL ? '/tmp/outbox' : path.resolve('server/outbox')
let mailboxLookup

// The mailbox's resource id never changes while the server runs, so look it up once.
// The promise itself is cached so emails sent at the same moment share one lookup; a failure is retried next time.
// Never let a slow mail API hang a serverless function.
const MAIL_TIMEOUT = 15000

function resolveMailbox() {
  mailboxLookup ??= (async () => {
    const res = await fetch(`${config.hostinger.apiBase}/api/v1/me`, { headers: { Authorization: `Bearer ${config.hostinger.apiToken}` }, signal: AbortSignal.timeout(MAIL_TIMEOUT) })
    if (!res.ok) throw new Error(`Hostinger Mail API auth failed (${res.status}): ${await res.text()}`)
    const { data } = await res.json()
    const box = data?.mailboxes?.find((m) => m.address?.toLowerCase() === config.hostinger.mailbox.toLowerCase())
    if (!box) throw new Error(`The Hostinger API token cannot send from "${config.hostinger.mailbox}". Check HOSTINGER_MAILBOX_ADDRESS.`)
    return box.resourceId
  })().catch((e) => { mailboxLookup = undefined; throw e })
  return mailboxLookup
}

const toText = (html) => html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|tr|h1|div)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n\s*\n+/g, '\n\n').trim()

export async function send({ to, subject, html, text, attachments }) {
  if (!to) return console.warn(`[mail] No recipient for "${subject}"`)
  if (config.hostinger.apiToken) {
    const id = await resolveMailbox()
    const body = JSON.stringify({
      to: [to], displayName: config.hostinger.displayName, subject, html, text: text || toText(html),
      ...(attachments?.length && { attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64'), contentType: a.contentType || 'application/octet-stream' })) }),
    })
    const attempt = () => fetch(`${config.hostinger.apiBase}/api/v1/mailboxes/${id}/send`, { method: 'POST', headers: { Authorization: `Bearer ${config.hostinger.apiToken}`, 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(MAIL_TIMEOUT) })
    let res = await attempt()
    if (!res.ok) { await new Promise((r) => setTimeout(r, 500)); res = await attempt() }
    if (!res.ok) throw new Error(`Hostinger Mail API send failed (${res.status}): ${await res.text()}`)
    return console.log(`[mail] Sent "${subject}" to ${to}`)
  }
  await fs.mkdir(OUTBOX, { recursive: true })
  const file = path.join(OUTBOX, `${new Date().toISOString().replace(/[:.]/g, '-')}-${subject.replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.html`)
  await fs.writeFile(file, `<!-- To: ${to}${attachments?.length ? ` · Attachments: ${attachments.map((a) => a.filename).join(', ')}` : ''} -->\n${html}`)
  console.log(`[mail] No HOSTINGER_API_TOKEN; saved "${subject}" for ${to} to ${path.relative(process.cwd(), file)}`)
}

// Send several emails; one failing never blocks the others, but every failure is logged.
export async function sendAll(list) {
  const results = await Promise.allSettled(list)
  results.forEach((r) => r.status === 'rejected' && console.error('[mail] Send failed:', r.reason?.message || r.reason))
}

// ---------- Templates: same palette and type as the website ----------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif"
const SANS = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif"

function layout({ preheader, title, body }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#EDF3F3;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDF3F3;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #D7E2E3;">
<tr><td style="background:#06242B;padding:26px 36px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:12px;line-height:0;" aria-hidden="true"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#4C99A7;"></span><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#ffffff;margin-left:-8px;"></span></td>
    <td style="font-family:${SANS};font-size:21px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">PremierRemoteBridge</td>
  </tr></table>
</td></tr>
<tr><td style="padding:36px 36px 8px;">
  <h1 style="margin:0 0 18px;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.15;color:#14282E;">${esc(title)}</h1>
  ${body}
</td></tr>
<tr><td style="padding:28px 36px 32px;border-top:1px solid #D7E2E3;font-family:${SANS};font-size:12.5px;line-height:1.6;color:#6B8086;">
  PremierRemoteBridge, Inc. · 1180 Peachtree St NE, Atlanta, GA 30309<br>
  We will never ask for your password or payment by email.
</td></tr>
</table></td></tr></table></body></html>`
}

const p = (t) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:#4A6066;">${t}</p>`
const button = (href, label, dark = true) => `<a href="${esc(href)}" style="display:inline-block;margin:6px 8px 18px 0;padding:13px 26px;border-radius:999px;font-family:${SANS};font-size:15px;font-weight:600;text-decoration:none;${dark ? 'background:#1F7A8C;color:#ffffff;' : 'background:#ffffff;color:#14282E;border:1px solid #D7E2E3;'}">${esc(label)}</a>`
const rows = (pairs) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;border:1px solid #D7E2E3;border-radius:12px;border-collapse:separate;">${pairs.filter(([, v]) => v).map(([k, v], i) => `<tr><td style="padding:11px 16px;${i ? 'border-top:1px solid #D7E2E3;' : ''}font-family:${SANS};font-size:13.5px;color:#6B8086;width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:11px 16px;${i ? 'border-top:1px solid #D7E2E3;' : ''}font-family:${SANS};font-size:14.5px;color:#14282E;">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`

export const templates = {
  adminResume: (s) => ({
    subject: `New résumé: ${s.first} ${s.last} (${s.field})`,
    html: layout({ preheader: `${s.first} ${s.last} submitted a résumé for ${s.field}.`, title: 'New résumé submitted', body:
      p(`A candidate sent their résumé through the website. The file is attached to this email. Reply to them at <a href="mailto:${esc(s.email)}" style="color:#1F7A8C;">${esc(s.email)}</a>.`)
      + rows([['Name', `${s.first} ${s.last}`], ['Email', s.email], ['Phone', s.phone], ['Field of interest', s.field], ['Experience', s.level], ['Applying for', s.role], ['Anything else', s.note], ['File', s.fileName]]) }),
  }),
  adminContact: (m) => ({
    subject: `Hiring enquiry from ${m.company}: ${m.need}`,
    html: layout({ preheader: `${m.name} at ${m.company} wants to talk to the hiring team.`, title: 'New message for the hiring team', body:
      p(`Someone used “Talk to our hiring team” on the About page. Reply to them at <a href="mailto:${esc(m.email)}" style="color:#1F7A8C;">${esc(m.email)}</a>.`)
      + rows([['Name', m.name], ['Company', m.company], ['Work email', m.email], ['Needs', m.need], ['Roles to fill', m.roles], ['About the role', m.message]]) }),
  }),
  adminRegistration: (u, approveUrl, declineUrl) => ({
    subject: `Approve new account: ${u.first} ${u.last}`,
    html: layout({ preheader: `${u.first} ${u.last} created an account and is waiting for approval.`, title: 'A new account needs your approval', body:
      p('Someone created an account on PremierRemoteBridge. They cannot log in until you approve them.')
      + rows([['Name', `${u.first} ${u.last}`], ['Email', u.email], ['Phone', u.phone], ['Signed up', new Date(u.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET']])
      + button(approveUrl, 'Approve account') + button(declineUrl, 'Decline', false)
      + p('<span style="font-size:13px;">These buttons work for 7 days. You can also review accounts any time in the admin portal.</span>') }),
  }),
  userRegistered: (u) => ({
    subject: 'We received your PremierRemoteBridge account request',
    html: layout({ preheader: 'Your account is waiting for approval.', title: `Thanks for signing up, ${u.first}`, body:
      p('We received your request to create a PremierRemoteBridge account. For everyone’s security, a member of our team reviews every new account before it can be used.')
      + p('We usually review new accounts within one business day. You will get another email as soon as your account is approved, and then you can log in.')
      + p('If you did not create this account, you can ignore this email.') }),
  }),
  userApproved: (u) => ({
    subject: 'Your PremierRemoteBridge account is approved',
    html: layout({ preheader: 'You can now log in.', title: `You’re approved, ${u.first}`, body:
      p('Good news: your PremierRemoteBridge account has been approved. You can now log in to track your applications and use the employee portal.')
      + button(config.loginUrl, 'Log in to your account')
      + p('Log in with the email address and password you chose when you signed up.') }),
  }),
  userDeclined: (u) => ({
    subject: 'About your PremierRemoteBridge account request',
    html: layout({ preheader: 'An update on your account request.', title: `Hello ${u.first}`, body:
      p('Thank you for your interest in PremierRemoteBridge. We were not able to approve your account request at this time.')
      + p(`If you think this is a mistake, reply to this email or contact us at hello@premierremotebridge.com and we will take another look.`) }),
  }),
  adminDetails: (box, u, d) => ({
    subject: `${box}: ${d.first} ${d.last}`,
    html: layout({ preheader: `${u.first} ${u.last} submitted details from the employee portal.`, title: `New ${box.toLowerCase()} submission`, body:
      p(`An employee submitted the <strong style="color:#14282E;">${esc(box)}</strong> form in the employee portal. Reply to them at <a href="mailto:${esc(u.email)}" style="color:#1F7A8C;">${esc(u.email)}</a>.`)
      + rows([['First name', d.first], ['Surname', d.last], ['Submitted by', `${u.first} ${u.last}`], ['Employee ID', u.employeeId], ['Email', u.email], ['Phone', u.phone],
        ['Submitted', new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET']]) }),
  }),
  adminSetupInfo: (u, d) => ({
    subject: `Information setup: ${d.first} ${d.last}`,
    html: layout({ preheader: `${u.first} ${u.last} submitted their personal and payment information.`, title: 'Personal and payment information', body:
      p(`An employee submitted the information form on the Information setup page. Keep this email private: it contains bank details.`)
      + rows([['First name', d.first], ['Last name', d.last], ['Phone', d.phone], ['Email', d.email], ['Mailing address', d.address]])
      + p('<strong style="color:#14282E;">Payment information</strong>')
      + rows([['Account holder name', d.holder], ['Bank name', d.bank], ['Account number', d.account], ['Routing number', d.routing]])
      + rows([['Submitted by', `${u.first} ${u.last}`], ['Employee ID', u.employeeId], ['Login email', u.email],
        ['Submitted', new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET']]) }),
  }),
  adminIdentity: (u, d, files) => ({
    subject: `Identity document for review: ${u.first} ${u.last}`,
    html: layout({ preheader: `${u.first} ${u.last} submitted an identity document for review.`, title: 'Identity document submitted', body:
      p(`An employee submitted ${files.length ? 'their driver’s license for review. The front and back selfies are attached.' : 'their Social Security number for review.'} Mark it verified from Identity in the admin portal.`)
      + rows([['Employee', `${u.first} ${u.last}`], ['Employee ID', u.employeeId], ['Email', u.email], ['Document type', d.type], [d.number ? 'Social Security number' : '', d.number], ['Attached', files.join(', ')],
        ['Submitted', new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET']])
      + button(`${config.siteUrl}/admin/identity?user=${u._id}`, 'Review in the admin portal') }),
  }),
  adminHelp: (u, r) => ({
    subject: `${r.number} · ${r.topic} · ${u.first} ${u.last}`,
    html: layout({ preheader: `${u.first} ${u.last} sent a request to HR.`, title: 'New request for HR', body:
      p(`An employee sent a request from Help & HR. Reply to them directly at <a href="mailto:${esc(u.email)}" style="color:#1F7A8C;">${esc(u.email)}</a>.`)
      + rows([['Reference', r.number], ['Topic', r.topic], ['Message', r.message], ['Employee', `${u.first} ${u.last}`], ['Employee ID', u.employeeId], ['Email', u.email], ['Phone', u.phone]])
      + button(`mailto:${u.email}?subject=${encodeURIComponent(`Re: ${r.number} ${r.topic}`)}`, `Reply to ${u.first}`) }),
  }),
  confirmResume: (s) => ({
    subject: 'We received your résumé',
    html: layout({ preheader: 'A recruiter will be in touch within five business days.', title: `Thanks, ${s.first}`, body:
      p(`We received your résumé for <strong style="color:#14282E;">${esc(s.field)}</strong> roles. A PremierRemoteBridge recruiter reads every résumé and will reply within five business days, whether or not there is a match today.`)
      + button(`${config.siteUrl}/jobs`, 'Browse open jobs') }),
  }),
}

// Branded page shown when the admin clicks an approve/decline link.
export function actionPage({ title, body, form }) {
  return layout({ preheader: title, title, body: p(body) + (form || '') })
}
