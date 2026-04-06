import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const authBaseUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5000/auth'

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    try {
      const response = await axios.post(`${authBaseUrl}/login`, formData)
      const { user, accessToken, refreshToken } = response.data.data

      localStorage.setItem('doctor365_accessToken', accessToken)
      localStorage.setItem('doctor365_refreshToken', refreshToken)
      localStorage.setItem('doctor365_user', JSON.stringify(user))

      navigate('/')
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.18),_transparent_35%)] lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight text-blue-700">
              Doctor365
            </Link>
            <h1 className="mt-16 max-w-xl text-5xl font-bold tracking-tight text-slate-950">
              Access your healthcare journey in one secure place.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Log in to book appointments, join consultations, view notifications, and manage your care flow with a clean blue and green experience.
            </p>
          </div>

          <div className="grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              { value: 'Secure', label: 'JWT auth' },
              { value: 'Fast', label: 'Simple login' },
              { value: 'Clean', label: 'White UI' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xl font-bold text-blue-700">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">Welcome back</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Log in to Doctor365</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use your registered email and password to continue.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                  Remember me
                </label>
                <a href="#" className="text-sm font-medium text-green-700 transition hover:text-green-800">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-100">
              Patients, doctors, and admins all use the same secure login flow.
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              New to Doctor365?{' '}
              <Link to="/" className="font-semibold text-blue-700 transition hover:text-blue-800">
                Go back home
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}