import { Suspense, useCallback, useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, Bell, CalendarDays, FolderOpen,ClipboardList, Clock, Truck,ExternalLink, HeartPulse, Landmark, LayoutDashboard, LogOut, Menu, ShieldCheck, Target, Users, Wallet, X } from 'lucide-react'
import Logo from '../components/Logo'
import { api } from '../lib/api'
import { signOut, useSession } from '../portal/session'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Employees & approvals', icon: Users },
  { to: '/admin/missions', label: 'Missions & instructions', icon: Target },
  { to: '/admin/pay', label: 'Pay stubs', icon: Wallet },
  { to: '/admin/taxes', label: 'Tax forms', icon: Landmark },
  { to: '/admin/time', label: 'Timesheets', icon: Clock },
  { to: '/admin/time-off', label: 'Time off', icon: CalendarDays },
  { to: '/admin/benefits', label: 'Benefits', icon: HeartPulse },
  { to: '/admin/identity', label: 'Identity', icon: BadgeCheck },
  { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
  { to: '/admin/requests', label: 'Employee requests', icon: ClipboardList },
  { to: '/admin/shipments', label: 'Shipments', icon: Truck },
]

const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Everything employees submit (timesheets, clock-ins, time off, W-4s, 401(k) changes) lands here. */
function Notifications() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ unread: 0, notifications: [] })
  const navigate = useNavigate()
  const load = useCallback(() => api('/admin/notifications').then(setData).catch(() => {}), [])
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id) }, [load])
  const readAll = async () => { await api('/admin/notifications/read', { method: 'POST', body: {} }).catch(() => {}); load() }
  const go = async (n) => {
    setOpen(false)
    if (!n.read) await api('/admin/notifications/read', { method: 'POST', body: { id: n.id } }).catch(() => {})
    load(); if (n.link) navigate(n.link)
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Notifications, ${data.unread} unread`} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate ring-1 ring-line hover:text-ink">
        <Bell size={18} strokeWidth={1.7} />
        {data.unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bridge-600 px-1 text-[11px] font-semibold text-white">{data.unread > 99 ? '99+' : data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-40px)] rounded-2xl bg-white shadow-xl ring-1 ring-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[14px] font-semibold">Notifications</p>
            {data.unread > 0 && <button onClick={readAll} className="text-[13px] text-bridge-700 hover:underline">Mark all as read</button>}
          </div>
          <ul className="max-h-[420px] overflow-y-auto p-2">
            {data.notifications.map((n) => (
              <li key={n.id}>
                <button onClick={() => go(n)} className={`flex w-full gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-paper ${n.read ? '' : 'bg-bridge-50/60'}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-bridge-600'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] text-ink"><strong className="font-medium">{n.name}</strong> · {n.text}</span>
                    <span className="block text-[12.5px] text-slate">{[n.type, n.meta, ago(n.at)].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              </li>
            ))}
            {!data.notifications.length && <li className="px-3 py-6 text-center text-[14px] text-slate">Nothing yet. Submissions from employees appear here.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-bridge-950 text-white">
      <div className="flex h-[72px] items-center px-6">
        <Link to="/admin" onClick={onNavigate} aria-label="Admin home"><Logo tone="light" size="sm" /></Link>
      </div>
      <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Admin</p>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} onClick={onNavigate}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${isActive ? 'bg-white/10 font-medium text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} strokeWidth={1.7} />{label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="mt-6 px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Shortcuts</p>
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/70 hover:bg-white/5 hover:text-white"><ExternalLink size={18} strokeWidth={1.7} />View website</a>
        <Link to="/portal" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/70 hover:bg-white/5 hover:text-white"><ShieldCheck size={18} strokeWidth={1.7} />Employee portal</Link>
      </nav>
    </div>
  )
}

export default function AdminLayout() {
  const session = useSession()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)
  useEffect(() => { setDrawer(false); window.scrollTo(0, 0) }, [pathname])

  if (session.loading) return <div className="grid min-h-screen place-items-center bg-paper"><span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-bridge-600" aria-label="Loading" /></div>
  if (!session.user) return <Navigate to="/login" replace state={{ next: pathname }} />
  if (session.user.role !== 'admin') return <Navigate to="/portal" replace />

  const out = async () => { await signOut(); navigate('/', { replace: true }) }

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block"><Sidebar /></aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-bridge-950/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close menu"><X size={20} /></button>
          </div>
        </div>
      )}
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-line bg-paper/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-line lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
            <p className="hidden text-[14px] text-slate sm:block">Signed in as <strong className="font-medium text-ink">{session.user.first} {session.user.last}</strong> · Administrator</p>
          </div>
          <div className="flex items-center gap-2">
            <Notifications />
            <button onClick={out} className="btn-ghost h-10 px-4 text-[14px]"><LogOut size={16} /> Sign out</button>
          </div>
        </header>
        <main id="main" className="px-5 py-8 sm:px-8 lg:py-10">
          <div className="mx-auto max-w-[1280px]">
            <Suspense fallback={<div className="h-[60vh]" />}><Outlet context={session.user} /></Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
