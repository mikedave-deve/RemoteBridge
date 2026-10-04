import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, Bell, CalendarDays, ChevronDown, ClipboardCheck, Clock, ConciergeBell, FolderOpen, HeartPulse, History,
  Landmark, LayoutDashboard, LifeBuoy, LogOut, Menu, Package, ShieldCheck, Target, UserRound, Wallet, X,
} from 'lucide-react'
import Logo from '../components/Logo'
import { announcements, employee, tasks } from '../data/portal'
import { signOut, useSession } from './session'

const longDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '')

// The signed-in person's real details (set by an admin). Nothing from the demo profile is shown.
function applyUser(u) {
  const p = u.profile || {}, me = u.personal || {}
  Object.assign(employee, {
    id: u.employeeId || 'Being assigned', first: u.first, last: u.last, preferred: me.preferred || u.first, email: u.email, phone: u.phone || '',
    personal: me, dob: me.dob || '', ssnLast4: me.ssnLast4 || '',
    title: p.title || 'Position not assigned yet', department: p.department || 'Department not assigned yet', client: p.client || '',
    manager: p.manager || 'Not assigned yet', type: p.employmentType || 'Not set yet', startDate: p.startDate || longDate(u.approvedAt || u.joinedAt),
    workCity: p.workCity || '', workState: p.workState || '', photo: u.photo || '', joinedAt: u.joinedAt, address: p.address ? [p.address] : [],
    hasPosition: !!p.title, hasDepartment: !!p.department,
  })
}

/** Call after the server returns an updated user, so the header, avatar and every page show the change at once. */
export const updateUser = (user) => window.dispatchEvent(new CustomEvent('prb:user', { detail: user }))

/** Profile picture, or a neutral person icon when there is none. */
export function Avatar({ className = 'h-8 w-8 rounded-lg', icon = 16 }) {
  return employee.photo
    ? <img src={employee.photo} alt="" className={`${className} object-cover`} />
    : <span className={`${className} grid shrink-0 place-items-center bg-bridge-50 text-bridge-700`} aria-hidden="true"><UserRound size={icon} strokeWidth={1.7} /></span>
}

const nav = [
  { group: 'Overview', items: [
    { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/portal/missions', label: 'Missions & instructions', icon: Target },
    { to: '/portal/activity', label: 'Activity history', icon: History },
  ] },
  { group: 'Pay & time', items: [
    { to: '/portal/pay', label: 'Pay', icon: Wallet },
    { to: '/portal/taxes', label: 'Tax forms', icon: Landmark },
    { to: '/portal/time', label: 'Timesheet', icon: Clock },
    { to: '/portal/time-off', label: 'Time off', icon: CalendarDays },
  ] },
  { group: 'Benefits & services', items: [
    { to: '/portal/benefits', label: 'Benefits', icon: HeartPulse },
    { to: '/portal/services', label: 'Company services', icon: ConciergeBell },
    { to: '/portal/equipment', label: 'Equipment & logistics', icon: Package },
  ] },
  { group: 'Account', items: [
    { to: '/portal/setup', label: 'Information setup', icon: ClipboardCheck },
    { to: '/portal/identity', label: 'Identity verification', icon: BadgeCheck },
    { to: '/portal/documents', label: 'Documents', icon: FolderOpen },
    { to: '/portal/profile', label: 'Profile & security', icon: UserRound },
    { to: '/portal/help', label: 'Help & HR', icon: LifeBuoy },
  ] },
]

const IDLE_MS = 15 * 60 * 1000
const WARN_MS = 60 * 1000

function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-bridge-950 text-white">
      <div className="flex h-[72px] items-center px-6">
        <Link to="/portal" onClick={onNavigate} aria-label="Employee portal home"><Logo tone="light" size="sm" /></Link>
      </div>
      <nav aria-label="Portal" className="flex-1 overflow-y-auto px-3">
        {nav.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{group}</p>
            <ul className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} onClick={onNavigate}
                    className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] transition-colors ${isActive ? 'bg-white/10 font-medium text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                    <Icon size={17} strokeWidth={1.7} />{label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="flex items-center gap-2 border-t border-white/10 px-6 py-3.5 text-[12.5px] text-white/55">
        <ShieldCheck size={14} className="shrink-0" /> Secure session · auto sign-out after 15 min idle
      </p>
    </div>
  )
}

export default function PortalLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const [warn, setWarn] = useState(0)
  const timers = useRef({})

  const session = useSession()
  const [fresh, setFresh] = useState(null)
  useEffect(() => {
    const on = (e) => setFresh(e.detail)
    window.addEventListener('prb:user', on)
    return () => window.removeEventListener('prb:user', on)
  }, [])
  const leave = useCallback(async (reason) => {
    await signOut()
    if (reason === 'signout') navigate('/', { replace: true })
    else navigate('/login', { replace: true, state: { reason } })
  }, [navigate])

  // Idle timeout: warn one minute before signing out.
  const reset = useCallback(() => {
    clearTimeout(timers.current.warn); clearTimeout(timers.current.out); clearInterval(timers.current.tick)
    setWarn(0)
    timers.current.warn = setTimeout(() => {
      let s = WARN_MS / 1000
      setWarn(s)
      timers.current.tick = setInterval(() => { s -= 1; setWarn(s) }, 1000)
    }, IDLE_MS - WARN_MS)
    timers.current.out = setTimeout(() => leave('timeout'), IDLE_MS)
  }, [leave])

  useEffect(() => {
    reset()
    const evts = ['pointerdown', 'keydown', 'scroll']
    const onAct = () => { if (!timers.current.warning) reset() }
    evts.forEach((e) => window.addEventListener(e, onAct, { passive: true }))
    const t = timers.current
    return () => { evts.forEach((e) => window.removeEventListener(e, onAct)); clearTimeout(t.warn); clearTimeout(t.out); clearInterval(t.tick) }
  }, [reset])
  useEffect(() => { timers.current.warning = warn > 0 }, [warn])

  useEffect(() => { setDrawer(false); setMenu(false); setBell(false); window.scrollTo(0, 0) }, [pathname])

  if (session.loading) return <div className="grid min-h-screen place-items-center bg-paper"><span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-bridge-600" aria-label="Loading" /></div>
  if (!session.user) return <Navigate to="/login" replace state={{ next: pathname }} />
  applyUser(fresh || session.user)

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block print:hidden"><Sidebar /></aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Portal menu">
          <div className="absolute inset-0 bg-bridge-950/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close menu"><X size={20} /></button>
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-line bg-paper/95 px-5 backdrop-blur sm:px-8 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-line lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
            <p className="hidden text-[14px] text-slate sm:block">{[employee.hasPosition && employee.title, employee.hasDepartment && employee.department, `ID ${employee.id}`].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => { setBell(!bell); setMenu(false) }} aria-expanded={bell} aria-label={`Notifications, ${tasks.filter((t) => t.urgent).length} need attention`}
                className="relative grid h-10 w-10 place-items-center rounded-xl text-slate ring-1 ring-line hover:text-ink">
                <Bell size={18} strokeWidth={1.7} />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bridge-600 px-1 text-[11px] font-semibold text-white">{tasks.filter((t) => t.urgent).length}</span>
              </button>
              {bell && (
                <div className="absolute right-0 top-12 w-[320px] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-line">
                  {[...tasks.filter((t) => t.urgent).map((t) => ({ title: t.label, to: t.to })), ...announcements.slice(0, 2).map((a) => ({ title: a.title, to: '/portal' }))].map((n) => (
                    <Link key={n.title} to={n.to} className="block rounded-xl px-3 py-2.5 text-[14px] text-ink hover:bg-paper">{n.title}</Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setMenu(!menu); setBell(false) }} aria-expanded={menu} className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2.5 ring-1 ring-line hover:bg-white">
                <Avatar />
                <span className="hidden text-[14px] font-medium sm:block">{employee.preferred} {employee.last}</span>
                <ChevronDown size={16} className="text-slate" />
              </button>
              {menu && (
                <div className="absolute right-0 top-12 w-[220px] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-line">
                  <Link to="/portal/profile" className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-paper">Profile & security</Link>
                  <Link to="/" className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-paper">PremierRemoteBridge website</Link>
                  <button onClick={() => leave('signout')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] text-red-700 hover:bg-red-50"><LogOut size={16} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main" className="px-5 py-8 sm:px-8 lg:py-10">
          <div className="mx-auto max-w-[1280px]">
            <Suspense fallback={<div className="h-[60vh]" />}><Outlet /></Suspense>
          </div>
        </main>
      </div>

      {warn > 0 && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-bridge-950/50 p-5" role="alertdialog" aria-modal="true" aria-labelledby="idle-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h2 id="idle-title" className="text-[26px]">Are you still there?</h2>
            <p className="mt-3 text-slate">For your security, you will be signed out in <strong className="text-ink">{warn} seconds</strong> because of inactivity.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={reset} className="btn-primary">Stay signed in</button>
              <button onClick={() => leave('signout')} className="btn-ghost">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
