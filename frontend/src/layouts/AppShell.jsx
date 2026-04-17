import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import SymptomAnalyzerButton from '../components/SymptomAnalyzerButton'

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
    { label: 'Doctor verification', to: '/admin/doctor-verification' },
    { label: 'Appointments', to: '/admin/appointments' },
    {
      label: 'Manage Users',
      submenu: [
        { label: 'Patients', to: '/admin/manage-patients' },
        { label: 'Doctors', to: '/admin/manage-doctors' },
      ],
    },
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
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)

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

  // Check if user account is still active
  useEffect(() => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      return
    }

    let isActive = true
    let intervalId = null

    const checkAccountActive = async () => {
      try {
        let endpoint = ''
        if (role === 'patient') {
          endpoint = `${gatewayBaseUrl}/api/patients/me`
        } else if (role === 'doctor') {
          endpoint = `${gatewayBaseUrl}/api/doctors/me`
        }

        if (!endpoint) {
          return
        }

        const response = await fetch(endpoint, {
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

        if (response.status === 403) {
          // Account disabled
          localStorage.removeItem('doctor365_accessToken')
          localStorage.removeItem('doctor365_refreshToken')
          localStorage.removeItem('doctor365_user')
          navigate('/login?disabled=true', { replace: true })
          return
        }

        if (response.ok) {
          const data = await response.json()
          const accountActive = data?.data?.isActive !== false
          
          if (!accountActive) {
            localStorage.removeItem('doctor365_accessToken')
            localStorage.removeItem('doctor365_refreshToken')
            localStorage.removeItem('doctor365_user')
            navigate('/login?disabled=true', { replace: true })
          }
        }
      } catch (error) {
        console.warn('Could not verify account status:', error)
      }
    }

    // Check immediately and then periodically
    checkAccountActive()
    intervalId = window.setInterval(checkAccountActive, 30000)
    window.addEventListener('focus', checkAccountActive)

    return () => {
      isActive = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
      window.removeEventListener('focus', checkAccountActive)
    }
  }, [navigate, role])

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
    <div className="flex h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-slate-100">
      <aside className="hidden fixed inset-y-0 left-0 z-30 w-72 shrink-0 border-r border-purple-500/20 bg-slate-950/40 backdrop-blur-xl overflow-y-auto lg:flex lg:flex-col">
        <div className="border-b border-purple-500/20 px-6 py-6 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm">
          <Link to="/" className="block group">
            <img src="/logo.png" alt="Doctor365" className="h-10 w-auto transition group-hover:opacity-100 opacity-90" />
            <p className="text-xs text-purple-200 mt-2 font-medium opacity-80">
              {role === 'doctor'
                ? doctorVerified
                  ? '⚕️ Medical Professional'
                  : '⏳ Credential Review'
                : role === 'admin'
                  ? '🛡️ Administration'
                  : '👥 Care Portal'}
            </p>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation.map((item) => {
            if (item.submenu) {
              const isOpen = expandedSubmenu === item.label
              const hasActiveSubitem = item.submenu.some((subitem) => location.pathname === subitem.to || location.pathname.startsWith(`${subitem.to}/`))

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setExpandedSubmenu(isOpen ? null : item.label)}
                    className={[
                      'w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200',
                      hasActiveSubitem || isOpen
                        ? 'bg-purple-600/40 text-purple-100 backdrop-blur-md border border-purple-500/30'
                        : 'text-slate-300 hover:bg-slate-700/40 hover:text-purple-200 hover:backdrop-blur-sm',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>
                    <span className={`transition ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1 pl-3 border-l border-purple-500/20">
                      {item.submenu.map((subitem) => (
                        <NavLink
                          key={subitem.to}
                          to={subitem.to}
                          className={({ isActive }) =>
                            [
                              'flex items-center rounded-lg px-4 py-2 text-sm font-medium transition duration-200',
                              isActive
                                ? 'bg-indigo-600/50 text-indigo-100 backdrop-blur-md border border-indigo-500/40'
                                : 'text-slate-400 hover:bg-slate-700/30 hover:text-indigo-200',
                            ].join(' ')
                          }
                        >
                          {subitem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200',
                    (isActive && !isDoctorsBookingPage) || (isDoctorsBookingPage && item.to === '/doctors')
                      ? 'bg-purple-600/40 text-purple-100 backdrop-blur-md border border-purple-500/30'
                      : 'text-slate-300 hover:bg-slate-700/40 hover:text-purple-200 hover:backdrop-blur-sm',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-purple-500/20 bg-slate-900/40 backdrop-blur-sm p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-orange-500/40 bg-orange-600/10 hover:bg-orange-600/20 px-4 py-2.5 text-sm font-semibold text-orange-300 transition duration-200 hover:text-orange-200 hover:border-orange-500/60 backdrop-blur-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close menu overlay" onClick={() => setMobileOpen(false)} />

          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-slate-950/60 backdrop-blur-xl border-r border-purple-500/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm px-5 py-4">
              <Link to="/" className="block" onClick={() => setMobileOpen(false)}>
                <img src="/logo.png" alt="Doctor365" className="h-8 w-auto transition opacity-90 hover:opacity-100" />
                <p className="text-xs text-purple-200 mt-1 font-medium opacity-80">
                  {role === 'doctor'
                    ? doctorVerified
                      ? '⚕️ Professional'
                      : '⏳ Review'
                    : role === 'admin'
                      ? '🛡️ Admin'
                      : '👥 Care'}
                </p>
              </Link>
              <button type="button" className="rounded-full border border-purple-500/40 bg-slate-800/50 hover:bg-slate-800/70 px-3 py-2 text-sm font-semibold text-purple-300 transition backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                ✕
              </button>
            </div>

            <nav className="space-y-1 px-3 py-5">
              {navigation.map((item) => {
                if (item.submenu) {
                  const isOpen = expandedSubmenu === item.label
                  const hasActiveSubitem = item.submenu.some((subitem) => location.pathname === subitem.to || location.pathname.startsWith(`${subitem.to}/`))

                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() => setExpandedSubmenu(isOpen ? null : item.label)}
                        className={[
                          'w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200',
                          hasActiveSubitem || isOpen
                            ? 'bg-purple-600/40 text-purple-100 backdrop-blur-md border border-purple-500/30'
                            : 'text-slate-300 hover:bg-slate-700/40 hover:text-purple-200 hover:backdrop-blur-sm',
                        ].join(' ')}
                      >
                        <span>{item.label}</span>
                        <span className={`text-purple-300 transition ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {isOpen && (
                        <div className="mt-2 space-y-1 pl-3 border-l border-purple-500/20">
                          {item.submenu.map((subitem) => (
                            <NavLink
                              key={subitem.to}
                              to={subitem.to}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                [
                                  'flex items-center rounded-lg px-4 py-2 text-sm font-medium transition duration-200',
                                  isActive
                                    ? 'bg-indigo-600/50 text-indigo-100 backdrop-blur-md border border-indigo-500/40'
                                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-indigo-200',
                                ].join(' ')
                              }
                            >
                              {subitem.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      [
                        'flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200',
                        (isActive && !isDoctorsBookingPage) || (isDoctorsBookingPage && item.to === '/doctors')
                          ? 'bg-purple-600/40 text-purple-100 backdrop-blur-md border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-700/40 hover:text-purple-200 hover:backdrop-blur-sm',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            <div className="border-t border-purple-500/20 bg-slate-900/40 backdrop-blur-sm p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg border border-orange-500/40 bg-orange-600/10 hover:bg-orange-600/20 px-4 py-2.5 text-sm font-semibold text-orange-300 transition duration-200 hover:text-orange-200 hover:border-orange-500/60 backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col lg:ml-72">
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-purple-500/20 bg-slate-950/40 backdrop-blur-xl lg:left-72">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-purple-500/40 bg-slate-800/50 hover:bg-slate-800/70 px-3 py-2 text-sm font-semibold text-purple-300 transition backdrop-blur-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                ☰
              </button>

              <div>
                <p className="text-sm font-semibold text-slate-100">Workspace</p>
                <p className="text-xs text-purple-300/70">{role === 'doctor' && !doctorVerified ? 'Credential Review' : 'Professional Portal'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NavLink
                to={notificationsPath}
                aria-label="Open notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/40 bg-slate-800/50 text-purple-300 transition hover:border-purple-500/60 hover:bg-purple-600/20 hover:text-purple-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.568 1.082 5.454 1.31m5.715 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-slate-900" aria-hidden="true" />
                ) : null}
              </NavLink>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-sm font-semibold text-white">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'}</p>
                  <p className="text-xs text-purple-300/70">
                    {role === 'doctor' && !doctorVerified ? '⏳ Pending Verification' : `👤 ${role}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 mt-[73px]">
          <div className="mx-auto w-full max-w-7xl">
            {role !== 'doctor' || doctorVerified || limitedDoctorPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`)) ? (
              <Outlet />
            ) : null}
          </div>
        </main>

        {/* Floating AI Bot Button - Only for patients */}
        {role === 'patient' && <SymptomAnalyzerButton />}
      </div>
    </div>
  )
}