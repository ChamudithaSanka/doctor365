import { useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const initialFormState = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  specialization: '',
  licenseNumber: '',
  yearsOfExperience: '',
  consultationFee: '',
  hospitalOrClinic: 'Online',
  availabilityStartTime: '08:00',
  availabilityEndTime: '17:00',
  slotMinutes: '30',
  isVerified: true,
}

export default function AdminDoctors() {
  const [formData, setFormData] = useState(initialFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdDoctor, setCreatedDoctor] = useState(null)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setCreatedDoctor(null)

    const token = localStorage.getItem('doctor365_accessToken')

    if (!token) {
      setError('You must sign in as an admin first.')
      setLoading(false)
      return
    }

    try {
      const authHeaders = {
        Authorization: `Bearer ${token}`,
      }

      const authResponse = await axios.post(
        `${gatewayBaseUrl}/api/auth/admin/doctors`,
        {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        { headers: authHeaders }
      )

      const userId = authResponse.data?.data?.user?.id

      const doctorResponse = await axios.post(
        `${gatewayBaseUrl}/api/doctors/admin`,
        {
          userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          yearsOfExperience: Number(formData.yearsOfExperience),
          consultationFee: Number(formData.consultationFee),
          hospitalOrClinic: formData.hospitalOrClinic,
          availabilityStartTime: formData.availabilityStartTime,
          availabilityEndTime: formData.availabilityEndTime,
          slotMinutes: Number(formData.slotMinutes),
          isVerified: formData.isVerified,
        },
        { headers: authHeaders }
      )

      setCreatedDoctor(doctorResponse.data?.data || null)
      setSuccess('Doctor created successfully.')
      setFormData(initialFormState)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Unable to create doctor right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 to-blue-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Admin tools</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Create doctor account and profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          This page creates the auth user first, then links the doctor profile using the returned userId.
        </p>
      </section>

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="firstName">First name</label>
              <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="lastName">Last name</label>
              <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="specialization">Specialization</label>
              <input id="specialization" name="specialization" type="text" required value={formData.specialization} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="licenseNumber">License number</label>
              <input id="licenseNumber" name="licenseNumber" type="text" required value={formData.licenseNumber} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="yearsOfExperience">Years of experience</label>
              <input id="yearsOfExperience" name="yearsOfExperience" type="number" min="0" required value={formData.yearsOfExperience} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="consultationFee">Consultation fee</label>
              <input id="consultationFee" name="consultationFee" type="number" min="0" required value={formData.consultationFee} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="slotMinutes">Slot minutes</label>
              <input id="slotMinutes" name="slotMinutes" type="number" min="5" required value={formData.slotMinutes} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="hospitalOrClinic">Hospital / Clinic</label>
              <input id="hospitalOrClinic" name="hospitalOrClinic" type="text" value={formData.hospitalOrClinic} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="availabilityStartTime">Start time</label>
              <input id="availabilityStartTime" name="availabilityStartTime" type="time" required value={formData.availabilityStartTime} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="availabilityEndTime">End time</label>
              <input id="availabilityEndTime" name="availabilityEndTime" type="time" required value={formData.availabilityEndTime} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isVerified" checked={formData.isVerified} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-700" />
            Mark as verified
          </label>

          <button type="submit" disabled={loading} className="rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? 'Creating doctor...' : 'Create doctor'}
          </button>
        </form>
      </section>

      {createdDoctor ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Created doctor</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(createdDoctor, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  )
}