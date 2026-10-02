import { Suspense, useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, PenSquare, ShieldCheck, Users, X } from 'lucide-react'
import Logo from '../components/Logo'
import { signOut, useSession } from '../portal/session'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Employees & approvals', icon: Users },
  { to: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { to: '/admin/content', label: 'Site content', icon: PenSquare },
]

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

  const out = async () => { await signOut(); navigate('/login', { replace: true }) }

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
          <button onClick={out} className="btn-ghost h-10 px-4 text-[14px]"><LogOut size={16} /> Sign out</button>
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
