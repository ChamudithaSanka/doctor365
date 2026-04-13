import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const getWeekdayCode = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return weekdayLabels[date.getDay()]
}

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
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  // Get doctorId from URL params
  const doctorId = searchParams.get('doctorId')

  useEffect(() => {
    const controller = new AbortController()
    
    const loadDoctor = async () => {
      if (!doctorId) {
        setError('No doctor selected. Please select a doctor from the doctors list.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/doctors/${doctorId}`, { 
          signal: controller.signal 
        })
        const doctor = response.data?.data
        if (doctor) {
          setSelectedDoctor(doctor)
        } else {
          setError('Unable to load doctor details.')
        }
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          setError(requestError?.response?.data?.error?.message || 'Unable to load doctor details.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadDoctor()
    return () => controller.abort()
  }, [doctorId])

  useEffect(() => {
    const dateFromUrl = searchParams.get('date') || ''
    if (dateFromUrl) {
      setAppointmentDate(dateFromUrl)
    }
  }, [searchParams])

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !appointmentDate) return []
    return generateTimeSlots(
      selectedDoctor.availabilityStartTime,
      selectedDoctor.availabilityEndTime,
      selectedDoctor.slotMinutes || 30
    )
  }, [selectedDoctor, appointmentDate])

  const minDate = new Date().toISOString().split('T')[0]

  const handleProceedToPayment = async (e) => {
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

      // Fetch current patient details
      const patientResponse = await axios.get(`${gatewayBaseUrl}/api/patients/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const patient = patientResponse.data?.data

      if (!patient) {
        setError('Unable to fetch patient details. Please try again.')
        return
      }

      // Validate required patient fields for checkout
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city']
      const missingFields = requiredFields.filter(field => !patient[field])

      if (missingFields.length > 0) {
        setError(
          `Please complete your profile first. Missing: ${missingFields.join(', ')}. ` +
          'Visit your profile settings to update this information.'
        )
        return
      }

      // Prepare checkout request payload
      const checkoutPayload = {
        appointmentId: `APT-${Date.now()}`, // Temporary ID, will be created in appointment service
        amount: selectedDoctor.consultationFee,
        currency: 'LKR',
        items: `Consultation with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        city: patient.city,
        country: patient.country || 'Sri Lanka',
        metadata: {
          doctorId: selectedDoctor.userId,
          doctorName: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
          appointmentDate,
          appointmentTime,
          reason,
          notes: notes || '',
          specialization: selectedDoctor.specialization,
        },
      }

      // Call payment service to initiate PayHere checkout
      const paymentResponse = await axios.post(
        `${gatewayBaseUrl}/api/payments/checkout/payhere`,
        checkoutPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const paymentData = paymentResponse.data?.data

      if (!paymentData?.actionUrl || !paymentData?.fields) {
        setError('Failed to initiate payment. Please try again.')
        return
      }

      // Create hidden form and submit to PayHere
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = paymentData.actionUrl
      form.style.display = 'none'

      // Add all form fields
      Object.entries(paymentData.fields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    } catch (error) {
      console.error('Error initiating PayHere checkout:', error)
      handleTokenError(error)
      setError(
        error?.response?.data?.error?.message || 'Failed to proceed to payment. Please try again.'
      )
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
          Select your preferred date and time, then confirm your booking.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading doctor details...</p>
          </div>
        </div>
      ) : selectedDoctor ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Doctor Details Preview */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-y-auto max-h-screen">
            <button
              onClick={() => navigate('/doctors')}
              className="mb-4 text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              ← Back to doctors
            </button>

            <div className="space-y-5">
              {/* Doctor Header */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDoctor.specialization && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                      {selectedDoctor.specialization}
                    </span>
                  )}
                  {selectedDoctor.isVerified && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                      Verified doctor
                    </span>
                  )}
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Consultation Fee</p>
                  <p className="text-lg font-bold text-slate-900 mt-2">{formatCurrency(selectedDoctor.consultationFee)}</p>
                </div>

                {selectedDoctor.experience && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Experience</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">
                      {selectedDoctor.experience} {selectedDoctor.experience === 1 ? 'year' : 'years'}
                    </p>
                  </div>
                )}
              </div>

              {/* Hospital/Clinic */}
              {selectedDoctor.hospital && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hospital / Clinic</p>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedDoctor.hospital}</p>
                </div>
              )}

              {/* Qualifications */}
              {selectedDoctor.qualifications && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Qualifications</p>
                  <p className="text-sm text-slate-700 mt-2">{selectedDoctor.qualifications}</p>
                </div>
              )}

              {/* Bio */}
              {selectedDoctor.bio && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Bio</p>
                  <p className="text-sm text-slate-700 mt-2">{selectedDoctor.bio}</p>
                </div>
              )}

              {/* Weekly Schedule */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-4">Weekly schedule</p>
                <div className="grid grid-cols-2 gap-3">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => {
                    const isWorking = Array.isArray(selectedDoctor.workingDays) && selectedDoctor.workingDays.includes(day)
                    return (
                      <div key={day} className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{day}</p>
                        <p className="text-xs font-semibold text-slate-900 mt-2">
                          {isWorking
                            ? `${selectedDoctor.availabilityStartTime || '08:00'} – ${selectedDoctor.availabilityEndTime || '18:00'} (${selectedDoctor.slotMinutes || 30} min slots)`
                            : 'Unavailable'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

        {/* Booking Form */}
        <form onSubmit={handleProceedToPayment} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Appointment details</h2>

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
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            disabled={!appointmentDate || !appointmentTime || !reason || submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {submitting ? 'Preparing...' : 'Proceed to payment'}
          </button>
        </form>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-600">Unable to load doctor details. Please select a doctor from the doctors list.</p>
        </div>
      )}
    </div>
  )
}
