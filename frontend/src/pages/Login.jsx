import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

const authBaseUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5000/api/auth'

const getPostAuthPath = (user) => {
  if (user?.role === 'admin') {
    return '/admin/dashboard'
  }

  if (user?.role === 'doctor') {
    return user?.isVerified === false ? '/doctor/pending-verification' : '/doctor/dashboard'
  }

  return '/patient/dashboard'
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [accountDisabled, setAccountDisabled] = useState(false)

  useEffect(() => {
    // Check if redirected due to expired token or disabled account
    if (searchParams.get('expired') === 'true') {
      setSessionExpired(true)
      // Clear old token
      localStorage.removeItem('doctor365_accessToken')
      localStorage.removeItem('doctor365_refreshToken')
    }
    if (searchParams.get('disabled') === 'true') {
      setAccountDisabled(true)
      // Clear old token
      localStorage.removeItem('doctor365_accessToken')
      localStorage.removeItem('doctor365_refreshToken')
    }
  }, [searchParams])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSessionExpired(false)

    try {
      const response = await axios.post(`${authBaseUrl}/login`, formData)
      const { user, accessToken, refreshToken } = response.data.data

      localStorage.setItem('doctor365_accessToken', accessToken)
      localStorage.setItem('doctor365_refreshToken', refreshToken)
      localStorage.setItem('doctor365_user', JSON.stringify(user))

      navigate(getPostAuthPath(user), { replace: true })
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          'Unable to log in right now. Please check your credentials and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 border-r border-purple-500/20">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight text-purple-400">
              Doctor365
            </Link>
            <h1 className="mt-16 max-w-xl text-5xl font-bold tracking-tight text-slate-100">
              Access your healthcare journey in one secure place.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              Log in to book appointments, join consultations, view notifications, and manage your care flow with a secure dark experience.
            </p>
          </div>

          <div className="grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              { value: 'Secure', label: 'JWT auth' },
              { value: 'Fast', label: 'Simple login' },
              { value: 'Dark', label: 'Glasmorphic UI' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 shadow-sm backdrop-blur-md">
                <p className="text-xl font-bold text-purple-300">{item.value}</p>
                <p className="mt-1 text-sm text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 shadow-lg backdrop-blur-md">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300/80">Welcome back</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">Log in to Doctor365</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use your registered email and password to continue.
              </p>
            </div>

            {sessionExpired && (
              <div className="mt-6 rounded-lg border border-amber-600/30 bg-amber-600/10 p-4 text-sm text-amber-300 ring-1 ring-amber-600/30 backdrop-blur-md">
                <p className="font-semibold">Session Expired</p>
                <p className="mt-1">Your session has expired. Please log in again to continue.</p>
              </div>
            )}

            {accountDisabled && (
              <div className="mt-6 rounded-lg border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-300 ring-1 ring-rose-600/30 backdrop-blur-md">
                <p className="font-semibold">Account Disabled</p>
                <p className="mt-1">Your account has been disabled. Please contact support for more information.</p>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-800/30 text-purple-600 focus:ring-purple-500" />
                  Remember me
                </label>
                <a href="#" className="text-sm font-medium text-purple-400 transition hover:text-purple-300">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {error ? (
              <div className="mt-5 rounded-lg border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-300 backdrop-blur-md">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-lg bg-purple-600/10 p-4 text-sm text-slate-300 ring-1 ring-purple-500/20 border border-purple-500/20 backdrop-blur-md">
              Patients, doctors, and admins all use the same secure login flow.
            </div>

            <p className="mt-6 text-center text-sm text-slate-400">
              New to Doctor365?{' '}
              <Link to="/register" className="font-semibold text-purple-400 transition hover:text-purple-300">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}