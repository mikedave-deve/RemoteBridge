// Demo data for the employee portal. One W-2 employee, paid biweekly through RemoteBridge.
export const employee = {
  id: 'RB-204871',
  first: 'Andre', last: 'Williams', preferred: 'Andre',
  title: 'Bookkeeper', department: 'Finance & Accounting',
  client: 'Westbrook & Hale CPAs', manager: 'Laura Bennett', recruiter: 'Samuel Adams',
  email: 'andre.williams@email.com', workEmail: 'a.williams@remotebridge.com', phone: '(614) 555-0148',
  address: ['2241 Northwest Blvd', 'Columbus, OH 43221'],
  ssnLast4: '4821', dob: 'May 14, 1990',
  startDate: 'March 10, 2025', type: 'Full-time, non-exempt (hourly)', rate: 27, payFrequency: 'Biweekly (every other Friday)',
  workState: 'Ohio', workCity: 'Columbus', timezone: 'Eastern',
  photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=240&h=240&q=78',
}

export const emergencyContacts = [
  { name: 'Monique Williams', relation: 'Sister', phone: '(614) 555-0192' },
  { name: 'Gerald Williams', relation: 'Father', phone: '(937) 555-0117' },
]

export const bankAccounts = [
  { bank: 'Huntington-area Credit Union', type: 'Checking', last4: '7730', routingLast4: '0438', split: 'Remainder of net pay', primary: true },
  { bank: 'Online Savings', type: 'Savings', last4: '2216', routingLast4: '1170', split: '$150.00 per paycheck', primary: false },
]

// Withholding elections (Form W-4, 2020+ version; Ohio IT 4; municipal).
export const w4 = { filingStatus: 'Single or married filing separately', multipleJobs: false, dependents: 0, otherIncome: 0, deductions: 0, extra: 0, updated: 'January 6, 2026' }
export const stateW4 = { form: 'Ohio IT 4', exemptions: 1, extra: 0, updated: 'March 10, 2025' }

const BENEFITS = { medical: 86.4, dental: 9.2, vision: 3.1 }
const K401 = 0.06
const MATCH = 0.04
const r2 = (n) => Math.round(n * 100) / 100

// 2026 federal brackets, single filer, annualized percentage method (approximate).
const fedAnnual = (taxable) => {
  const t = Math.max(0, taxable - 16100) // 2026 standard deduction, single
  const b = [[12400, 0.1], [50400, 0.12], [105700, 0.22]]
  let tax = 0, prev = 0
  for (const [cap, rate] of b) { if (t > prev) tax += (Math.min(t, cap) - prev) * rate; prev = cap }
  return Math.max(0, tax - w4.dependents)
}
const ohioAnnual = (taxable) => Math.max(0, taxable - 26050 - stateW4.exemptions * 650) * 0.0275

// Pay dates: every other Friday from Jan 9, 2026 up to today (Oct 2, 2026).
const first = new Date(2026, 0, 9)
const overtime = { 3: 4, 6: 6, 11: 3, 16: 5, 19: 2 } // pay period index -> OT hours
const holidays = { 0: 8, 1: 8, 3: 8, 10: 8, 13: 8, 17: 8 } // holiday hours paid in the period

export const payStubs = Array.from({ length: 20 }, (_, i) => {
  const pay = new Date(first); pay.setDate(first.getDate() + i * 14)
  const end = new Date(pay); end.setDate(pay.getDate() - 6)
  const start = new Date(end); start.setDate(end.getDate() - 13)
  const hol = holidays[i] || 0
  const ot = overtime[i] || 0
  const pto = i === 8 ? 16 : i === 14 ? 24 : 0
  const reg = 80 - hol - pto
  const earnings = [
    { label: 'Regular', hours: reg, rate: employee.rate, amount: r2(reg * employee.rate) },
    ot && { label: 'Overtime (1.5×)', hours: ot, rate: employee.rate * 1.5, amount: r2(ot * employee.rate * 1.5) },
    hol && { label: 'Holiday', hours: hol, rate: employee.rate, amount: r2(hol * employee.rate) },
    pto && { label: 'Paid time off', hours: pto, rate: employee.rate, amount: r2(pto * employee.rate) },
  ].filter(Boolean)
  const gross = r2(earnings.reduce((s, e) => s + e.amount, 0))
  const sec125 = BENEFITS.medical + BENEFITS.dental + BENEFITS.vision
  const k401 = r2(gross * K401)
  const fedTaxable = gross - sec125 - k401
  const ficaWages = gross - sec125
  const taxes = [
    { label: 'Federal income tax', amount: r2(fedAnnual(fedTaxable * 26) / 26), group: 'federal' },
    { label: 'Social Security (6.2%)', amount: r2(ficaWages * 0.062), group: 'fica' },
    { label: 'Medicare (1.45%)', amount: r2(ficaWages * 0.0145), group: 'fica' },
    { label: 'Ohio state income tax', amount: r2(ohioAnnual(fedTaxable * 26) / 26), group: 'state' },
    { label: 'Columbus city tax (2.5%)', amount: r2(ficaWages * 0.025), group: 'state' },
  ]
  const deductions = [
    { label: '401(k) traditional (6%)', amount: k401, pretax: true },
    { label: 'Medical (PPO 1500)', amount: BENEFITS.medical, pretax: true },
    { label: 'Dental', amount: BENEFITS.dental, pretax: true },
    { label: 'Vision', amount: BENEFITS.vision, pretax: true },
  ]
  const totalTax = r2(taxes.reduce((s, t) => s + t.amount, 0))
  const totalDed = r2(deductions.reduce((s, d) => s + d.amount, 0))
  return {
    id: `PS-2026-${String(i + 1).padStart(2, '0')}`, payDate: pay, start, end, earnings, gross, taxes, deductions,
    totalTax, totalDed, net: r2(gross - totalTax - totalDed), match: r2(gross * MATCH), hours: 80 + ot,
  }
}).reverse() // newest first

export const ytd = (() => {
  const sum = (f) => r2(payStubs.reduce((s, p) => s + f(p), 0))
  return {
    gross: sum((p) => p.gross), net: sum((p) => p.net), tax: sum((p) => p.totalTax), ded: sum((p) => p.totalDed),
    k401: sum((p) => p.deductions[0].amount), match: sum((p) => p.match),
    byLabel: (label) => sum((p) => [...p.taxes, ...p.deductions, ...p.earnings].find((x) => x.label === label)?.amount || 0),
  }
})()

export const nextPay = { date: new Date(2026, 9, 16), periodStart: new Date(2026, 8, 20), periodEnd: new Date(2026, 9, 3), estimate: payStubs[0].net }

export const w2s = [
  { year: 2025, employer: 'RemoteBridge, Inc.', ein: '**-***4410', box1: 41982.17, box2: 2201.4, box3: 45108.4, box4: 2796.72, box5: 45108.4, box6: 654.07, box12d: 2836.92, box16: 41982.17, box17: 389.66, box18: 45108.4, box19: 1127.71, issued: 'January 27, 2026' },
]

export const timeOff = {
  policy: 'PTO accrues at 4.62 hours per pay period (120 hours a year). Unused PTO up to 40 hours carries over to next year.',
  balances: [
    { type: 'Paid time off', available: 54.6, accrued: 92.4, used: 40, scheduled: 16, unit: 'hours' },
    { type: 'Sick leave', available: 32, accrued: 40, used: 8, scheduled: 0, unit: 'hours' },
    { type: 'Floating holiday', available: 8, accrued: 8, used: 0, scheduled: 0, unit: 'hours' },
  ],
  requests: [
    { id: 'TO-1094', type: 'Paid time off', dates: 'Nov 27, 2026', hours: 8, status: 'Approved', submitted: 'Sep 14, 2026' },
    { id: 'TO-1101', type: 'Paid time off', dates: 'Dec 28 – Dec 29, 2026', hours: 16, status: 'Pending', submitted: 'Sep 29, 2026' },
    { id: 'TO-1062', type: 'Paid time off', dates: 'Jul 6 – Jul 8, 2026', hours: 24, status: 'Taken', submitted: 'May 20, 2026' },
    { id: 'TO-1031', type: 'Sick leave', dates: 'Apr 14, 2026', hours: 8, status: 'Taken', submitted: 'Apr 14, 2026' },
    { id: 'TO-1017', type: 'Paid time off', dates: 'Apr 23 – Apr 24, 2026', hours: 16, status: 'Taken', submitted: 'Mar 30, 2026' },
  ],
  holidays: [
    ['Jan 1', "New Year's Day"], ['Jan 19', 'Martin Luther King Jr. Day'], ['Feb 16', "Presidents' Day"], ['May 25', 'Memorial Day'],
    ['Jun 19', 'Juneteenth'], ['Jul 3', 'Independence Day (observed)'], ['Sep 7', 'Labor Day'], ['Nov 11', 'Veterans Day'],
    ['Nov 26', 'Thanksgiving Day'], ['Dec 25', 'Christmas Day'],
  ],
}

// Current week timesheet (week of Sep 28 – Oct 4, 2026). Times are Eastern.
export const timesheet = {
  week: 'Sep 28 – Oct 4, 2026', period: 'Pay period Sep 20 – Oct 3, 2026', status: 'Open', approver: 'Laura Bennett',
  days: [
    { day: 'Mon', date: 'Sep 28', in: '8:58 AM', lunch: '30 min', out: '5:31 PM', hours: 8.05 },
    { day: 'Tue', date: 'Sep 29', in: '8:52 AM', lunch: '30 min', out: '5:40 PM', hours: 8.3 },
    { day: 'Wed', date: 'Sep 30', in: '9:01 AM', lunch: '45 min', out: '6:02 PM', hours: 8.27 },
    { day: 'Thu', date: 'Oct 1', in: '8:55 AM', lunch: '30 min', out: '5:28 PM', hours: 8.05 },
    { day: 'Fri', date: 'Oct 2', in: '8:57 AM', lunch: null, out: null, hours: null },
    { day: 'Sat', date: 'Oct 3', in: null, lunch: null, out: null, hours: null },
    { day: 'Sun', date: 'Oct 4', in: null, lunch: null, out: null, hours: null },
  ],
  previous: [
    { week: 'Sep 21 – Sep 27, 2026', hours: 40.0, overtime: 0, status: 'Approved' },
    { week: 'Sep 14 – Sep 20, 2026', hours: 41.5, overtime: 1.5, status: 'Approved' },
    { week: 'Sep 7 – Sep 13, 2026', hours: 40.0, overtime: 0, status: 'Approved', note: 'Includes 8 h Labor Day' },
    { week: 'Aug 31 – Sep 6, 2026', hours: 40.5, overtime: 0.5, status: 'Approved' },
  ],
}

export const benefits = {
  enrollmentWindow: 'Open enrollment for 2027 runs November 2 – November 20, 2026.',
  plans: [
    { name: 'Medical', plan: 'PPO 1500', tier: 'Employee only', perCheck: BENEFITS.medical, employer: 412.3, details: ['$1,500 individual deductible', '$25 primary-care copay', '$4,500 out-of-pocket maximum'], id: 'MED-88214093' },
    { name: 'Dental', plan: 'Dental PPO', tier: 'Employee only', perCheck: BENEFITS.dental, employer: 18.4, details: ['Preventive care covered at 100%', '$1,500 annual maximum'], id: 'DEN-55107' },
    { name: 'Vision', plan: 'Vision Plus', tier: 'Employee only', perCheck: BENEFITS.vision, employer: 4.1, details: ['$10 eye exam copay', '$150 frame allowance every 12 months'], id: 'VIS-30912' },
    { name: 'Basic life & AD&D', plan: '1× annual salary', tier: 'Employee', perCheck: 0, employer: 6.2, details: ['$56,000 coverage, employer paid'], id: 'LIF-10442' },
    { name: 'Short- & long-term disability', plan: '60% income replacement', tier: 'Employee', perCheck: 0, employer: 11.8, details: ['STD after 7 days, LTD after 90 days', 'Employer paid'], id: 'DIS-20981' },
    { name: 'Employee Assistance Program', plan: 'Confidential support 24/7', tier: 'Household', perCheck: 0, employer: 2.1, details: ['6 free counseling sessions per issue', 'Legal and financial consultations'], id: 'EAP-0091' },
  ],
  retirement: { plan: 'RemoteBridge 401(k) Plan', contribution: 6, type: 'Traditional (pre-tax)', match: 'Dollar-for-dollar up to 4% of pay', vesting: 'Immediately 100% vested in your contributions; employer match vests over 3 years', balance: 7418.36, limit: 24500 },
  beneficiaries: [
    { name: 'Monique Williams', relation: 'Sister', share: 100, type: 'Primary' },
    { name: 'Gerald Williams', relation: 'Father', share: 100, type: 'Contingent' },
  ],
}

export const documents = [
  { name: 'Offer letter', category: 'Employment', date: 'Feb 26, 2025', status: 'Signed' },
  { name: 'Employment agreement', category: 'Employment', date: 'Mar 3, 2025', status: 'Signed' },
  { name: 'Form I-9, Employment Eligibility Verification', category: 'Employment', date: 'Mar 10, 2025', status: 'Verified (E-Verify case closed)' },
  { name: 'Employee handbook 2026', category: 'Policies', date: 'Jan 5, 2026', status: 'Acknowledged' },
  { name: 'Remote work and equipment policy', category: 'Policies', date: 'Jan 5, 2026', status: 'Acknowledged' },
  { name: 'Information security policy', category: 'Policies', date: 'Jan 5, 2026', status: 'Action required' },
  { name: 'Form W-4 (2026)', category: 'Tax', date: 'Jan 6, 2026', status: 'On file' },
  { name: 'Ohio IT 4', category: 'Tax', date: 'Mar 10, 2025', status: 'On file' },
  { name: 'Direct deposit authorization', category: 'Payroll', date: 'Mar 10, 2025', status: 'On file' },
  { name: '2026 benefits confirmation', category: 'Benefits', date: 'Dec 2, 2025', status: 'On file' },
  { name: 'Equipment receipt (laptop, headset, monitor)', category: 'Employment', date: 'Mar 7, 2025', status: 'Signed' },
]

export const training = [
  { name: 'Workplace harassment prevention', due: 'Completed Feb 3, 2026', status: 'Complete' },
  { name: 'Data privacy and information security', due: 'Due Oct 31, 2026', status: 'In progress', progress: 60 },
  { name: 'Anti-fraud and ethics for finance staff', due: 'Due Dec 15, 2026', status: 'Not started', progress: 0 },
]

// Required workplace notices, provided electronically for remote employees.
export const notices = [
  'Fair Labor Standards Act (FLSA) – minimum wage and overtime',
  'Know Your Rights: Workplace Discrimination is Illegal (EEOC)',
  'Family and Medical Leave Act (FMLA)',
  'Employee Polygraph Protection Act',
  'Uniformed Services Employment and Reemployment Rights Act (USERRA)',
  'Job Safety and Health: It’s the Law (OSHA)',
  'Ohio minimum wage and workers’ compensation notices',
]

export const announcements = [
  { date: 'Sep 30, 2026', title: 'Open enrollment opens November 2', body: 'Review your 2027 medical, dental and vision choices. Plans and rates will be posted in Benefits on October 26.' },
  { date: 'Sep 22, 2026', title: 'Complete your security training by October 31', body: 'The annual data privacy course takes about 40 minutes and is required for all finance staff.' },
  { date: 'Sep 8, 2026', title: 'Holiday schedule for the rest of 2026', body: 'Veterans Day, Thanksgiving and Christmas Day are paid holidays. Your floating holiday expires December 31.' },
]

export const tasks = [
  { label: 'Acknowledge the information security policy', to: '/portal/documents', urgent: true },
  { label: 'Submit this week’s timesheet by Saturday', to: '/portal/time', urgent: true },
  { label: 'Finish data privacy training (60% done)', to: '/portal/documents', urgent: false },
  { label: 'Review your 401(k) contribution before year end', to: '/portal/benefits', urgent: false },
]

export const signIns = [
  { when: 'Today, 8:51 AM', device: 'Chrome on Windows', location: 'Columbus, OH', current: true },
  { when: 'Oct 1, 8:49 AM', device: 'Chrome on Windows', location: 'Columbus, OH' },
  { when: 'Sep 30, 7:12 PM', device: 'Safari on iPhone', location: 'Columbus, OH' },
]

export const usd = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
export const fmtDate = (d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => d.toLocaleDateString('en-US', opts)
