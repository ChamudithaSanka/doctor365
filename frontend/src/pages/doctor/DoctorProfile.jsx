import { useEffect, useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const doctorData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialty: '',
  qualifications: '',
  experience: '',
  hospital: '',
  bio: '',
  consultationFee: '',
  avatar: '',
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const initialSlots = {
  Monday: { enabled: true, start: '09:00', end: '17:00' },
  Tuesday: { enabled: true, start: '09:00', end: '17:00' },
  Wednesday: { enabled: true, start: '09:00', end: '17:00' },
  Thursday: { enabled: true, start: '09:00', end: '17:00' },
  Friday: { enabled: true, start: '09:00', end: '17:00' },
  Saturday: { enabled: false, start: '09:00', end: '12:00' },
  Sunday: { enabled: false, start: '09:00', end: '12:00' },
}

export default function DoctorProfile() {
  const [profileEdit, setProfileEdit] = useState(false)
  const [formData, setFormData] = useState(doctorData)
  const [savedFormData, setSavedFormData] = useState(doctorData)
  const [slots, setSlots] = useState(initialSlots)
  const [profileSaved, setProfileSaved] = useState(false)
  const [availSaved, setAvailSaved] = useState(false)
  const [slotMinutes, setSlotMinutes] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('doctor365_accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.get(`${gatewayBaseUrl}/api/doctors/me`, {
          headers,
          signal: controller.signal,
        })

        const doc = response.data?.data || null
        if (doc) {
          const nextFormData = {
            firstName: doc.firstName || '',
            lastName: doc.lastName || '',
            email: doc.email || '',
            phone: doc.phone || doc.phoneNumber || '',
            specialty: doc.specialization || '',
            qualifications: Array.isArray(doc.qualifications)
              ? doc.qualifications.join(', ')
              : (doc.qualifications || ''),
            experience: doc.yearsOfExperience ? String(doc.yearsOfExperience) : '',
            hospital: doc.hospitalOrClinic || '',
            bio: doc.bio || '',
            consultationFee: doc.consultationFee ? String(doc.consultationFee) : '',
            avatar: (doc.firstName ? doc.firstName[0] : '') + (doc.lastName ? doc.lastName[0] : ''),
          }

          setFormData(nextFormData)
          setSavedFormData(nextFormData)

          // map global availability to per-day slots (weekdays enabled)
          const mapped = { ...initialSlots }
          Object.keys(mapped).forEach((day) => {
            mapped[day].start = doc.availabilityStartTime || mapped[day].start
            mapped[day].end = doc.availabilityEndTime || mapped[day].end
            // enable weekdays by default
            if (['Saturday', 'Sunday'].includes(day)) mapped[day].enabled = !!mapped[day].enabled
            else mapped[day].enabled = Boolean(doc.availabilityStartTime && doc.availabilityEndTime)
          })
          setSlots(mapped)
          setSlotMinutes(doc.slotMinutes || 30)
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError('Unable to load your profile.')
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

  const handleSlotToggle = (day) => {
    setSlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }

  const handleSlotTime = (day, field, value) => {
    setSlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileSaved(false)

    try {
      const token = localStorage.getItem('doctor365_accessToken')
      if (!token) throw new Error('No auth token')

      // derive global availability from first enabled day
      const enabledDay = Object.keys(slots).find((d) => slots[d].enabled)
      const availabilityStartTime = enabledDay ? slots[enabledDay].start : ''
      const availabilityEndTime = enabledDay ? slots[enabledDay].end : ''

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        specialization: formData.specialty,
        hospitalOrClinic: formData.hospital,
        consultationFee: Number(formData.consultationFee) || 0,
        yearsOfExperience: Number(formData.experience) || 0,
        availabilityStartTime,
        availabilityEndTime,
        slotMinutes: Number(slotMinutes) || 30,
      }

      await axios.put(`${gatewayBaseUrl}/api/doctors/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSavedFormData((prev) => ({
        ...prev,
        ...formData,
        avatar: (formData.firstName ? formData.firstName[0] : '') + (formData.lastName ? formData.lastName[0] : ''),
      }))
      setProfileSaved(true)
      setProfileEdit(false)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      setError('Unable to save profile. Make sure you are signed in as a doctor.')
    }
  }

  const handleAvailSave = async () => {
    try {
      const token = localStorage.getItem('doctor365_accessToken')
      if (!token) return

      // Build workingDays array from toggle state (use 3-letter codes)
      const dayCodeMap = {
        Monday: 'MON',
        Tuesday: 'TUE',
        Wednesday: 'WED',
        Thursday: 'THU',
        Friday: 'FRI',
        Saturday: 'SAT',
        Sunday: 'SUN',
      }
      const workingDays = Object.keys(slots)
        .filter((d) => slots[d].enabled)
        .map((d) => dayCodeMap[d])

      // Use the first enabled day to derive global availability times
      const enabledDay = Object.keys(slots).find((d) => slots[d].enabled)
      const availabilityStartTime = enabledDay ? slots[enabledDay].start : '08:00'
      const availabilityEndTime = enabledDay ? slots[enabledDay].end : '18:00'

      await axios.put(
        `${gatewayBaseUrl}/api/doctors/me`,
        { workingDays, availabilityStartTime, availabilityEndTime, slotMinutes: Number(slotMinutes) || 30 },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setAvailSaved(true)
      setTimeout(() => setAvailSaved(false), 3000)
    } catch (err) {
      setError('Unable to save availability. Make sure you are signed in as a doctor.')
    }
  }

  const profileFields = [
    { label: 'First name', name: 'firstName', type: 'text' },
    { label: 'Last name', name: 'lastName', type: 'text' },
    { label: 'Email', name: 'email', type: 'email' },
    { label: 'Phone', name: 'phone', type: 'tel' },
    { label: 'Specialty', name: 'specialty', type: 'text' },
    { label: 'Qualifications', name: 'qualifications', type: 'text' },
    { label: 'Experience', name: 'experience', type: 'text' },
    { label: 'Hospital / Clinic', name: 'hospital', type: 'text' },
    { label: 'Consultation fee', name: 'consultationFee', type: 'text' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Doctor portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Profile & Availability</h1>
          <p className="mt-1 text-sm text-slate-500">Update your professional info and manage your weekly schedule.</p>
        </div>

        {/* Hero banner */}
        <div className="mb-6 rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
              {formData.avatar || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Dr. {formData.firstName} {formData.lastName}</h2>
              <p className="mt-1 text-sm text-white/80">{formData.specialty} · {formData.hospital}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {formData.qualifications}
                </span>
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {formData.experience}
                </span>
              </div>
            </div>
          </div>
        </div>

        {profileSaved && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            Profile updated successfully.
          </div>
        )}

        {/* Profile form */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Professional information</h3>
            {!profileEdit && (
              <button
                type="button"
                onClick={() => setProfileEdit(true)}
                className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="grid gap-5 sm:grid-cols-2">
              {profileFields.map((f) => (
                <div key={f.name}>
                  <label htmlFor={f.name} className="block text-sm font-medium text-slate-700">{f.label}</label>
                  {profileEdit ? (
                    <input
                      id={f.name}
                      name={f.name}
                      type={f.type}
                      value={formData[f.name]}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {formData[f.name] || '—'}
                    </p>
                  )}
                </div>
              ))}

              <div className="sm:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700">Bio</label>
                {profileEdit ? (
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                ) : (
                  <p className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {formData.bio}
                  </p>
                )}
              </div>
            </div>

            {profileEdit && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="submit" className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
                  Save changes
                </button>
                <button type="button" onClick={() => { setProfileEdit(false); setFormData(savedFormData) }} className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Availability manager */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weekly availability</h3>
              <p className="mt-1 text-sm text-slate-500">Set the days and hours you're available for appointments.</p>
            </div>
          </div>

          {availSaved && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              Availability saved successfully.
            </div>
          )}

          <div className="space-y-3">
            {days.map((day) => {
              const slot = slots[day]
              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-4 transition ${
                    slot.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleSlotToggle(day)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        slot.enabled ? 'bg-blue-700' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          slot.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <span className={`w-24 text-sm font-semibold ${slot.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                      {day}
                    </span>

                    {slot.enabled ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleSlotTime(day, 'start', e.target.value)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        <span className="text-sm text-slate-400">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleSlotTime(day, 'end', e.target.value)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Unavailable</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleAvailSave}
            className="mt-6 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Save availability
          </button>
        </div>

      </div>
    </div>
  )
}