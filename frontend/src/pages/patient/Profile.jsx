import { useState } from 'react'
import { Link } from 'react-router-dom'

const user = {
  firstName: 'Kavya',
  lastName: 'Mendis',
  email: 'kavya.mendis@gmail.com',
  phone: '0771234567',
  dateOfBirth: '1992-04-15',
  gender: 'female',
  address: '42 Galle Road, Colombo 03',
  emergencyContact: '0779876543',
  bloodType: 'B+',
  allergies: 'Penicillin',
  avatar: 'KM',
}

export default function Profile() {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState(user)
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setEditMode(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const fields = [
    { label: 'First name', name: 'firstName', type: 'text' },
    { label: 'Last name', name: 'lastName', type: 'text' },
    { label: 'Email address', name: 'email', type: 'email' },
    { label: 'Phone', name: 'phone', type: 'tel' },
    { label: 'Date of birth', name: 'dateOfBirth', type: 'date' },
    { label: 'Address', name: 'address', type: 'text' },
    { label: 'Emergency contact', name: 'emergencyContact', type: 'tel' },
    { label: 'Blood type', name: 'bloodType', type: 'text' },
    { label: 'Allergies', name: 'allergies', type: 'text' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">My account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your personal information and preferences.</p>
        </div>

        {/* Avatar + Identity Card */}
        <div className="mb-6 rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
              {user.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
              <p className="mt-1 text-sm text-white/80">{formData.email}</p>
              <span className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                Patient
              </span>
            </div>
          </div>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            Profile updated successfully.
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Personal information</h3>
            {!editMode && (
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
                <div key={field.name} className={field.name === 'address' || field.name === 'allergies' ? 'sm:col-span-2' : ''}>
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
                      {formData[field.name] || '—'}
                    </p>
                  )}
                </div>
              ))}

              {/* Gender (select in edit mode) */}
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
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm capitalize text-slate-700">
                    {formData.gender || '—'}
                  </p>
                )}
              </div>
            </div>

            {editMode && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => { setEditMode(false); setFormData(user) }}
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
            { label: 'Reports', desc: 'Download or view lab reports', href: '/patient/reports', color: 'green' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <p className={`text-sm font-semibold ${item.color === 'blue' ? 'text-blue-700' : 'text-green-700'}`}>{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}