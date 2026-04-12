import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (Number.isNaN(value)) return 'N/A'
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)
}

const generateTimeSlots = (startTime, endTime, slotMinutes) => {
  const slots = []
  const [startHour, startMin] = (startTime || '08:00').split(':').map(Number)
  const [endHour, endMin] = (endTime || '17:00').split(':').map(Number)

  let currentHour = startHour
  let currentMin = startMin

  const endTotalMin = endHour * 60 + endMin
  while (currentHour * 60 + currentMin < endTotalMin) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`)
    currentMin += slotMinutes
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
}

export default function BookAppointment() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [maxFee, setMaxFee] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const loadDoctors = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/doctors`, { signal: controller.signal })
        const doctorList = Array.isArray(response.data?.data) ? response.data.data : []
        setDoctors(doctorList)
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          setError(requestError?.response?.data?.error?.message || 'Unable to load doctors.')
        }
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
    return () => controller.abort()
  }, [])

  const specialties = useMemo(
    () =>
      Array.from(new Set(doctors.map((d) => d.specialization).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [doctors]
  )

  const filteredDoctors = useMemo(() => {
    const normalizeText = (v) => String(v || '').toLowerCase().trim()
    return doctors.filter((doctor) => {
      const hasSearchMatch =
        !search ||
        normalizeText(`${doctor.firstName} ${doctor.lastName}`).includes(normalizeText(search)) ||
        normalizeText(doctor.specialization).includes(normalizeText(search))
      const hasSpecialtyMatch = specialty === 'all' || doctor.specialization === specialty
      const hasFeeMatch = !maxFee || Number(doctor.consultationFee || 0) <= Number(maxFee)
      return hasSearchMatch && hasSpecialtyMatch && hasFeeMatch
    })
  }, [doctors, search, specialty, maxFee])

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !appointmentDate) return []
    return generateTimeSlots(
      selectedDoctor.availabilityStartTime,
      selectedDoctor.availabilityEndTime,
      selectedDoctor.slotMinutes || 30
    )
  }, [selectedDoctor, appointmentDate])

  const minDate = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDoctor || !appointmentDate || !appointmentTime || !reason) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const token = getToken()
      if (!token) {
        setError('You must be logged in')
        return
      }

      console.log('Booking appointment with doctor:', selectedDoctor)
      console.log('Doctor ID:', selectedDoctor.userId)

      const appointmentPayload = {
        doctorId: selectedDoctor.userId,
        appointmentDate,
        appointmentTime,
        reason,
        notes: notes || '',
      }

      console.log('Appointment payload:', appointmentPayload)

      const response = await axios.post(
        `${gatewayBaseUrl}/api/appointments`,
        appointmentPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.status === 201) {
        navigate(`/appointments/${response.data.data._id}`)
      }
    } catch (requestError) {
      // Handle token errors
      if (handleTokenError(requestError)) {
        return
      }
      
      console.error('Booking error:', requestError.response?.data)
      const errorMsg = requestError?.response?.data?.error?.message || 'Failed to book appointment'
      const details = requestError?.response?.data?.error?.details
      const fullError = details ? `${errorMsg} - ${JSON.stringify(details)}` : errorMsg
      setError(fullError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Book consultation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Schedule your appointment</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Select a doctor, choose your preferred date and time, then confirm your booking.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Doctor Selection */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Select a doctor</h2>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="search" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Doctor name, specialty..."
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="specialty" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Specialty
              </label>
              <select
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All specialties</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fee" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Max fee (LKR)
              </label>
              <input
                id="fee"
                type="number"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
                placeholder="Leave empty for no limit"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading doctors...</div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <button
                  key={doctor._id}
                  onClick={() => {
                    setSelectedDoctor(doctor)
                    setAppointmentTime('')
                  }}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    selectedDoctor?._id === doctor._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{doctor.specialization}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{formatCurrency(doctor.consultationFee)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">No doctors match your filters</div>
            )}
          </div>
        </section>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Appointment details</h2>

          {selectedDoctor && (
            <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm font-medium text-slate-900">
                Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
              </p>
              <p className="text-xs text-slate-600 mt-1">{selectedDoctor.specialization}</p>
              <p className="text-xs text-slate-600">
                Available: {selectedDoctor.availabilityStartTime || '08:00'} -{' '}
                {selectedDoctor.availabilityEndTime || '17:00'}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Appointment date *
            </label>
            <input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value)
                setAppointmentTime('')
              }}
              min={minDate}
              disabled={!selectedDoctor}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Time slot *
            </label>
            <select
              id="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              disabled={!appointmentDate}
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Choose a time</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reason" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Reason for visit *
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Routine checkup, back pain..."
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Additional notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information for the doctor..."
              rows="3"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedDoctor || !appointmentDate || !appointmentTime || !reason || submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {submitting ? 'Booking...' : 'Book appointment'}
          </button>
        </form>
      </div>
    </div>
  )
}
