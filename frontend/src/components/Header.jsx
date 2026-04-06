import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Doctors', href: '#doctors' },
  { label: 'How it works', href: '#how-it-works' },
]

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link to="/" className="group">
          <p className="text-lg font-semibold tracking-tight text-blue-700 transition group-hover:text-blue-800">Doctor365</p>
          <p className="text-sm text-slate-500">Smart healthcare appointments and telemedicine</p>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-blue-700">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NavLink
            to="/login"
            className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            Login
          </NavLink>
          <NavLink
            to="/login"
            className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Sign up
          </NavLink>
        </div>
      </div>
    </header>
  )
}