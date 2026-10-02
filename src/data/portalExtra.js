// Demo data for the newer portal sections. Same employee as data/portal.js.

// Work assignments from the client, with step-by-step instructions.
export const missions = [
  {
    id: 'M-3108', title: 'September month-end close', client: 'Westbrook & Hale CPAs', owner: 'Laura Bennett',
    due: 'Oct 7, 2026', priority: 'High', status: 'In progress',
    summary: 'Close the September books for the three small-business clients assigned to you and hand off to the reviewing CPA.',
    steps: [
      { text: 'Reconcile all bank and credit card accounts through Sep 30', done: true },
      { text: 'Post recurring journal entries (rent, depreciation, payroll accruals)', done: true },
      { text: 'Review uncategorized transactions and clear the suspense account', done: false },
      { text: 'Run the AR and AP aging reports and flag items over 60 days', done: false },
      { text: 'Export the close checklist and send it to Laura for review', done: false },
    ],
    instructions: [
      'Work in QuickBooks Online only; do not download client files to your computer.',
      'Use the close checklist template in the shared “Month-end” folder and save a copy per client.',
      'Questions about a specific transaction go in the client’s Teams channel, not by email.',
    ],
  },
  {
    id: 'M-3114', title: 'Vendor W-9 collection for 1099 season', client: 'Westbrook & Hale CPAs', owner: 'Laura Bennett',
    due: 'Oct 30, 2026', priority: 'Medium', status: 'Not started',
    summary: 'Make sure every vendor paid $600 or more this year has a current W-9 on file before January 1099 filing.',
    steps: [
      { text: 'Run the 1099 vendor report for each client', done: false },
      { text: 'Email vendors missing a W-9 using the approved template', done: false },
      { text: 'Upload received W-9s to the secure vendor folder', done: false },
      { text: 'Update the tracker and report gaps on Oct 30', done: false },
    ],
    instructions: [
      'Never ask vendors to send W-9s by plain email. Share the secure upload link from the template.',
      'Mark any vendor that refuses as “backup withholding required” and tell Laura the same day.',
    ],
  },
  {
    id: 'M-3077', title: 'QuickBooks Online Advanced certification', client: 'PremierRemoteBridge', owner: 'Samuel Adams',
    due: 'Completed Aug 28, 2026', priority: 'Low', status: 'Completed',
    summary: 'Complete the ProAdvisor Advanced course. The exam fee is reimbursed by PremierRemoteBridge.',
    steps: [
      { text: 'Finish the training modules', done: true },
      { text: 'Pass the certification exam', done: true },
      { text: 'Upload the certificate to Documents', done: true },
    ],
    instructions: ['Submit the exam receipt under Company services → Reimbursements.'],
  },
]

export const workRules = [
  ['Working hours', 'Monday to Friday, 9:00 AM – 5:30 PM Eastern, with a 30-minute unpaid meal break. Log every hour you work in Timesheet.'],
  ['Communication', 'Stay reachable on Microsoft Teams during working hours. Reply to your manager within one hour; to clients within one business day.'],
  ['Data security', 'Use only your company laptop for client work, keep the VPN on, and never store client data on personal devices or cloud accounts.'],
  ['Overtime', 'Get approval from Laura Bennett before working more than 40 hours in a week. All overtime you work is paid.'],
]

// Account and work activity, newest first.
export const activity = [
  { when: 'Oct 2, 2026 · 8:57 AM', type: 'Time', text: 'Clocked in', meta: 'Chrome on Windows · Columbus, OH' },
  { when: 'Oct 2, 2026 · 6:00 AM', type: 'Pay', text: 'Paycheck deposited: $1,606.33', meta: 'Checking ••••7730 and Savings ••••2216' },
  { when: 'Oct 1, 2026 · 8:49 AM', type: 'Security', text: 'Signed in', meta: 'Chrome on Windows · Columbus, OH' },
  { when: 'Sep 30, 2026 · 7:12 PM', type: 'Security', text: 'Signed in from a new device; verified with a text code', meta: 'Safari on iPhone · Columbus, OH' },
  { when: 'Sep 29, 2026 · 4:41 PM', type: 'Time off', text: 'Requested 16 hours of PTO for Dec 28 – Dec 29', meta: 'Pending approval' },
  { when: 'Sep 28, 2026 · 5:35 PM', type: 'Missions', text: 'Completed “Post recurring journal entries” in M-3108', meta: 'September month-end close' },
  { when: 'Sep 26, 2026 · 5:32 PM', type: 'Time', text: 'Submitted timesheet for Sep 21 – Sep 27 (40.0 h)', meta: 'Approved by Laura Bennett on Sep 28' },
  { when: 'Sep 18, 2026 · 6:00 AM', type: 'Pay', text: 'Paycheck deposited: $1,549.64', meta: 'Checking ••••7730 and Savings ••••2216' },
  { when: 'Sep 14, 2026 · 11:02 AM', type: 'Time off', text: 'PTO request for Nov 27 approved', meta: 'Approved by Laura Bennett' },
  { when: 'Sep 2, 2026 · 2:15 PM', type: 'Equipment', text: 'Replacement headset delivered', meta: 'Tracking 1Z84F7120396441182' },
  { when: 'Aug 28, 2026 · 3:20 PM', type: 'Documents', text: 'Uploaded QuickBooks Online Advanced certificate', meta: 'Documents → Training' },
  { when: 'Aug 2, 2026 · 9:44 AM', type: 'Security', text: 'Password changed', meta: 'Confirmation sent to andre.williams@email.com' },
  { when: 'Jul 21, 2026 · 10:30 AM', type: 'Profile', text: 'Updated emergency contact', meta: 'Monique Williams' },
  { when: 'Jan 6, 2026 · 9:12 AM', type: 'Documents', text: 'Signed Form W-4 (2026)', meta: 'Tax forms' },
]

// Account setup checklist, used when a new hire first signs in.
export const setupSteps = [
  { key: 'personal', title: 'Personal information', desc: 'Legal name, preferred name, date of birth and contact details.', done: true, to: '/portal/profile' },
  { key: 'address', title: 'Home address', desc: 'Determines the state and local taxes we withhold.', done: true, to: '/portal/profile' },
  { key: 'identity', title: 'Identity verification', desc: 'Form I-9 documents and E-Verify.', done: true, to: '/portal/identity' },
  { key: 'tax', title: 'Tax withholding', desc: 'Federal W-4 and Ohio IT 4.', done: true, to: '/portal/taxes' },
  { key: 'deposit', title: 'Direct deposit', desc: 'Where your paychecks are sent.', done: true, to: '/portal/pay' },
  { key: 'emergency', title: 'Emergency contacts', desc: 'Who we call if something happens during work hours.', done: true, to: '/portal/profile' },
  { key: 'benefits', title: 'Benefits enrollment', desc: 'Medical, dental, vision and 401(k) elections.', done: true, to: '/portal/benefits' },
  { key: 'policies', title: 'Policy acknowledgements', desc: 'Handbook, remote work and information security policies.', done: false, to: '/portal/documents' },
  { key: 'workspace', title: 'Home workspace check', desc: 'Confirm a private workspace and internet speed of at least 25 Mbps.', done: false, to: null },
]

export const preferences = {
  language: 'English', timezone: 'Eastern Time (ET)', payslipNotice: true, smsAlerts: true, weeklyDigest: false,
}

// Form I-9, E-Verify and screening status.
export const identity = {
  i9: { section1: 'Completed Mar 3, 2025', section2: 'Verified remotely by an authorized representative, Mar 10, 2025', status: 'Verified' },
  documents: [
    { list: 'List A', name: 'U.S. passport', number: '•••••4471', expires: 'Jun 2031', status: 'Verified' },
  ],
  everify: { case: '2025069•••••AB', result: 'Employment authorized', closed: 'Mar 11, 2025' },
  screening: [
    { name: 'Criminal background check', vendor: 'Accredited screening partner (FCRA compliant)', date: 'Mar 5, 2025', status: 'Clear' },
    { name: 'Employment history verification', vendor: 'Accredited screening partner', date: 'Mar 6, 2025', status: 'Verified' },
    { name: 'Education verification', vendor: 'Accredited screening partner', date: 'Mar 6, 2025', status: 'Verified' },
  ],
  reverifyNote: 'Your U.S. passport does not require reverification. We will contact you if your work authorization ever needs updating.',
}

// Company equipment, shipments and home-office budget.
export const equipment = {
  assets: [
    { item: 'Dell Latitude 7450 laptop', tag: 'PRB-LT-20418', serial: 'J8K2•••', issued: 'Mar 7, 2025', status: 'In use', note: 'Encrypted, VPN and endpoint protection managed by IT' },
    { item: '27" Dell P2725H monitor', tag: 'PRB-MN-11207', serial: 'CN0F•••', issued: 'Mar 7, 2025', status: 'In use' },
    { item: 'Jabra Evolve2 50 headset', tag: 'PRB-HS-08812', serial: 'JB50•••', issued: 'Sep 2, 2026', status: 'In use', note: 'Replacement for a faulty unit' },
    { item: 'YubiKey 5 NFC security key', tag: 'PRB-SK-03390', serial: 'YK5•••', issued: 'Mar 7, 2025', status: 'In use' },
  ],
  shipments: [
    { id: 'SH-5521', item: 'Ergonomic keyboard and mouse', carrier: 'UPS Ground', tracking: '1Z84F7120397120044', status: 'In transit', eta: 'Oct 6, 2026',
      events: [['Oct 1, 4:12 PM', 'Shipped from Atlanta, GA'], ['Oct 2, 6:40 AM', 'In transit, Nashville, TN']] },
    { id: 'SH-5389', item: 'Replacement headset', carrier: 'UPS Ground', tracking: '1Z84F7120396441182', status: 'Delivered', eta: 'Delivered Sep 2, 2026',
      events: [['Aug 29', 'Shipped from Atlanta, GA'], ['Sep 2, 2:15 PM', 'Delivered to front door']] },
  ],
  stipend: { annual: 500, used: 312.48, items: [['Desk chair (reimbursed)', 249.99, 'Apr 18, 2026'], ['Monitor arm (reimbursed)', 62.49, 'May 2, 2026']] },
  shipTo: '2241 Northwest Blvd, Columbus, OH 43221',
}

// Services the company provides to employees.
export const services = [
  { key: 'it', title: 'IT help desk', desc: 'Laptop problems, access requests, VPN and security keys.', hours: '24/7 for urgent issues', response: 'Within 2 hours' },
  { key: 'payroll', title: 'Payroll support', desc: 'Pay stub questions, corrections and off-cycle payments.', hours: 'Mon–Fri, 8 AM–6 PM ET', response: 'Within 1 business day' },
  { key: 'benefits', title: 'Benefits concierge', desc: 'Help choosing plans, claims issues and finding in-network care.', hours: 'Mon–Fri, 8 AM–8 PM ET', response: 'Within 1 business day' },
  { key: 'reimburse', title: 'Expense reimbursement', desc: 'Home-office stipend, certification fees and approved work expenses.', hours: 'Submit any time', response: 'Paid on the next payroll' },
  { key: 'learning', title: 'Learning & certifications', desc: 'Courses, exam fees and a $1,000 yearly learning budget.', hours: 'Self-service', response: 'Approval within 3 business days' },
  { key: 'career', title: 'Career coaching', desc: 'Talk to your recruiter about raises, promotions or your next role.', hours: 'Book a 30-minute call', response: 'Next available slot' },
  { key: 'eap', title: 'Employee Assistance Program', desc: 'Free, confidential counseling, legal and financial guidance.', hours: '24/7 · (800) 555-0134', response: 'Immediate' },
  { key: 'verify', title: 'Employment verification', desc: 'Proof of employment and income for a lender or landlord.', hours: 'Instant letter download', response: 'Immediate' },
]

export const serviceRequests = [
  { id: 'SR-8831', service: 'Expense reimbursement', subject: 'QuickBooks certification exam fee ($150.00)', opened: 'Aug 28, 2026', status: 'Paid' },
  { id: 'SR-8640', service: 'IT help desk', subject: 'Headset microphone cutting out', opened: 'Aug 27, 2026', status: 'Resolved' },
  { id: 'SR-8902', service: 'Learning & certifications', subject: 'Approval for CPP course', opened: 'Sep 24, 2026', status: 'In review' },
]
