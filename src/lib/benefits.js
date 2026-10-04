// The benefit plans PremierRemoteBridge offers. Every employee sees them; HR enrolls people from the admin portal.
// perCheck / employer are the default costs per paycheck, which HR can change per employee when enrolling.
export const PLANS = [
  { name: 'Medical', plan: 'PPO 1500', tiers: ['Employee only', 'Employee + spouse', 'Employee + children', 'Family'], perCheck: 86.4, employer: 412.3, prefix: 'MED', details: ['$1,500 individual deductible', '$25 primary-care copay', '$4,500 out-of-pocket maximum'] },
  { name: 'Dental', plan: 'Dental PPO', tiers: ['Employee only', 'Employee + spouse', 'Employee + children', 'Family'], perCheck: 9.2, employer: 18.4, prefix: 'DEN', details: ['Preventive care covered at 100%', '$1,500 annual maximum'] },
  { name: 'Vision', plan: 'Vision Plus', tiers: ['Employee only', 'Employee + spouse', 'Employee + children', 'Family'], perCheck: 3.1, employer: 4.1, prefix: 'VIS', details: ['$10 eye exam copay', '$150 frame allowance every 12 months'] },
  { name: 'Basic life & AD&D', plan: '1× annual salary', tiers: ['Employee'], perCheck: 0, employer: 6.2, prefix: 'LIF', details: ['Coverage equal to one year of pay, employer paid'] },
  { name: 'Short- & long-term disability', plan: '60% income replacement', tiers: ['Employee'], perCheck: 0, employer: 11.8, prefix: 'DIS', details: ['STD after 7 days, LTD after 90 days', 'Employer paid'] },
  { name: 'Employee Assistance Program', plan: 'Confidential support 24/7', tiers: ['Household'], perCheck: 0, employer: 2.1, prefix: 'EAP', details: ['6 free counseling sessions per issue', 'Legal and financial consultations'] },
]

export const RETIREMENT = {
  plan: 'PremierRemoteBridge 401(k) Plan',
  vesting: 'Immediately 100% vested in your contributions; employer match vests over 3 years',
  maxPct: 50,
}

export const BALANCE_TYPES = ['Paid time off', 'Sick leave', 'Floating holiday']
