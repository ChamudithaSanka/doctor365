import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Doctors', href: '#doctors' },
  { label: 'How it works', href: '#how-it-works' },
]

function getDashboardPath(user) {
  if (user?.role === 'doctor') {
    return user?.isVerified === false ? '/doctor/pending-verification' : '/doctor/dashboard'
  }

  if (user?.role === 'admin') {
    return '/admin/dashboard'
  }

  return '/patient/dashboard'
}

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dashboardPath, setDashboardPath] = useState('/patient/dashboard')

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem('doctor365_accessToken')
      const rawUser = localStorage.getItem('doctor365_user')

      if (!token || !rawUser) {
        setIsLoggedIn(false)
        setDashboardPath('/patient/dashboard')
        return
      }

      try {
        const user = JSON.parse(rawUser)
        setDashboardPath(getDashboardPath(user))

        setIsLoggedIn(true)
      } catch {
        setIsLoggedIn(false)
        setDashboardPath('/patient/dashboard')
      }
    }

    syncAuthState()
    window.addEventListener('storage', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  return (
    <header className="border-b border-purple-500/20 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link to="/" className="group">
          <img src="/logo.png" alt="Doctor365" className="h-12 w-auto transition opacity-90 group-hover:opacity-100" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-purple-300">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <NavLink
              to={dashboardPath}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition hover:scale-105"
            >
              Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-lg border border-purple-500/40 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:border-purple-500/60 hover:bg-slate-800/70 backdrop-blur-sm"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-orange-500/50 transition hover:scale-105"
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}