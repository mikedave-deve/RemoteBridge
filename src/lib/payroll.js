// US payroll rules for 2026, shared by the server (which saves the numbers) and the admin form (live preview).
// Sources: IRS Rev. Proc. 2025-32 (brackets, standard deduction), IRS Notice 2025-67 (401(k) limits),
// SSA 2026 COLA fact sheet (Social Security wage base).

export const LIMITS = {
  year: 2026,
  k401: 24500, // employee elective deferral limit
  catchUp: { none: 0, '50+': 8000, '60-63': 11250 }, // SECURE 2.0 catch-up amounts
  ssWageBase: 184500,
  ssRate: 0.062,
  medicareRate: 0.0145,
  addlMedicareRate: 0.009, // employee only, on wages over $200,000 in the year
  addlMedicareOver: 200000,
}

// Benefit rules HR presets are built on (2026 plan year).
export const RULES = {
  // ACA: self-only coverage is "affordable" if the employee pays at most 9.96% of income (IRS Rev. Proc. 2025-25).
  // The rate-of-pay safe harbor uses hourly rate × 130 hours a month as income.
  acaAffordability: 0.0996,
  acaHoursPerMonth: 130,
  // SECURE 2.0: new 401(k) plans auto-enroll employees at 3% to 10% of pay.
  autoEnrollMin: 3,
  autoEnrollMax: 10,
  // Safe-harbor 401(k) match (IRS): enhanced formula is 100% of deferrals up to 4% of pay.
  safeHarborMatch: 4,
}
/** Highest employee medical premium per paycheck that keeps self-only coverage ACA-affordable for this hourly rate. */
export const acaMaxPerCheck = (hourlyRate, frequency = 'Biweekly') =>
  hourlyRate > 0 ? r2((hourlyRate * RULES.acaHoursPerMonth * RULES.acaAffordability * 12) / (PERIODS[frequency] || 26)) : null
/** Catch-up group from a date of birth: age reached by the end of the plan year. */
export const catchUpFor = (dob, year = LIMITS.year) => {
  if (!dob) return null
  const age = year - Number(String(dob).slice(0, 4))
  return age >= 60 && age <= 63 ? '60-63' : age >= 50 ? '50+' : 'none'
}

export const PERIODS ={ Weekly: 52, Biweekly: 26, 'Semi-monthly': 24, Monthly: 12 }
export const FREQUENCIES = Object.keys(PERIODS)

export const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100
export const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : 0 }
export const k401Limit = (catchUp = 'none') => LIMITS.k401 + (LIMITS.catchUp[catchUp] || 0)

// 2026 annual brackets: [upper bound, rate]. Married filing jointly and head of household thresholds per Rev. Proc. 2025-32.
const BRACKETS = {
  single: { std: 16100, b: [[12400, 0.1], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]] },
  married: { std: 32200, b: [[24800, 0.1], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]] },
  head: { std: 24150, b: [[17700, 0.1], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]] },
}
const statusKey = (s = '') => (/jointly/i.test(s) ? 'married' : /head/i.test(s) ? 'head' : 'single')

/** Federal income tax for one paycheck, annualized percentage method from the employee's W-4. */
export function estimateFederal(taxableWages, w4 = {}, frequency = 'Biweekly') {
  const n = PERIODS[frequency] || 26
  const { std, b } = BRACKETS[statusKey(w4.filingStatus)]
  // Step 2 checkbox: the IRS "higher withholding" schedule is roughly half the brackets and deduction.
  const half = w4.multipleJobs ? 0.5 : 1
  let t = Math.max(0, taxableWages * n - std * half)
  let tax = 0, prev = 0
  for (const [cap, rate] of b) {
    const c = cap * half
    if (t > prev) tax += (Math.min(t, c) - prev) * rate
    prev = c
  }
  tax = Math.max(0, tax - num(w4.dependents))
  return r2(tax / n + num(w4.extra))
}

/**
 * Builds a full pay stub.
 * input: { earnings: [{ label, hours?, rate?, amount? }], taxes: [{ label, amount }], otherDeductions: [{ label, amount, pretax }] }
 * benefits: { plans: [{ name, perCheck }], k401: { enrolled, pct, matchPct, catchUp, roth } }
 * ytd: totals already paid this year before this stub: { ssWages, medicareWages, k401 }
 */
export function buildStub(input, benefits = {}, ytd = {}) {
  const earnings = (input.earnings || []).filter((e) => e && e.label).map((e) => {
    const hours = e.hours === '' || e.hours == null ? undefined : num(e.hours)
    const rate = e.rate === '' || e.rate == null ? undefined : num(e.rate)
    const amount = hours !== undefined && rate !== undefined ? r2(hours * rate) : r2(num(e.amount))
    return { label: String(e.label), ...(hours !== undefined && rate !== undefined && { hours, rate }), amount }
  }).filter((e) => e.amount)
  const gross = r2(earnings.reduce((s, e) => s + e.amount, 0))

  // Section 125 (cafeteria plan) premiums come out before every tax.
  const plans = (benefits.plans || []).filter((p) => num(p.perCheck) > 0)
  const sec125 = r2(plans.reduce((s, p) => s + num(p.perCheck), 0))
  const k = benefits.k401 || {}
  let k401 = 0
  if (k.enrolled && num(k.pct) > 0) {
    const room = Math.max(0, k401Limit(k.catchUp) - num(ytd.k401))
    k401 = r2(Math.min(gross * num(k.pct) / 100, room, Math.max(0, gross - sec125)))
  }
  const others = (input.otherDeductions || []).filter((d) => d && d.label && num(d.amount)).map((d) => ({ label: String(d.label), amount: r2(num(d.amount)), pretax: !!d.pretax }))
  const pretaxOther = r2(others.filter((d) => d.pretax).reduce((s, d) => s + d.amount, 0))

  const ficaWages = Math.max(0, gross - sec125)
  const ss = r2(Math.min(ficaWages, Math.max(0, LIMITS.ssWageBase - num(ytd.ssWages))) * LIMITS.ssRate)
  const medYtd = num(ytd.medicareWages)
  const addl = Math.max(0, medYtd + ficaWages - Math.max(LIMITS.addlMedicareOver, medYtd))
  const medicare = r2(ficaWages * LIMITS.medicareRate + addl * LIMITS.addlMedicareRate)
  const incomeTaxable = r2(Math.max(0, gross - sec125 - (k.roth ? 0 : k401) - pretaxOther))

  const taxes = [
    ...(input.taxes || []).filter((t) => t && t.label && num(t.amount)).map((t) => ({ label: String(t.label), amount: r2(num(t.amount)) })),
    { label: 'Social Security (6.2%)', amount: ss },
    { label: 'Medicare (1.45%)', amount: medicare },
  ].filter((t) => t.amount)
  const deductions = [
    ...(k401 ? [{ label: `401(k) ${k.roth ? 'Roth' : 'traditional'} (${num(k.pct)}%)`, amount: k401, pretax: !k.roth }] : []),
    ...plans.map((p) => ({ label: p.label || p.name, amount: r2(num(p.perCheck)), pretax: true })),
    ...others,
  ]
  const totalTax = r2(taxes.reduce((s, t) => s + t.amount, 0))
  const totalDed = r2(deductions.reduce((s, d) => s + d.amount, 0))
  // Employer match: dollar for dollar on what the employee defers, up to the plan's match percent of pay.
  const match = k401 ? r2(Math.min(k401, gross * num(k.matchPct) / 100)) : 0
  return {
    earnings, gross, taxes, deductions, totalTax, totalDed, net: r2(gross - totalTax - totalDed), match,
    k401, sec125, ficaWages: r2(ficaWages), incomeTaxable,
    hours: r2(earnings.reduce((s, e) => s + (e.hours || 0), 0)),
  }
}
