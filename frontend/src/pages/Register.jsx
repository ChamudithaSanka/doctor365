import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const authBaseUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5000/auth'

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'patient',
  dateOfBirth: '',
  gender: '',
  phone: '',
  address: '',
  emergencyContact: '',
  medicalHistorySummary: '',
}

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialFormState)
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
      const response = await axios.post(`${authBaseUrl}/register`, formData)
      const { user, accessToken, refreshToken } = response.data.data

      localStorage.setItem('doctor365_accessToken', accessToken)
      localStorage.setItem('doctor365_refreshToken', refreshToken)
      localStorage.setItem('doctor365_user', JSON.stringify(user))

      navigate('/')
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const detailsMessage = Array.isArray(details) && details.length > 0
        ? ` (${details.map((item) => `${item.field}: ${item.message}`).join(', ')})`
        : ''

      setError(
        `${err?.response?.data?.error?.message ||
          'Unable to register right now. Please check the form and try again.'
        }${detailsMessage}`
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
              Create your account and start managing care online.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Register as a patient or doctor, then use the platform to book appointments, receive updates, and join consultations.
            </p>
          </div>

          <div className="grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              { value: 'Quick', label: 'Easy signup' },
              { value: 'Role-based', label: 'Patient / Doctor' },
              { value: 'Secure', label: 'JWT auth' },
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">Get started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Create your Doctor365 account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fill in your details to register and continue into the platform.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

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
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                  Register as
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              {formData.role === 'patient' ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">
                        Date of birth
                      </label>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-slate-700">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="07XXXXXXXX"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="emergencyContact" className="block text-sm font-medium text-slate-700">
                        Emergency contact
                      </label>
                      <input
                        id="emergencyContact"
                        name="emergencyContact"
                        type="tel"
                        placeholder="07XXXXXXXX"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Street, city"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalHistorySummary" className="block text-sm font-medium text-slate-700">
                      Medical history summary (optional)
                    </label>
                    <textarea
                      id="medicalHistorySummary"
                      name="medicalHistorySummary"
                      rows={3}
                      placeholder="Any important conditions or notes"
                      value={formData.medicalHistorySummary}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-100">
              Your account will be registered through the auth service endpoint.
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-700 transition hover:text-blue-800">
                Sign in instead
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
