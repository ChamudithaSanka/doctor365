import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const getToken = () => localStorage.getItem('doctor365_accessToken')

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  city: '',
  emergencyContact: '',
  medicalHistorySummary: '',
}

export default function Profile() {
  const [formData, setFormData] = useState(emptyForm)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setError('You need to sign in to view your profile.')
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const loadProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await axios.get(`${gatewayBaseUrl}/api/patients/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const p = res.data?.data || {}
        setFormData({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: '',           // email lives in auth-service, not patient-service
          phone: p.phone || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          gender: p.gender || '',
          address: p.address || '',
          city: p.city || '',
          emergencyContact: p.emergencyContact || '',
          medicalHistorySummary: p.medicalHistorySummary || '',
        })
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err?.response?.data?.error?.message || 'Unable to load your profile.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const token = getToken()
    if (!token) return

    setSaving(true)
    setError('')
    try {
      await axios.put(
        `${gatewayBaseUrl}/api/patients/me`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address,
          city: formData.city,
          emergencyContact: formData.emergencyContact,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSaved(true)
      setEditMode(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Unable to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const initials =
    (formData.firstName?.[0] || '') + (formData.lastName?.[0] || '') || '?'

  const fields = [
    { label: 'First name', name: 'firstName', type: 'text' },
    { label: 'Last name', name: 'lastName', type: 'text' },
    { label: 'Phone', name: 'phone', type: 'tel' },
    { label: 'Date of birth', name: 'dateOfBirth', type: 'date' },
    { label: 'Address', name: 'address', type: 'text', span: true },
    { label: 'City', name: 'city', type: 'text' },
    { label: 'Emergency contact', name: 'emergencyContact', type: 'tel' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">My account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Profile</h1>
          <p className="mt-1 text-sm text-slate-300">
            Your personal information — loaded from and saved to the patient database.
          </p>
        </div>

        {/* Avatar + Identity Card */}
        <div className="mb-6 rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-950 to-blue-950 p-6 backdrop-blur-md shadow-lg sm:p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-purple-600/30 text-2xl font-bold text-purple-300 ring-2 ring-purple-500/30">
              {loading ? '…' : initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                {loading ? 'Loading…' : `${formData.firstName} ${formData.lastName}`.trim() || 'Patient'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{formData.phone || 'Phone not set'}</p>
              <span className="mt-2 inline-flex items-center rounded-full bg-purple-600/30 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                Patient
              </span>
            </div>
          </div>
        </div>

        {/* Success / Error */}
        {saved && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-600/10 p-4 text-sm font-medium text-green-300 backdrop-blur-md">
            ✓ Profile updated successfully and saved to the database.
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-600/10 p-4 text-sm text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Personal information</h3>
            {!editMode && !loading && (
              <button
                onClick={() => setEditMode(true)}
                className="rounded-lg border border-purple-500/30 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-600/20"
              >
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave}>
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.span ? 'sm:col-span-2' : ''}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-slate-300">
                    {field.label}
                  </label>
                  {editMode ? (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-md"
                    />
                  ) : (
                    <p className="mt-2 rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-300 backdrop-blur-md">
                      {loading ? '…' : formData[field.name] || '—'}
                    </p>
                  )}
                </div>
              ))}

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-300">Gender</label>
                {editMode ? (
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-md"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <p className="mt-2 rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm capitalize text-slate-300 backdrop-blur-md">
                    {loading ? '…' : formData.gender || '—'}
                  </p>
                )}
              </div>

              {/* Medical history summary */}
              <div className="sm:col-span-2">
                <label htmlFor="medicalHistorySummary" className="block text-sm font-medium text-slate-300">
                  Medical history summary
                </label>
                <p className="mt-2 rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-300 whitespace-pre-wrap backdrop-blur-md">
                  {loading ? '…' : formData.medicalHistorySummary || '—'}
                </p>
              </div>
            </div>

            {editMode && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-700 hover:to-orange-600 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-lg border border-slate-600/30 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/30"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Medical history', desc: 'View your full health records', href: '/patient/medical-history', color: 'blue' },
            { label: 'Reports', desc: 'Upload or view your lab reports', href: '/patient/reports', color: 'green' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 shadow-sm transition hover:border-purple-500/40 hover:shadow-md backdrop-blur-md"
            >
              <p className={`text-sm font-semibold ${item.color === 'blue' ? 'text-purple-300' : 'text-purple-300'}`}>
                {item.label}
              </p>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}