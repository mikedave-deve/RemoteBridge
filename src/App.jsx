import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import SmoothScroll from './lib/SmoothScroll'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Transition from './components/Transition'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// The home page ships in the main bundle; every other page loads on demand.
const Jobs = lazy(() => import('./pages/Jobs'))
const JobDetail = lazy(() => import('./pages/JobDetail'))
const SubmitResume = lazy(() => import('./pages/SubmitResume'))
const About = lazy(() => import('./pages/About'))
const Team = lazy(() => import('./pages/Team'))
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Signup })))

// Employee portal: its own layout, loaded only when someone signs in.
const PortalLayout = lazy(() => import('./portal/PortalLayout'))
const portal = (name) => lazy(() => import(`./portal/pages/${name}.jsx`))
const P = { Dashboard: portal('Dashboard'), Pay: portal('Pay'), Taxes: portal('Taxes'), Timesheet: portal('Timesheet'), TimeOff: portal('TimeOff'), Benefits: portal('Benefits'), Documents: portal('Documents'), Profile: portal('Profile'), Help: portal('Help'),
  Missions: portal('Missions'), Activity: portal('Activity'), Setup: portal('Setup'), Identity: portal('Identity'), Equipment: portal('Equipment'), Services: portal('Services') }

// Admin portal: loaded only for admins.
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const admin = (name) => lazy(() => import(`./admin/pages/${name}.jsx`))
const A = {
  Overview: admin('Overview'), Users: admin('Users'), Missions: admin('Missions'), Pay: admin('Pay'), Taxes: admin('Taxes'),
  Time: admin('Time'), TimeOff: admin('TimeOff'), Benefits: admin('Benefits'), Requests: admin('Requests'), Shipments: admin('Shipments'),
  Identity: admin('Identity'), Documents: admin('Documents'),
}

// Warm the page chunks once the browser is idle so navigation stays instant.
const preload = () => Promise.all([import('./pages/Jobs'), import('./pages/JobDetail'), import('./pages/SubmitResume'), import('./pages/About'), import('./pages/Team'), import('./pages/Auth')])

function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500))
    idle(() => preload().catch(() => {}))
  }, [])
  const bare = pathname === '/login' || pathname === '/create-account'
  return (
    <SmoothScroll>
      {!bare && <Nav />}
      <main id="main">
        <Transition>
          <Suspense fallback={<div className="min-h-screen bg-paper" />}>
            <Outlet />
          </Suspense>
        </Transition>
      </main>
      {!bare && <Footer />}
    </SmoothScroll>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin" element={<Suspense fallback={<div className="min-h-screen bg-paper" />}><AdminLayout /></Suspense>}>
          <Route index element={<A.Overview />} />
          <Route path="users" element={<A.Users />} />
          <Route path="missions" element={<A.Missions />} />
          <Route path="pay" element={<A.Pay />} />
          <Route path="taxes" element={<A.Taxes />} />
          <Route path="time" element={<A.Time />} />
          <Route path="time-off" element={<A.TimeOff />} />
          <Route path="benefits" element={<A.Benefits />} />
          <Route path="requests" element={<A.Requests />} />
          <Route path="shipments" element={<A.Shipments />} />
          <Route path="identity" element={<A.Identity />} />
          <Route path="documents" element={<A.Documents />} />
        </Route>
        <Route path="portal" element={<Suspense fallback={<div className="min-h-screen bg-paper" />}><PortalLayout /></Suspense>}>
          <Route index element={<P.Dashboard />} />
          <Route path="missions" element={<P.Missions />} />
          <Route path="activity" element={<P.Activity />} />
          <Route path="setup" element={<P.Setup />} />
          <Route path="identity" element={<P.Identity />} />
          <Route path="equipment" element={<P.Equipment />} />
          <Route path="services" element={<P.Services />} />
          <Route path="pay" element={<P.Pay />} />
          <Route path="taxes" element={<P.Taxes />} />
          <Route path="time" element={<P.Timesheet />} />
          <Route path="time-off" element={<P.TimeOff />} />
          <Route path="benefits" element={<P.Benefits />} />
          <Route path="documents" element={<P.Documents />} />
          <Route path="profile" element={<P.Profile />} />
          <Route path="help" element={<P.Help />} />
        </Route>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="submit-resume" element={<SubmitResume />} />
          <Route path="about" element={<About />} />
          <Route path="team" element={<Team />} />
          <Route path="login" element={<Login />} />
          <Route path="create-account" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
