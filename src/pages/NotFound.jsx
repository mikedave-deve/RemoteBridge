import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <section className="grid min-h-[80vh] place-items-center bg-paper px-5 pt-32 text-center">
      <div>
        <p className="font-display text-[clamp(96px,16vw,220px)] leading-none tracking-tightest text-bridge-200">404</p>
        <h1 className="mt-4 text-[40px]">This page has moved or never existed.</h1>
        <p className="mx-auto mt-4 max-w-md text-slate">Check the address, or head back to the homepage or the job board.</p>
        <div className="mt-8 flex justify-center gap-3"><Link to="/" className="btn-primary">Go to homepage</Link><Link to="/jobs" className="btn-ghost">Browse jobs</Link></div>
      </div>
    </section>
  )
}
