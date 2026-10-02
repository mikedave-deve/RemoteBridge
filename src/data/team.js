// Team portraits live in public/media.
const m = (file) => `/media/${encodeURIComponent(file)}`

export const leadership = [
  { name: 'Daniel Brooks', role: 'Co-founder & Chief Executive Officer', city: 'Atlanta, GA', img: m('CEO RB.jpg'),
    bio: 'Spent twelve years running staffing for insurers and banks across the Southeast before founding PremierRemoteBridge in 2018.' },
  { name: 'Matthew Sullivan', role: 'Hiring Manager', city: 'New York, NY', img: m('HRM RB.jpg'),
    bio: 'Leads hiring across every job category and signs off each shortlist before it reaches an employer. Twenty years in recruiting.' },
  { name: 'William Parker', role: 'Co-founder & Chief Operating Officer', city: 'Chicago, IL', img: m('COO RB.jpg'),
    bio: 'Previously led payroll and compliance for a national staffing firm. Owns onboarding, payroll and multi-state compliance.' },
  { name: 'James Whitaker', role: 'Supervisor, Recruiting Operations', city: 'Austin, TX', img: m('SUPERVISOR RB.jpg'),
    bio: 'Supervises the recruiting teams day to day, from first call to start date, and keeps every candidate update on time.' },
]

export const people = [
  { name: 'Oliver Grant', role: 'Director, Employer Partnerships', city: 'Denver, CO', img: m('RB 1.jpg') },
  { name: 'Samuel Adams', role: 'Principal Recruiter, Finance & Admin', city: 'Columbus, OH', img: m('RB2.jpg') },
  { name: 'Kwame Mensah', role: 'Head of Talent, East', city: 'Charlotte, NC', img: m('RB3.jpg') },
  { name: 'Thomas Reed', role: 'Head of Payroll Operations', city: 'San Diego, CA', img: m('RB4.jpg') },
  { name: 'Hannah Weiss', role: 'General Counsel', city: 'Boston, MA', img: m('RB5.jpg') },
  { name: 'Linda Carter', role: 'Director, Candidate Experience', city: 'Dallas, TX', img: m('RB6.jpg') },
]
