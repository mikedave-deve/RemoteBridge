// 100 work-from-home roles with US employers. Companies are fictional.
export const categories = [
  { name: 'Data Entry', photo: 'paperwork', blurb: 'Clerks, order entry, records' },
  { name: 'Customer Support', photo: 'headphones', blurb: 'Phone, chat and email support' },
  { name: 'Bookkeeping', photo: 'calculator', blurb: 'QuickBooks, AP and AR' },
  { name: 'Accounting', photo: 'signing', blurb: 'Staff accountants, CPAs, tax' },
  { name: 'Payroll', photo: 'laptopHands', blurb: 'Multi-state payroll, benefits' },
  { name: 'Administrative', photo: 'oneOnOne', blurb: 'Admin and executive assistants' },
  { name: 'Virtual Assistant', photo: 'couchCall', blurb: 'Scheduling, inbox, research' },
  { name: 'Healthcare Admin', photo: 'typing', blurb: 'Billing, coding, scheduling' },
  { name: 'HR & Recruiting', photo: 'handshake', blurb: 'HR assistants, coordinators' },
  { name: 'Sales', photo: 'videoCall', blurb: 'Inside sales, account managers' },
  { name: 'IT Support', photo: 'homeDesk', blurb: 'Help desk, technical support' },
  { name: 'Marketing', photo: 'dashboard', blurb: 'Social, content, coordinators' },
]
export const departments = categories.map((c) => c.name)
export const timezones = ['Eastern', 'Central', 'Mountain', 'Pacific']
export const types = ['Full-time', 'Part-time', 'Contract']
export const levels = ['Entry level', 'Mid-level', 'Senior']

const companies = [
  ['Harborline Insurance', 'Hartford', 'CT'], ['Summit Ridge Health', 'Denver', 'CO'], ['Clearwater Logistics', 'Memphis', 'TN'],
  ['Bluestem Financial', 'Omaha', 'NE'], ['Northgate Property Group', 'Charlotte', 'NC'], ['Pinecrest Dental Partners', 'Raleigh', 'NC'],
  ['Lakeshore Supply Co.', 'Chicago', 'IL'], ['Granite State Mutual', 'Manchester', 'NH'], ['Copperline Energy', 'Phoenix', 'AZ'],
  ['Westbrook & Hale CPAs', 'Columbus', 'OH'], ['Brightpath Learning', 'Austin', 'TX'], ['Redwood Home Services', 'Sacramento', 'CA'],
  ['Magnolia Benefits Group', 'Atlanta', 'GA'], ['Ironwood Payroll Services', 'Dallas', 'TX'], ['Cascade Outdoor Outfitters', 'Portland', 'OR'],
  ['Alder Family Medicine', 'Seattle', 'WA'], ['Liberty Square Realty', 'Philadelphia', 'PA'], ['Prairie Wind Telecom', 'Kansas City', 'MO'],
  ['Sunbelt Auto Finance', 'Tampa', 'FL'], ['Keystone Legal Group', 'Pittsburgh', 'PA'], ['Silverline Software', 'San Jose', 'CA'],
  ['Heartland Grocers', 'Des Moines', 'IA'], ['Bayview Hospitality', 'San Diego', 'CA'], ['Monarch Retail Brands', 'Minneapolis', 'MN'],
  ['Old Harbor Bank', 'Boston', 'MA'], ['Canyon State Insurance', 'Tucson', 'AZ'], ['Riverbend Senior Living', 'Nashville', 'TN'],
  ['Tidewater Freight', 'Norfolk', 'VA'], ['Great Lakes Medical Billing', 'Detroit', 'MI'], ['Front Range Accounting', 'Boulder', 'CO'],
]

export const states = {
  AL: ['Alabama', 'Central'], AZ: ['Arizona', 'Mountain'], CA: ['California', 'Pacific'], CO: ['Colorado', 'Mountain'],
  CT: ['Connecticut', 'Eastern'], FL: ['Florida', 'Eastern'], GA: ['Georgia', 'Eastern'], IA: ['Iowa', 'Central'],
  ID: ['Idaho', 'Mountain'], IL: ['Illinois', 'Central'], IN: ['Indiana', 'Eastern'], KS: ['Kansas', 'Central'],
  KY: ['Kentucky', 'Eastern'], LA: ['Louisiana', 'Central'], MA: ['Massachusetts', 'Eastern'], MD: ['Maryland', 'Eastern'],
  MI: ['Michigan', 'Eastern'], MN: ['Minnesota', 'Central'], MO: ['Missouri', 'Central'], NC: ['North Carolina', 'Eastern'],
  NE: ['Nebraska', 'Central'], NH: ['New Hampshire', 'Eastern'], NJ: ['New Jersey', 'Eastern'], NM: ['New Mexico', 'Mountain'],
  NV: ['Nevada', 'Pacific'], NY: ['New York', 'Eastern'], OH: ['Ohio', 'Eastern'], OK: ['Oklahoma', 'Central'],
  OR: ['Oregon', 'Pacific'], PA: ['Pennsylvania', 'Eastern'], SC: ['South Carolina', 'Eastern'], TN: ['Tennessee', 'Central'],
  TX: ['Texas', 'Central'], UT: ['Utah', 'Mountain'], VA: ['Virginia', 'Eastern'], WA: ['Washington', 'Pacific'], WI: ['Wisconsin', 'Central'],
}
const stateCodes = Object.keys(states)

// [title, category, level, type, pay, skills, summary, responsibilities, requirements, count]
// pay: ['h', min, max] per hour, or ['y', min, max] in $k per year
const T = [
  ['Data Entry Clerk', 'Data Entry', 'Entry level', 'Full-time', ['h', 17, 21], ['Typing 55+ WPM', 'Excel', 'Accuracy'],
    'Enter and verify customer, order and invoice records in our ERP system from home. Clear daily targets, a friendly team lead and full training in your first two weeks.',
    ['Key in 300–400 records a day from scanned forms and emails', 'Check entries against source documents and flag mismatches', 'Keep shared spreadsheets clean, sorted and up to date', 'Hit daily accuracy and volume targets set with your lead'],
    ['High school diploma or GED', 'Typing speed of 55 words per minute or more', 'Comfort with Excel or Google Sheets', 'Quiet home workspace and reliable internet (25 Mbps+)'], 5],
  ['Data Entry Specialist, Insurance Claims', 'Data Entry', 'Mid-level', 'Full-time', ['h', 19, 24], ['Claims systems', 'Data validation', 'Excel'],
    'Process incoming property and auto claims into our claims platform, making sure every policy number, date and amount is correct before an adjuster picks it up.',
    ['Enter first notice of loss details from forms, calls and email', 'Validate policy coverage and route claims to the right adjuster', 'Correct and re-index documents in the claims file', 'Meet a 24-hour turnaround on new claims'],
    ['1+ year of data entry or claims processing experience', 'Accuracy rate of 98% or higher', 'Familiarity with insurance terms is a plus', 'Available Monday to Friday, 8–5 local time'], 3],
  ['Part-Time Data Entry Associate', 'Data Entry', 'Entry level', 'Part-time', ['h', 16, 19], ['Typing', 'Google Sheets', 'Attention to detail'],
    'Twenty hours a week updating product listings, prices and inventory counts. Choose your own hours between 7am and 9pm, Monday to Saturday.',
    ['Update product data across our catalog and marketplace listings', 'Reconcile inventory counts against warehouse reports', 'Clean duplicate and incomplete records', 'Log your work in a simple daily tracker'],
    ['Typing speed of 45 WPM or more', 'Basic spreadsheet skills', 'Able to commit to 20 hours a week', 'Must reside in the United States'], 2],
  ['Order Entry Coordinator', 'Data Entry', 'Mid-level', 'Full-time', ['h', 20, 25], ['NetSuite', 'Order management', 'Customer service'],
    'Turn purchase orders from wholesale customers into accurate sales orders, then keep customers updated on ship dates and backorders.',
    ['Enter and confirm 60–80 wholesale orders a day', 'Resolve pricing and quantity discrepancies with sales reps', 'Send order confirmations and tracking details to customers', 'Maintain customer account records'],
    ['2+ years in order entry, sales support or customer service', 'Experience with NetSuite, SAP or a similar ERP', 'Clear written communication', 'Strong Excel skills (VLOOKUP, filters)'], 2],

  ['Customer Support Representative', 'Customer Support', 'Entry level', 'Full-time', ['h', 17, 21], ['Zendesk', 'Phone & chat', 'Empathy'],
    'Help our customers by phone, chat and email with orders, billing and account questions. Paid training, a set weekly schedule and a team that has your back.',
    ['Answer 40–60 customer contacts a day across phone, chat and email', 'Resolve billing, order and account questions on first contact', 'Document every interaction in Zendesk', 'Escalate complex cases to the right team with clear notes'],
    ['6+ months of customer-facing experience (retail and hospitality count)', 'Clear, friendly phone manner', 'Comfortable switching between several browser tabs', 'Quiet workspace, wired internet and a USB headset'], 4],
  ['Customer Service Agent, Inbound Calls', 'Customer Support', 'Entry level', 'Full-time', ['h', 16, 20], ['Inbound calls', 'CRM', 'De-escalation'],
    'Take inbound calls from policyholders and members, answer questions about their accounts and make sure every caller leaves with a clear next step.',
    ['Handle 50+ inbound calls a day in a supportive call-center team', 'Update customer records and take payments securely', 'Follow call scripts and compliance guidelines', 'Meet quality and customer-satisfaction goals'],
    ['High school diploma or GED', 'Call-center or customer service experience preferred', 'Basic computer skills and typing of 35 WPM+', 'Hard-wired internet connection'], 3],
  ['Live Chat Support Specialist', 'Customer Support', 'Entry level', 'Part-time', ['h', 17, 20], ['Live chat', 'Intercom', 'Writing'],
    'Answer customer questions over live chat for a growing online retailer, 25 hours a week on an evening and weekend schedule.',
    ['Manage 2–3 chat conversations at once', 'Help customers with sizing, returns and order status', 'Write clear, friendly replies using our tone guide', 'Tag conversations so we can spot trends'],
    ['Excellent written English and fast, accurate typing', 'Experience with Intercom, Gorgias or similar is a plus', 'Available evenings and at least one weekend day', 'US resident'], 2],
  ['Senior Customer Support Specialist', 'Customer Support', 'Mid-level', 'Full-time', ['h', 22, 27], ['Tier 2 support', 'Zendesk', 'Troubleshooting'],
    'Take the trickiest tickets from our frontline team, solve them properly and write the help-center articles that stop them coming back.',
    ['Own escalated tickets from first reply to resolution', 'Troubleshoot account, billing and integration issues', 'Write and update help-center articles', 'Coach newer reps on tone and process'],
    ['2+ years in customer support, ideally for a software or subscription business', 'Strong troubleshooting and written communication skills', 'Experience with Zendesk or Freshdesk', 'Comfortable reading simple system logs'], 2],
  ['Customer Support Team Lead', 'Customer Support', 'Senior', 'Full-time', ['y', 55, 68], ['Team leadership', 'QA', 'Scheduling'],
    'Lead a remote team of 10–12 support reps across two time zones. You will run coaching, quality reviews and the weekly schedule.',
    ['Run weekly one-to-ones and quality reviews for your team', 'Manage schedules and real-time queue coverage', 'Report on response times, CSAT and backlog', 'Handle escalations from VIP customers'],
    ['3+ years in support, including 1+ year leading a team', 'Data-minded: comfortable with dashboards and KPIs', 'Calm, clear communicator', 'Experience leading remote teams preferred'], 1],
  ['Bilingual Customer Service Representative (English/Spanish)', 'Customer Support', 'Entry level', 'Full-time', ['h', 19, 23], ['Spanish', 'English', 'Phone support'],
    'Support English- and Spanish-speaking customers by phone and email. Includes a $1.50/hr bilingual differential.',
    ['Answer customer calls and emails in English and Spanish', 'Resolve account, billing and scheduling questions', 'Translate short customer notes for the wider team', 'Keep accurate records in our CRM'],
    ['Fluent spoken and written English and Spanish', '6+ months of customer service experience', 'Available Monday to Friday', 'Quiet home office with reliable internet'], 2],

  ['Bookkeeper', 'Bookkeeping', 'Mid-level', 'Full-time', ['h', 24, 30], ['QuickBooks Online', 'Reconciliations', 'AP/AR'],
    'Keep the books for a portfolio of 15–20 small-business clients: categorize transactions, reconcile accounts and close each month on time.',
    ['Categorize transactions and reconcile bank and credit card accounts', 'Process accounts payable and send customer invoices', 'Prepare monthly financial statements for review', 'Answer client questions about their books'],
    ['2+ years of bookkeeping experience', 'Advanced QuickBooks Online skills (ProAdvisor certification a plus)', 'Understanding of accrual vs. cash accounting', 'Organized and deadline-driven'], 4],
  ['Part-Time Bookkeeper', 'Bookkeeping', 'Mid-level', 'Part-time', ['h', 25, 32], ['QuickBooks', 'Xero', 'Month-end'],
    'Fifteen to twenty hours a week keeping the books for a family-owned business. Flexible hours, one standing call a week with the owner.',
    ['Record income and expenses and reconcile accounts monthly', 'Run bi-weekly payroll through Gusto', 'Prepare sales tax filings', 'Send the owner a simple monthly summary'],
    ['3+ years of bookkeeping experience', 'Experience with QuickBooks or Xero', 'Familiar with Gusto or similar payroll software', 'Reliable and independent'], 2],
  ['Full-Charge Bookkeeper', 'Bookkeeping', 'Senior', 'Full-time', ['y', 55, 68], ['Full-charge', 'Payroll', 'Financial statements'],
    'Own the full accounting cycle for a 60-person company, from daily entries through month-end close and handoff to our outside CPA.',
    ['Manage AP, AR, payroll and general ledger', 'Close the books monthly and prepare financial statements', 'Reconcile all balance sheet accounts', 'Work with our CPA at year-end'],
    ['5+ years of full-charge bookkeeping experience', 'Expert in QuickBooks and Excel', 'Payroll and sales tax experience', 'Associate degree in accounting or equivalent experience'], 1],
  ['Accounts Payable Clerk', 'Bookkeeping', 'Entry level', 'Full-time', ['h', 19, 23], ['Accounts payable', '3-way match', 'Excel'],
    'Process vendor invoices, match them to purchase orders and make sure our suppliers are paid accurately and on time.',
    ['Enter and code 150+ vendor invoices a week', 'Perform three-way match against POs and receipts', 'Prepare weekly payment runs (ACH and check)', 'Respond to vendor inquiries by email'],
    ['1+ year of AP or general office experience', 'Comfort with Excel and accounting software', 'Strong attention to detail', 'Associate degree in accounting a plus'], 2],
  ['Accounts Receivable Specialist', 'Bookkeeping', 'Mid-level', 'Full-time', ['h', 21, 26], ['Collections', 'Invoicing', 'Cash application'],
    'Send invoices, apply payments and follow up on past-due accounts with a firm but friendly touch.',
    ['Prepare and send customer invoices', 'Apply incoming payments and reconcile deposits', 'Follow up on past-due balances by phone and email', 'Prepare weekly aging reports'],
    ['2+ years of AR or collections experience', 'Experience with QuickBooks, NetSuite or Sage', 'Professional phone manner', 'Strong Excel skills'], 2],

  ['Staff Accountant', 'Accounting', 'Mid-level', 'Full-time', ['y', 62, 75], ['GAAP', 'Month-end close', 'NetSuite'],
    'Join a fully remote finance team of six. You will own journal entries, reconciliations and fixed assets as part of a five-day close.',
    ['Prepare journal entries and accruals during month-end close', 'Reconcile balance sheet accounts', 'Maintain fixed asset and prepaid schedules', 'Support the annual audit and tax provision'],
    ["Bachelor's degree in accounting", '2+ years of corporate or public accounting experience', 'Working knowledge of US GAAP', 'Experience with NetSuite, Sage Intacct or similar'], 4],
  ['Senior Accountant', 'Accounting', 'Senior', 'Full-time', ['y', 78, 95], ['Consolidations', 'Revenue recognition', 'Audit'],
    'Lead the close for three entities, own revenue recognition and be the main point of contact for our external auditors.',
    ['Lead month-end close across three entities', 'Own ASC 606 revenue recognition schedules', 'Prepare consolidated financial statements', 'Coordinate the annual audit'],
    ["Bachelor's degree in accounting; CPA preferred", '4+ years of progressive accounting experience', 'Strong understanding of US GAAP', 'Advanced Excel skills'], 2],
  ['Tax Preparer (Seasonal)', 'Accounting', 'Mid-level', 'Contract', ['h', 25, 38], ['Form 1040', 'ProSeries', 'Tax law'],
    'Prepare individual and small-business tax returns from home, January through April. Flexible hours with paid overtime in peak season.',
    ['Prepare Form 1040 returns with Schedules A, C, D and E', 'Review client documents and request missing items', 'E-file returns and track acceptances', 'Answer client questions by phone and secure portal'],
    ['2+ tax seasons of preparation experience', 'Active PTIN required; EA or CPA a plus', 'Experience with ProSeries, Drake or Lacerte', 'Available 30+ hours a week during peak season'], 2],
  ['Certified Public Accountant (CPA)', 'Accounting', 'Senior', 'Full-time', ['y', 90, 115], ['CPA', 'Tax planning', 'Advisory'],
    'Advise a book of small-business and high-net-worth clients on tax planning, compliance and growth, with a reviewer role on returns.',
    ['Review individual, partnership and S-corp returns', 'Lead quarterly tax planning calls with clients', 'Mentor two staff accountants', 'Respond to IRS and state notices'],
    ['Active CPA license in any US state', '5+ years of public accounting experience', 'Strong knowledge of individual and business taxation', 'Excellent client communication'], 1],
  ['Accounting Assistant', 'Accounting', 'Entry level', 'Full-time', ['y', 45, 52], ['Excel', 'Reconciliations', 'Data entry'],
    'An entry point into corporate accounting. You will support the team with reconciliations, expense reports and vendor setup while you learn the close.',
    ['Review and process employee expense reports', 'Set up new vendors and collect W-9s', 'Assist with bank reconciliations', 'Maintain organized digital files for audit'],
    ["Associate or bachelor's degree in accounting or business (or in progress)", 'Intermediate Excel skills', 'Detail-oriented and eager to learn', 'Comfortable working remotely with a team'], 2],

  ['Payroll Specialist', 'Payroll', 'Mid-level', 'Full-time', ['y', 55, 65], ['ADP', 'Multi-state payroll', 'Garnishments'],
    'Run accurate bi-weekly payroll for 900 employees across 22 states, including garnishments, new-hire setup and tax notices.',
    ['Process bi-weekly payroll in ADP Workforce Now', 'Maintain employee pay, tax and deduction records', 'Handle garnishments, levies and state tax notices', 'Answer employee payroll questions'],
    ['2+ years of multi-state payroll experience', 'Experience with ADP, Paylocity or UKG', 'Understanding of federal and state payroll tax rules', 'FPC or CPP certification a plus'], 3],
  ['Payroll Administrator', 'Payroll', 'Mid-level', 'Full-time', ['y', 52, 62], ['Paylocity', 'Timekeeping', 'Payroll audits'],
    'Own payroll for our hourly workforce: timekeeping, overtime, PTO accruals and accurate pay on every cycle.',
    ['Audit time cards and approve overtime with managers', 'Process weekly payroll and off-cycle checks', 'Maintain PTO accruals and balances', 'Prepare payroll journal entries for accounting'],
    ['2+ years of payroll experience', 'Paylocity or a similar system', 'Strong Excel skills', 'Discretion with confidential information'], 3],
  ['Senior Payroll Analyst', 'Payroll', 'Senior', 'Full-time', ['y', 72, 88], ['UKG', 'Payroll tax', 'Reporting'],
    'Lead payroll compliance and reporting for a 3,000-person employer, and help us move to a new payroll platform next year.',
    ['Oversee payroll processing and quarterly tax filings', 'Reconcile payroll to the general ledger', 'Lead year-end W-2 processing', 'Support the payroll system implementation'],
    ['5+ years of payroll experience in a multi-state environment', 'CPP certification preferred', 'Deep knowledge of payroll tax compliance', 'Advanced Excel skills'], 1],
  ['Payroll & Benefits Coordinator', 'Payroll', 'Entry level', 'Full-time', ['y', 48, 56], ['Payroll', 'Benefits enrollment', 'HRIS'],
    'Support payroll and benefits for a 250-person company: new-hire setup, benefits enrollments and answering employee questions.',
    ['Enter new hires, changes and terminations in our HRIS', 'Process benefit enrollments and changes', 'Reconcile monthly benefit invoices', 'Help prepare payroll each pay period'],
    ['1+ year of payroll, benefits or HR experience', 'Familiar with Gusto, Rippling or BambooHR', 'Organized and detail-oriented', 'Respect for confidential data'], 2],

  ['Administrative Assistant', 'Administrative', 'Entry level', 'Full-time', ['h', 18, 23], ['Microsoft 365', 'Scheduling', 'Organization'],
    'Keep a busy remote team organized: calendars, meeting notes, travel bookings, document prep and a well-run shared drive.',
    ['Manage calendars and schedule meetings across time zones', 'Prepare documents, presentations and meeting notes', 'Book travel and process expense reports', 'Keep shared files organized and up to date'],
    ['1+ year of administrative or office experience', 'Strong Microsoft 365 or Google Workspace skills', 'Excellent written communication', 'Proactive and organized'], 4],
  ['Executive Assistant', 'Administrative', 'Senior', 'Full-time', ['y', 62, 78], ['Executive support', 'Calendar management', 'Discretion'],
    'Partner with our CEO and CFO. You will run their calendars, prepare board materials and keep the leadership team moving.',
    ['Manage complex calendars and travel for two executives', 'Prepare board and leadership meeting materials', 'Screen and prioritize email and requests', 'Coordinate quarterly in-person leadership offsites'],
    ['5+ years supporting C-level executives', 'Exceptional judgment and discretion', 'Expert in Google Workspace or Microsoft 365', 'Available for occasional early or late calls'], 2],
  ['Office Administrator (Remote)', 'Administrative', 'Mid-level', 'Full-time', ['y', 45, 55], ['Vendor management', 'Onboarding', 'Procurement'],
    'Run the "virtual office" for a 120-person remote company: equipment, software licenses, vendors and new-hire logistics.',
    ['Ship and track laptops and equipment for new hires', 'Manage software licenses and vendor renewals', 'Coordinate team events and in-person meetups', 'Maintain company policies and the internal wiki'],
    ['3+ years of office administration experience', 'Comfortable with budgets and purchase orders', 'Organized, friendly and resourceful', 'Experience at a remote company a plus'], 1],
  ['Administrative Coordinator', 'Administrative', 'Mid-level', 'Full-time', ['h', 20, 25], ['Coordination', 'Excel', 'Customer communication'],
    'Coordinate scheduling, paperwork and client communication for our field service teams across three states.',
    ['Schedule appointments and dispatch technicians', 'Prepare quotes, work orders and invoices', 'Communicate with customers by phone and email', 'Track job status in our service software'],
    ['2+ years of administrative or coordination experience', 'Strong Excel and typing skills', 'Excellent phone manner', 'Able to juggle many priorities'], 2],
  ['Virtual Receptionist', 'Administrative', 'Entry level', 'Full-time', ['h', 16, 19], ['Phones', 'Scheduling', 'Customer service'],
    'Be the friendly first voice our clients hear. Answer calls, book appointments and route messages for a busy professional-services firm.',
    ['Answer and route incoming calls', 'Book, confirm and reschedule appointments', 'Take clear messages and follow up', 'Greet clients on video check-ins'],
    ['Warm, professional phone manner', 'Experience as a receptionist or in customer service', 'Basic computer skills', 'Quiet, professional home workspace'], 2],

  ['Virtual Assistant', 'Virtual Assistant', 'Entry level', 'Part-time', ['h', 18, 24], ['Inbox management', 'Research', 'Canva'],
    'Support a small-business owner with inbox management, scheduling, research and simple social posts, 20 hours a week.',
    ['Manage inbox and calendar', 'Research vendors, prices and contacts', 'Create simple graphics in Canva', 'Keep task lists and notes in Notion'],
    ['Strong written English', 'Organized and self-directed', 'Experience with Google Workspace', 'Available 20 hours a week during business hours'], 3],
  ['Executive Virtual Assistant', 'Virtual Assistant', 'Mid-level', 'Full-time', ['h', 24, 30], ['Executive support', 'Travel planning', 'CRM'],
    'Act as the right hand to two founders: travel, inbox, CRM updates, investor-update drafts and anything that keeps the week on track.',
    ['Run inbox triage and calendar for two founders', 'Plan domestic travel and events', 'Keep the CRM and investor list up to date', 'Draft first versions of routine emails and updates'],
    ['3+ years as an EA or VA', 'Exceptional organization and judgment', 'Experience with HubSpot or Salesforce', 'Comfort with confidential information'], 2],
  ['Real Estate Virtual Assistant', 'Virtual Assistant', 'Mid-level', 'Contract', ['h', 20, 26], ['MLS', 'Transaction coordination', 'CRM'],
    'Support a top-producing real estate team with listings, transaction paperwork and client follow-up.',
    ['Enter and update listings in the MLS', 'Track transactions from contract to close', 'Schedule showings, inspections and closings', 'Send client follow-ups and market updates'],
    ['1+ year of real estate admin or transaction coordination', 'Familiar with MLS and e-signature tools', 'Detail-oriented and responsive', 'Licensed agents welcome but not required'], 1],

  ['Medical Billing Specialist', 'Healthcare Admin', 'Mid-level', 'Full-time', ['h', 20, 25], ['Medical billing', 'Claims', 'EHR'],
    'Submit claims, follow up on denials and help patients understand their bills for a growing multi-location practice.',
    ['Submit clean claims to commercial and government payers', 'Work denials and resubmit corrected claims', 'Post payments and adjustments', 'Answer patient billing questions'],
    ['2+ years of medical billing experience', 'Knowledge of CPT, ICD-10 and HCPCS codes', 'Experience with Athena, eClinicalWorks or Kareo', 'HIPAA-compliant home workspace'], 3],
  ['Medical Coder (CPC)', 'Healthcare Admin', 'Mid-level', 'Full-time', ['h', 24, 31], ['CPC', 'ICD-10', 'Outpatient coding'],
    'Code outpatient and professional encounters accurately and on time for a network of primary-care clinics.',
    ['Assign ICD-10-CM and CPT codes from provider documentation', 'Query providers when documentation is unclear', 'Meet productivity and 95% accuracy targets', 'Stay current with coding guidelines'],
    ['Active CPC, CCS or equivalent certification', '2+ years of outpatient coding experience', 'Experience with encoder software', 'Secure, private home workspace'], 2],
  ['Insurance Verification Specialist', 'Healthcare Admin', 'Entry level', 'Full-time', ['h', 18, 22], ['Eligibility checks', 'Prior authorization', 'Phone'],
    'Verify patient insurance coverage and obtain prior authorizations before appointments so patients are never surprised by a bill.',
    ['Verify eligibility and benefits through payer portals and calls', 'Request and track prior authorizations', 'Update patient records with coverage details', 'Communicate estimated costs to patients'],
    ['1+ year in a medical office, billing or insurance role', 'Comfortable on the phone with insurers', 'Accurate data entry skills', 'HIPAA awareness'], 2],
  ['Patient Scheduling Coordinator', 'Healthcare Admin', 'Entry level', 'Full-time', ['h', 17, 21], ['Scheduling', 'Phone support', 'EHR'],
    'Help patients book, change and prepare for appointments across our clinics by phone and online chat.',
    ['Schedule appointments across multiple providers and locations', 'Send reminders and pre-visit instructions', 'Manage waitlists and cancellations', 'Update patient demographics in the EHR'],
    ['Customer service or medical office experience', 'Friendly and patient phone manner', 'Typing speed of 40 WPM+', 'Available for some Saturday shifts'], 1],

  ['HR Assistant', 'HR & Recruiting', 'Entry level', 'Full-time', ['y', 45, 52], ['HRIS', 'Onboarding', 'I-9 / E-Verify'],
    'Support a busy HR team with onboarding, employee records and day-to-day questions for 600 employees.',
    ['Prepare offer letters and onboarding paperwork', 'Complete I-9 verification and E-Verify', 'Maintain accurate employee records in our HRIS', 'Answer routine employee questions'],
    ['1+ year in HR, recruiting or administration', 'Familiarity with I-9 and E-Verify', 'Discretion with confidential information', 'Strong organization skills'], 2],
  ['Recruiting Coordinator', 'HR & Recruiting', 'Mid-level', 'Full-time', ['y', 50, 60], ['Greenhouse', 'Interview scheduling', 'Candidate experience'],
    'Schedule interviews, manage candidate communication and keep our hiring pipeline moving for 40+ open roles.',
    ['Schedule multi-round interviews across time zones', 'Send offer letters and background checks', 'Keep the applicant tracking system accurate', 'Create a great experience for every candidate'],
    ['1–3 years of recruiting coordination or HR experience', 'Experience with Greenhouse, Lever or Workday', 'Excellent communication skills', 'Able to manage many moving parts'], 2],
  ['Benefits Administrator', 'HR & Recruiting', 'Mid-level', 'Full-time', ['y', 55, 66], ['Benefits', 'COBRA', 'Open enrollment'],
    'Run health and retirement benefits for 1,200 employees, from new-hire enrollment through annual open enrollment.',
    ['Administer medical, dental, vision and 401(k) plans', 'Lead annual open enrollment', 'Process COBRA and leave of absence paperwork', 'Reconcile monthly carrier invoices'],
    ['3+ years of benefits administration experience', 'Knowledge of ACA, COBRA and FMLA', 'Strong Excel skills', 'CEBS certification a plus'], 1],

  ['Inside Sales Representative', 'Sales', 'Entry level', 'Full-time', ['y', 45, 55], ['Phone sales', 'HubSpot', 'Prospecting'],
    'Call and email inbound leads, understand what they need and help them choose the right plan. Base salary plus uncapped commission.',
    ['Respond to inbound leads within one hour', 'Run discovery calls and product demos', 'Manage your pipeline in HubSpot', 'Hit monthly booking targets'],
    ['1+ year of sales or customer-facing experience', 'Confident on the phone', 'Coachable and target-driven', 'Quiet home workspace'], 2],
  ['Sales Development Representative', 'Sales', 'Entry level', 'Full-time', ['y', 50, 60], ['Outbound', 'Salesforce', 'Cold calling'],
    'Start a career in B2B software sales. You will research accounts and book qualified meetings for our account executives.',
    ['Research target accounts and contacts', 'Run outbound call and email sequences', 'Qualify prospects and book meetings', 'Log all activity in Salesforce'],
    ['Bachelor’s degree or equivalent experience', 'Resilient, curious and organized', 'Excellent written and verbal communication', 'Prior SDR experience a plus'], 2],
  ['Account Manager', 'Sales', 'Mid-level', 'Full-time', ['y', 62, 78], ['Account management', 'Renewals', 'Upselling'],
    'Look after a book of 80 mid-sized customers, help them get value from our product and grow each account over time.',
    ['Run quarterly business reviews with customers', 'Manage renewals and identify upsell opportunities', 'Coordinate with support and product teams', 'Forecast renewals and expansion accurately'],
    ['3+ years in account management or customer success', 'B2B SaaS experience preferred', 'Strong relationship-building skills', 'Experience with Salesforce or HubSpot'], 1],

  ['IT Help Desk Technician', 'IT Support', 'Entry level', 'Full-time', ['h', 21, 26], ['Windows', 'Microsoft 365', 'Ticketing'],
    'Be the first line of IT support for 400 remote employees: password resets, laptop setup, software access and friendly troubleshooting.',
    ['Resolve tickets by phone, chat and remote session', 'Set up and ship laptops for new hires', 'Manage user accounts in Microsoft 365 and Okta', 'Document fixes in our knowledge base'],
    ['1+ year of help desk or IT support experience', 'Comfortable with Windows, macOS and Microsoft 365', 'CompTIA A+ a plus', 'Patient, clear communicator'], 2],
  ['Technical Support Specialist (Tier 2)', 'IT Support', 'Mid-level', 'Full-time', ['y', 55, 68], ['APIs', 'SQL', 'Troubleshooting'],
    'Solve technical issues for business customers using our software, from login problems to integration errors.',
    ['Troubleshoot escalated technical tickets', 'Reproduce bugs and write clear reports for engineering', 'Run simple SQL queries to investigate issues', 'Improve internal troubleshooting guides'],
    ['2+ years in technical support', 'Basic SQL and comfort reading API responses', 'Strong written communication', 'Experience with Jira and Zendesk'], 2],

  ['Social Media Coordinator', 'Marketing', 'Entry level', 'Full-time', ['y', 45, 55], ['Instagram', 'TikTok', 'Canva'],
    'Plan, create and schedule content for our social channels, and keep our community engaged every day.',
    ['Plan and schedule posts across four channels', 'Create graphics and short videos', 'Reply to comments and messages', 'Report monthly on engagement'],
    ['1+ year managing social media for a brand', 'Skilled with Canva and short-form video', 'Strong writing voice', 'Portfolio of past work'], 2],
  ['Content Writer', 'Marketing', 'Mid-level', 'Contract', ['h', 30, 40], ['SEO', 'Blog writing', 'Editing'],
    'Write clear, well-researched articles and guides on personal finance for a US audience. Around 20 hours a week.',
    ['Write 4–6 long-form articles a month', 'Research topics and interview experts', 'Optimize content for search', 'Edit and update existing articles'],
    ['2+ years of professional writing experience', 'Published samples in finance or business', 'SEO knowledge', 'Reliable with deadlines'], 1],
  ['Marketing Coordinator', 'Marketing', 'Entry level', 'Full-time', ['y', 48, 58], ['Email marketing', 'Events', 'Project management'],
    'Keep our marketing calendar on track: email campaigns, webinars, trade-show logistics and campaign reporting.',
    ['Build and send email campaigns in HubSpot', 'Coordinate webinars and virtual events', 'Manage the marketing project board', 'Pull weekly campaign reports'],
    ["Bachelor's degree in marketing or communications", '1+ year of marketing experience', 'Organized and detail-oriented', 'HubSpot experience a plus'], 1],
]

// Photos that fit each field; jobs in the same category rotate through them.
const jobPhotos = {
  'Data Entry': ['paperwork', 'typing', 'laptopHands', 'deskFlatlay'],
  'Customer Support': ['headphones', 'homeVideo', 'couchCall', 'videoCall'],
  Bookkeeping: ['calculator', 'phoneCalc', 'notebook', 'taxStatement'],
  Accounting: ['signing', 'taxForms', 'taxStatement', 'analytics'],
  Payroll: ['phoneCalc', 'calculator', 'laptopHands', 'dashboard'],
  Administrative: ['oneOnOne', 'officeLead', 'hallway', 'homeDesk'],
  'Virtual Assistant': ['couchCall', 'cafeLaptop', 'homeDesk'],
  'Healthcare Admin': ['typing', 'laptopHands', 'paperwork'],
  'HR & Recruiting': ['handshake', 'resume', 'pairWork'],
  Sales: ['videoCall', 'pitch', 'boardroom'],
  'IT Support': ['homeDesk', 'zoomSetup', 'laptopHands'],
  Marketing: ['dashboard', 'analytics', 'whiteboard'],
}
const seen = {}

const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Small deterministic generator so the board is stable between visits.
let seed = 20261002
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

const schedules = {
  'Full-time': ['Mon–Fri, 9am–5pm', 'Mon–Fri, 8am–4:30pm', 'Mon–Fri, flexible start', '40 hrs/week, set shifts'],
  'Part-time': ['20 hrs/week, flexible', '20–25 hrs/week', 'Evenings & weekends', 'Mornings, Mon–Fri'],
  Contract: ['30–40 hrs/week', '20 hrs/week', 'Project-based, flexible'],
}
const benefits = {
  'Full-time': ['Medical, dental and vision insurance', '401(k) with company match', '15 days PTO plus 10 paid holidays', 'Company laptop shipped to your home', '$500 home-office stipend', 'Paid training from day one'],
  'Part-time': ['Choose your own hours', 'Paid sick leave', 'Company laptop provided', 'Weekly direct deposit', 'Paid training'],
  Contract: ['Weekly pay by direct deposit', 'Equipment provided', 'Option to convert to W-2 employment', 'Flexible schedule'],
}

const list = []
let ci = 0
T.forEach(([title, department, level, type, pay, skills, summary, responsibilities, requirements, count]) => {
  for (let k = 0; k < count; k++) {
    const [company, city, hq] = companies[ci++ % companies.length]
    const anywhere = rand() < 0.45
    const st = anywhere ? hq : stateCodes[Math.floor(rand() * stateCodes.length)]
    const [stateName, tz] = states[st]
    const id = `${slug(title)}-${slug(company)}`
    if (list.some((j) => j.id === id)) continue
    const n = (seen[department] = (seen[department] || 0) + 1) - 1
    list.push({
      id, title, company, photo: jobPhotos[department][n % jobPhotos[department].length], companyCity: `${city}, ${hq}`, department, level, type,
      pay, payType: pay[0] === 'h' ? 'Hourly' : 'Salary', stack: skills,
      state: st, stateName, timezone: tz, anywhere,
      location: anywhere ? 'Remote · Anywhere in the US' : `Remote · ${stateName} residents`,
      schedule: schedules[type][Math.floor(rand() * schedules[type].length)],
      employment: type === 'Contract' ? '1099 contract' : 'W-2 employee',
      posted: Math.floor(rand() * 15),
      applicants: 8 + Math.floor(rand() * 90),
      summary, responsibilities, requirements, benefits: benefits[type],
    })
  }
})

// Keep the board at exactly 100 roles.
export const jobs = list.slice(0, 100)

const featuredIds = ['Data Entry Clerk', 'Customer Support Representative', 'Bookkeeper', 'Payroll Specialist', 'Administrative Assistant', 'Staff Accountant', 'Medical Billing Specialist', 'Virtual Assistant', 'Accounts Payable Clerk']
featuredIds.forEach((t) => { const j = jobs.find((x) => x.title === t); if (j) j.featured = true })

export const getJob = (id) => jobs.find((j) => j.id === id)
export const countBy = (key, value) => jobs.filter((j) => j[key] === value).length

export const money = (pay) => pay[0] === 'h' ? `$${pay[1]}–$${pay[2]}/hr` : `$${pay[1]}k–$${pay[2]}k/yr`
export const postedLabel = (d) => (d === 0 ? 'Posted today' : d === 1 ? 'Posted yesterday' : `Posted ${d} days ago`)
