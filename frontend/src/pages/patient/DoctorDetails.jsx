import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const defaultWorkingDays = ['MON', 'TUE', 'WED', 'THU', 'FRI']

const formatWorkingDays = (workingDays) => {
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return defaultWorkingDays.join(', ')
  }

  return workingDays.join(', ')
}

const formatDaySchedule = (day, doctor) => {
  const workingDays = Array.isArray(doctor?.workingDays) && doctor.workingDays.length > 0 ? doctor.workingDays : defaultWorkingDays
  const isWorkingDay = workingDays.includes(day)

  if (!isWorkingDay) {
    return 'Unavailable'
  }

  const start = doctor?.availabilityStartTime || '08:00'
  const end = doctor?.availabilityEndTime || '18:00'
  const slot = doctor?.slotMinutes || 30

  return `${start} – ${end} (${slot} min slots)`
}

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (Number.isNaN(value)) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)
}

const computeNextAvailableSlot = (doctor, selectedDate) => {
  const workingDays = Array.isArray(doctor?.workingDays) && doctor.workingDays.length > 0
    ? doctor.workingDays
    : defaultWorkingDays

  const today = new Date()
  const baseDate = selectedDate ? new Date(selectedDate) : today
  if (Number.isNaN(baseDate.getTime())) {
    return null
  }

  const startMinutes = Number(doctor?.availabilityStartTime ? doctor.availabilityStartTime.split(':')[0] : 8) * 60 + Number(doctor?.availabilityStartTime ? doctor.availabilityStartTime.split(':')[1] : 0)
  const endMinutes = Number(doctor?.availabilityEndTime ? doctor.availabilityEndTime.split(':')[0] : 18) * 60 + Number(doctor?.availabilityEndTime ? doctor.availabilityEndTime.split(':')[1] : 0)
  const slotMinutes = Number(doctor?.slotMinutes || 30)

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || !Number.isFinite(slotMinutes) || slotMinutes <= 0) {
    return null
  }

  const findNextDate = (date) => {
    const candidate = new Date(date)
    const dayCode = weekdayLabels[candidate.getDay()]
    if (workingDays.includes(dayCode)) {
      return candidate
    }

    for (let i = 1; i <= 7; i += 1) {
      const next = new Date(candidate)
      next.setDate(candidate.getDate() + i)
      const nextDayCode = weekdayLabels[next.getDay()]
      if (workingDays.includes(nextDayCode)) {
        return next
      }
    }

    return null
  }

  const nextWorkingDate = findNextDate(baseDate)
  if (!nextWorkingDate) {
    return null
  }

  const now = new Date()
  const sameDay = nextWorkingDate.toDateString() === now.toDateString()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  let nextMinutes = startMinutes

  if (sameDay && currentMinutes > startMinutes) {
    nextMinutes = currentMinutes
  }

  while (nextMinutes <= currentMinutes && sameDay) {
    nextMinutes += slotMinutes
  }

  if (nextMinutes >= endMinutes) {
    return null
  }

  const hours = String(Math.floor(nextMinutes / 60)).padStart(2, '0')
  const minutes = String(nextMinutes % 60).padStart(2, '0')

  return {
    date: nextWorkingDate.toISOString().split('T')[0],
    time: `${hours}:${minutes}`,
  }
}

export default function DoctorDetails() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadDoctor = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/doctors/${id}`, {
          signal: controller.signal,
        })

        setDoctor(response.data?.data || null)
      } catch (requestError) {
        if (requestError.name === 'CanceledError') {
          return
        }

        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load doctor details right now. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadDoctor()
    }

    return () => controller.abort()
  }, [id])

  const fullName = useMemo(() => {
    if (!doctor) {
      return 'Doctor profile'
    }
    return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor profile'
  }, [doctor])

  const weeklySchedule = useMemo(
    () => weekdayLabels.map((day) => ({ day, schedule: formatDaySchedule(day, doctor) })),
    [doctor]
  )

  const nextSlot = computeNextAvailableSlot(doctor, null)

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading doctor details...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        <Link to="/doctors" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Back to doctors
        </Link>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Doctor profile not found.
        </div>
        <Link to="/doctors" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Back to doctors
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-cyan-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Doctor profile</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{fullName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Review profile details, consultation fee, and availability before booking.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {doctor.specialization || 'Specialty not listed'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {doctor.isVerified ? 'Verified doctor' : 'Pending verification'}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Consultation fee</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(doctor.consultationFee)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Experience</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{doctor.yearsOfExperience ?? 'N/A'} years</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Hospital / Clinic</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{doctor.hospitalOrClinic || 'Online'}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Weekly schedule</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {weeklySchedule.map((item) => (
                <div key={item.day} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.day}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.schedule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Availability</h2>
            <p className="mt-2 text-sm text-slate-500">
              {doctor.availabilityStartTime && doctor.availabilityEndTime
                ? `${doctor.availabilityStartTime} – ${doctor.availabilityEndTime}`
                : 'No availability set'}
            </p>
            <p className="mt-1 text-sm text-slate-500">Slot duration: {doctor.slotMinutes || 30} minutes</p>
            <p className="mt-1 text-sm text-slate-500">Working days: {formatWorkingDays(doctor.workingDays)}</p>
            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {nextSlot ? `Next available slot: ${nextSlot.date} at ${nextSlot.time}` : 'Next slot not available'}
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-semibold">Ready to book?</h2>
            <p className="mt-2 text-sm text-slate-300">Continue to booking with this doctor pre-selected.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/appointments/book?doctorId=${doctor._id || doctor.userId}`}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Book appointment
              </Link>
              <Link
                to="/doctors"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Back to doctors
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}