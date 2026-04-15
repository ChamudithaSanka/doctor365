import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const limitedDoctorPaths = ['/doctor/pending-verification', '/notifications', '/profile']

const navigationByRole = {
  patient: [
    { label: 'Dashboard', to: '/patient/dashboard' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Appointments', to: '/appointments' },
    { label: 'Prescriptions', to: '/patient/prescriptions' },
    { label: 'Payments', to: '/payments' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Profile', to: '/patient/profile' },
    { label: 'Reports', to: '/patient/reports' },
    { label: 'Medical history', to: '/patient/medical-history' },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard' },
    { label: 'Appointments', to: '/doctor/appointments' },
    { label: 'Reports', to: '/doctor/reports' },
    { label: 'Profile', to: '/doctor/profile' },
    { label: 'Consultations', to: '/consultation' },
    { label: 'Notifications', to: '/notifications' },
  ],
  doctorPending: [
    { label: 'Verification status', to: '/doctor/pending-verification' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Profile', to: '/profile' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Doctor verification', to: '/admin/doctor-verification' },
    { label: 'Appointments', to: '/admin/appointments' },
    { label: 'Transactions', to: '/admin/transactions' },
    { label: 'Notifications', to: '/admin/notifications' },
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
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(readAuthUser())
  const [verificationReady, setVerificationReady] = useState(false)
  const [doctorVerified, setDoctorVerified] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const role = user?.role || 'patient'
  const navigation = useMemo(() => {
    if (role === 'doctor' && verificationReady && !doctorVerified) {
      return navigationByRole.doctorPending
    }

    return navigationByRole[role] || navigationByRole.patient
  }, [role, verificationReady, doctorVerified])

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

  useEffect(() => {
    let isActive = true
    let intervalId = null

    const resolveDoctorVerification = async () => {
      if (role !== 'doctor') {
        if (!isActive) {
          return
        }

        setDoctorVerified(true)
        setVerificationReady(true)
        return
      }

      const token = localStorage.getItem('doctor365_accessToken')
      if (!token) {
        return
      }

      try {
        const response = await fetch(`${gatewayBaseUrl}/api/doctors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!isActive) {
          return
        }

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login', { replace: true })
          }
          setDoctorVerified(false)
          setVerificationReady(true)
          return
        }

        const data = await response.json()
        const profile = data?.data || {}
        const verified = Boolean(profile.isVerified)

        setDoctorVerified(verified)
        setVerificationReady(true)

        setUser((current) => {
          if (!current || current.role !== 'doctor') {
            return current
          }

          const nextUser = { ...current, isVerified: verified }
          localStorage.setItem('doctor365_user', JSON.stringify(nextUser))
          return nextUser
        })
      } catch {
        if (!isActive) {
          return
        }

        setDoctorVerified(false)
        setVerificationReady(true)
      }
    }

    resolveDoctorVerification()

    if (role === 'doctor') {
      intervalId = window.setInterval(resolveDoctorVerification, 15000)
      window.addEventListener('focus', resolveDoctorVerification)
    }

    return () => {
      isActive = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
      window.removeEventListener('focus', resolveDoctorVerification)
    }
  }, [navigate, role])

  useEffect(() => {
    if (role !== 'doctor' || !verificationReady || doctorVerified) {
      return
    }

    if (!limitedDoctorPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))) {
      navigate('/doctor/pending-verification', { replace: true })
    }
  }, [doctorVerified, location.pathname, navigate, role, verificationReady])

  useEffect(() => {
    if (role === 'doctor' && verificationReady && doctorVerified && location.pathname === '/doctor/pending-verification') {
      navigate('/doctor/dashboard', { replace: true })
    }
  }, [doctorVerified, location.pathname, navigate, role, verificationReady])

  useEffect(() => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      return
    }

    let isActive = true

    const loadUnreadCount = async () => {
      try {
        const response = await fetch(`${gatewayBaseUrl}/api/notifications/me?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!isActive) {
          return
        }

        if (response.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const items = Array.isArray(data?.data?.items) ? data.data.items : []
        const unread = items.filter((item) => item.status !== 'read').length
        setUnreadCount(unread)
      } catch {
        if (!isActive) {
          return
        }
      }
    }

    loadUnreadCount()

    const intervalId = window.setInterval(loadUnreadCount, 30000)
    window.addEventListener('focus', loadUnreadCount)
    window.addEventListener('doctor365:notifications-updated', loadUnreadCount)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', loadUnreadCount)
      window.removeEventListener('doctor365:notifications-updated', loadUnreadCount)
    }
  }, [navigate])

  if (role === 'doctor' && !verificationReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
            ...
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Checking verification status</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            We are confirming your doctor account status before loading the workspace.
          </p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('doctor365_accessToken')
    localStorage.removeItem('doctor365_refreshToken')
    localStorage.removeItem('doctor365_user')
    setMobileOpen(false)
    navigate('/', { replace: true })
  }

  const isDoctorsBookingPage = location.pathname.startsWith('/appointments/book')
  const notificationsPath = role === 'admin' ? '/admin/notifications' : '/notifications'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <Link to="/" className="block">
            <p className="text-lg font-semibold tracking-tight text-blue-700">Doctor365</p>
            <p className="text-sm text-slate-500">
              {role === 'doctor'
                ? doctorVerified
                  ? 'Doctor workspace'
                  : 'Verification pending'
                : role === 'admin'
                  ? 'Admin workspace'
                  : 'Patient workspace'}
            </p>
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
                  (isActive && !isDoctorsBookingPage) || (isDoctorsBookingPage && item.to === '/doctors')
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
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
                <p className="text-xs text-slate-500">
                  {role === 'doctor'
                    ? doctorVerified
                      ? 'Doctor workspace'
                      : 'Verification pending'
                    : role === 'admin'
                      ? 'Admin workspace'
                      : 'Patient workspace'}
                </p>
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
                      (isActive && !isDoctorsBookingPage) || (isDoctorsBookingPage && item.to === '/doctors')
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
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
                <p className="text-xs text-slate-500">{role === 'doctor' && !doctorVerified ? 'Limited access workspace' : 'Responsive shell layout'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NavLink
                to={notificationsPath}
                aria-label="Open notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.568 1.082 5.454 1.31m5.715 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />
                ) : null}
              </NavLink>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'}</p>
                  <p className="text-xs text-slate-500">
                    {role === 'doctor' && !doctorVerified ? 'doctor · pending verification' : role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {role !== 'doctor' || doctorVerified || limitedDoctorPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`)) ? (
              <Outlet />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}