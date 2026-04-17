import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const authBaseUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5000/api/auth'

const getPostAuthPath = (user) => {
  if (user?.role === 'doctor') {
    return user?.isVerified === false ? '/doctor/pending-verification' : '/doctor/dashboard'
  }

  if (user?.role === 'admin') {
    return '/admin/dashboard'
  }

  return '/patient/dashboard'
}

const initialFormState = {
  role: 'patient',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  address: '',
  city: '',
  country: 'Sri Lanka',
  emergencyContact: '',
  specialization: '',
  licenseNumber: '',
  yearsOfExperience: '',
  consultationFee: '',
  hospitalOrClinic: '',
}

const formatSriLankanPhone = (phone) => {
  const trimmed = String(phone || '').trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('+94')) {
    return `+94${trimmed.slice(3).replace(/\D/g, '')}`
  }

  const digits = trimmed.replace(/\D/g, '')

  if (digits.startsWith('94')) {
    return `+${digits}`
  }

  if (digits.startsWith('0')) {
    return `+94${digits.slice(1)}`
  }

  return `+94${digits}`
}

const buildRegistrationPayload = (payload) => {
  const commonFields = {
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
  }

  if (payload.role === 'patient') {
    return {
      ...commonFields,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      phone: formatSriLankanPhone(payload.phone),
      address: payload.address,
      city: payload.city,
      country: 'Sri Lanka',
      emergencyContact: formatSriLankanPhone(payload.emergencyContact),
    }
  }

  return {
    ...commonFields,
    phone: formatSriLankanPhone(payload.phone),
    specialization: payload.specialization,
    licenseNumber: payload.licenseNumber,
    yearsOfExperience: payload.yearsOfExperience,
    consultationFee: payload.consultationFee,
    hospitalOrClinic: payload.hospitalOrClinic,
  }
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
      const response = await axios.post(`${authBaseUrl}/register`, buildRegistrationPayload(formData))
      const { user, accessToken, refreshToken } = response.data.data

      localStorage.setItem('doctor365_accessToken', accessToken)
      localStorage.setItem('doctor365_refreshToken', refreshToken)
      localStorage.setItem('doctor365_user', JSON.stringify(user))

      navigate(getPostAuthPath(user), { replace: true })
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 border-r border-purple-500/20">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight text-purple-400">
              Doctor365
            </Link>
            <h1 className="mt-16 max-w-xl text-5xl font-bold tracking-tight text-slate-100">
              Create your account and start managing care online.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              Register as a patient or doctor, then continue to your role workspace.
            </p>
          </div>

          <div className="grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              { value: 'Quick', label: 'Easy signup' },
              { value: 'Role-based', label: 'Patient and doctor' },
              { value: 'Secure', label: 'JWT auth' },
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300/80">Get started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">Create your Doctor365 account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Choose your role and fill in the required details.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                  Register as
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">
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
                    className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">
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
                    className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                  />
                </div>
              </div>

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
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                />
              </div>

              {formData.role === 'patient' ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-300">
                        Date of birth
                      </label>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-slate-300">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
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
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="emergencyContact" className="block text-sm font-medium text-slate-300">
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
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-300">
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Street, house number"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-300">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="e.g., Colombo, Kandy"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                    />
                  </div>

                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
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
                      className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="specialization" className="block text-sm font-medium text-slate-300">
                        Specialization
                      </label>
                      <input
                        id="specialization"
                        name="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-300">
                        License number
                      </label>
                      <input
                        id="licenseNumber"
                        name="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-slate-300">
                        Experience (years)
                      </label>
                      <input
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        type="number"
                        min="0"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="consultationFee" className="block text-sm font-medium text-slate-300">
                        Consultation fee
                      </label>
                      <input
                        id="consultationFee"
                        name="consultationFee"
                        type="number"
                        min="0"
                        value={formData.consultationFee}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="hospitalOrClinic" className="block text-sm font-medium text-slate-300">
                      Hospital / Clinic
                    </label>
                    <input
                      id="hospitalOrClinic"
                      name="hospitalOrClinic"
                      type="text"
                      value={formData.hospitalOrClinic}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
                    />
                  </div>

                  <div className="rounded-lg bg-purple-600/10 p-4 text-sm text-slate-300 ring-1 ring-purple-500/20 border border-purple-500/20 backdrop-blur-md">
                    Availability is configured after admin verification with default schedule: MON-FRI, 08:00-18:00, 30-minute slots.
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {error ? (
              <div className="mt-5 rounded-lg border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-300 backdrop-blur-md">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-lg bg-purple-600/10 p-4 text-sm text-slate-300 ring-1 ring-purple-500/20 border border-purple-500/20 backdrop-blur-md">
              Your account will be registered through the auth service endpoint.
            </div>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-purple-400 transition hover:text-purple-300">
                Sign in instead
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
