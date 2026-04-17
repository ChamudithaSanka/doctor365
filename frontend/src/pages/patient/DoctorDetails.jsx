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

  const parseMinutes = (time, fallbackHours, fallbackMinutes) => {
    if (!time || typeof time !== 'string') {
      return fallbackHours * 60 + fallbackMinutes
    }

    const [hours, minutes] = time.split(':').map(Number)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return fallbackHours * 60 + fallbackMinutes
    }

    return hours * 60 + minutes
  }

  const startMinutes = parseMinutes(doctor?.availabilityStartTime, 8, 0)
  const endMinutes = parseMinutes(doctor?.availabilityEndTime, 18, 0)
  const slotMinutes = Number(doctor?.slotMinutes || 30)

  if (!Number.isFinite(slotMinutes) || slotMinutes <= 0 || startMinutes >= endMinutes) {
    return null
  }

  const baseDate = selectedDate ? new Date(selectedDate) : new Date()
  if (Number.isNaN(baseDate.getTime())) {
    return null
  }

  const now = new Date()

  const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  for (let i = 0; i < 14; i += 1) {
    const day = new Date(baseDate)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + i)

    const dayCode = weekdayLabels[day.getDay()]
    if (!workingDays.includes(dayCode)) {
      continue
    }

    const isToday = day.toDateString() === now.toDateString()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const baseline = isToday ? Math.max(nowMinutes, startMinutes) : startMinutes

    const offsetFromStart = baseline - startMinutes
    const stepCount = Math.ceil(offsetFromStart / slotMinutes)
    const nextMinutes = startMinutes + Math.max(0, stepCount) * slotMinutes

    if (nextMinutes >= endMinutes) {
      continue
    }

    const hours = String(Math.floor(nextMinutes / 60)).padStart(2, '0')
    const minutes = String(nextMinutes % 60).padStart(2, '0')

    return {
      date: formatLocalDate(day),
      time: `${hours}:${minutes}`,
    }
  }

  return null
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
      <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 text-sm text-slate-400 backdrop-blur-md">
        Loading doctor details...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-500/30 bg-red-600/10 p-4 text-sm text-red-300 backdrop-blur-md">{error}</div>
        <Link to="/doctors" className="inline-flex rounded-lg border border-purple-500/30 bg-slate-700/30 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700/50">
          Back to doctors
        </Link>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 text-sm text-slate-400 backdrop-blur-md">
          Doctor profile not found.
        </div>
        <Link to="/doctors" className="inline-flex rounded-lg border border-purple-500/30 bg-slate-700/30 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700/50">
          Back to doctors
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 backdrop-blur-md shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300/80">Doctor profile</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">{fullName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Review profile details, consultation fee, and availability before booking.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange-600/30 border border-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
              {doctor.specialization || 'Specialty not listed'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.isVerified ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/20' : 'bg-amber-600/30 text-amber-300 border border-amber-500/20'}`}>
              {doctor.isVerified ? 'Verified doctor' : 'Pending verification'}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Consultation fee</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatCurrency(doctor.consultationFee)}</p>
            </div>
            <div className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Experience</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{doctor.yearsOfExperience ?? 'N/A'} years</p>
            </div>
            <div className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-4 backdrop-blur-sm sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Hospital / Clinic</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{doctor.hospitalOrClinic || 'Online'}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-100">Weekly schedule</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {weeklySchedule.map((item) => (
                <div key={item.day} className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.day}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{item.schedule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md shadow-sm">
            <h2 className="text-xl font-semibold text-slate-100">Availability</h2>
            <p className="mt-2 text-sm text-slate-300">
              {doctor.availabilityStartTime && doctor.availabilityEndTime
                ? `${doctor.availabilityStartTime} – ${doctor.availabilityEndTime}`
                : 'No availability set'}
            </p>
            <p className="mt-1 text-sm text-slate-400">Slot duration: {doctor.slotMinutes || 30} minutes</p>
            <p className="mt-1 text-sm text-slate-400">Working days: {formatWorkingDays(doctor.workingDays)}</p>
            <p className="mt-3 rounded-lg bg-emerald-600/30 border border-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-300">
              {nextSlot ? `Next available slot: ${nextSlot.date} at ${nextSlot.time}` : 'Next slot not available'}
            </p>
          </div>

          <div className="rounded-lg border border-orange-500/20 bg-orange-600/10 p-6 backdrop-blur-md shadow-sm">
            <h2 className="text-xl font-semibold text-slate-100">Ready to book?</h2>
            <p className="mt-2 text-sm text-slate-300">Continue to booking with this doctor pre-selected.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/appointments/book?doctorId=${doctor._id || doctor.userId}`}
                className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-orange-700 hover:to-orange-600"
              >
                Book appointment
              </Link>
              <Link
                to="/doctors"
                className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/50"
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