import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

const navigationByRole = {
  patient: [
    { label: 'Dashboard', to: '/patient/dashboard' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Appointments', to: '/appointments' },
    { label: 'Payments', to: '/payments' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Profile', to: '/profile' },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard' },
    { label: 'Appointments', to: '/doctor/appointments' },
    { label: 'Consultations', to: '/consultation' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Profile', to: '/profile' },
  ],
  admin: [
    { label: 'Doctor setup', to: '/admin/doctors' },
  ],
}

function readAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('doctor365_user') || 'null')
  } catch {
    return null
  }
}

export default function AppShell() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(readAuthUser())

  const role = user?.role || 'patient'
  const navigation = useMemo(() => navigationByRole[role] || navigationByRole.patient, [role])

  useEffect(() => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const syncAuthState = () => setUser(readAuthUser())
    syncAuthState()
    window.addEventListener('storage', syncAuthState)

    return () => window.removeEventListener('storage', syncAuthState)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('doctor365_accessToken')
    localStorage.removeItem('doctor365_refreshToken')
    localStorage.removeItem('doctor365_user')
    setMobileOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <Link to="/" className="block">
            <p className="text-lg font-semibold tracking-tight text-blue-700">Doctor365</p>
            <p className="text-sm text-slate-500">{role === 'doctor' ? 'Doctor workspace' : role === 'admin' ? 'Admin workspace' : 'Patient workspace'}</p>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/40" aria-label="Close menu overlay" onClick={() => setMobileOpen(false)} />

          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <Link to="/" className="block" onClick={() => setMobileOpen(false)}>
                <p className="text-lg font-semibold tracking-tight text-blue-700">Doctor365</p>
                <p className="text-xs text-slate-500">{role === 'doctor' ? 'Doctor workspace' : role === 'admin' ? 'Admin workspace' : 'Patient workspace'}</p>
              </Link>
              <button type="button" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600" onClick={() => setMobileOpen(false)}>
                Close
              </button>
            </div>

            <nav className="space-y-2 px-4 py-5">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition',
                      isActive ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                ☰
              </button>

              <div>
                <p className="text-sm font-semibold text-slate-900">Workspace</p>
                <p className="text-xs text-slate-500">Responsive shell layout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NavLink
                to="/notifications"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Notifications
              </NavLink>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}