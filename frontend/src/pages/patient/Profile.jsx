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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">My account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your personal information — loaded from and saved to the patient database.
          </p>
        </div>

        {/* Avatar + Identity Card */}
        <div className="mb-6 rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
              {loading ? '…' : initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {loading ? 'Loading…' : `${formData.firstName} ${formData.lastName}`.trim() || 'Patient'}
              </h2>
              <p className="mt-1 text-sm text-white/80">{formData.phone || 'Phone not set'}</p>
              <span className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                Patient
              </span>
            </div>
          </div>
        </div>

        {/* Success / Error */}
        {saved && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            ✓ Profile updated successfully and saved to the database.
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Personal information</h3>
            {!editMode && !loading && (
              <button
                onClick={() => setEditMode(true)}
                className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave}>
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className={field.span ? 'sm:col-span-2' : ''}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  {editMode ? (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {loading ? '…' : formData[field.name] || '—'}
                    </p>
                  )}
                </div>
              ))}

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Gender</label>
                {editMode ? (
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm capitalize text-slate-700">
                    {loading ? '…' : formData.gender || '—'}
                  </p>
                )}
              </div>

              {/* Medical history summary */}
              <div className="sm:col-span-2">
                <label htmlFor="medicalHistorySummary" className="block text-sm font-medium text-slate-700">
                  Medical history summary
                </label>
                <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {loading ? '…' : formData.medicalHistorySummary || '—'}
                </p>
              </div>
            </div>

            {editMode && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <p className={`text-sm font-semibold ${item.color === 'blue' ? 'text-blue-700' : 'text-green-700'}`}>
                {item.label}
              </p>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}