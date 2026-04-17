import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'
import AgoraVideoCall from '../../components/AgoraVideoCall'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDateTime = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const statusStyles = {
  awaiting_payment: 'bg-orange-50 text-orange-700 ring-orange-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  completed: 'bg-blue-50 text-blue-700 ring-blue-200',
}

export default function MyAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [doctorProfiles, setDoctorProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, awaiting_payment, completed, cancelled
  const [telemedicineSessions, setTelemedicineSessions] = useState({})
  const [loadingSession, setLoadingSession] = useState(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [activeSessionData, setActiveSessionData] = useState(null)
  const [payingAppointmentId, setPayingAppointmentId] = useState(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()

    const loadAppointments = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/appointments/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        const appointmentList = Array.isArray(response.data?.data) ? response.data.data : []
        setAppointments(appointmentList)
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          // Handle token errors
          if (handleTokenError(requestError)) {
            return
          }
          
          setError(
            requestError?.response?.data?.error?.message ||
              'Unable to load your appointments. Please try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
    return () => controller.abort()
  }, [navigate])

  useEffect(() => {
    const controller = new AbortController()

    const loadDoctorProfiles = async () => {
      const uniqueDoctorIds = [...new Set(appointments.map((apt) => apt.doctorId).filter(Boolean))]
      const missingDoctorIds = uniqueDoctorIds.filter((doctorId) => !doctorProfiles[doctorId])

      if (missingDoctorIds.length === 0) return

      try {
        const responses = await Promise.all(
          missingDoctorIds.map((doctorId) =>
            axios.get(`${gatewayBaseUrl}/api/doctors/${doctorId}`, {
              signal: controller.signal,
            })
          )
        )

        const fetchedProfiles = {}
        responses.forEach((response, index) => {
          fetchedProfiles[missingDoctorIds[index]] = response.data?.data || null
        })

        setDoctorProfiles((prev) => ({
          ...prev,
          ...fetchedProfiles,
        }))
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          // Keep list usable even if profile lookup fails for some doctors.
          console.warn('Unable to fetch some doctor profiles for appointments list')
        }
      }
    }

    if (appointments.length > 0) {
      loadDoctorProfiles()
    }

    return () => controller.abort()
  }, [appointments, doctorProfiles])

  // Poll telemedicine sessions for confirmed appointments every 5 seconds
  useEffect(() => {
    const token = getToken()
    if (!token) return

    // Fetch sessions for all confirmed appointments
    const pollSessions = async () => {
      const confirmedAppointments = appointments.filter((apt) => apt.status === 'confirmed')
      
      for (const apt of confirmedAppointments) {
        try {
          const response = await axios.get(
            `${gatewayBaseUrl}/api/telemedicine/appointment/${apt._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (response.data.success && response.data.data) {
            setTelemedicineSessions((prev) => ({
              ...prev,
              [apt._id]: response.data.data,
            }))
          }
        } catch (error) {
          // Silently skip polling errors - session may not exist yet
          console.log('Polling session for appointment:', apt._id)
        }
      }
    }

    // Only poll if there are confirmed appointments
    if (appointments.some((apt) => apt.status === 'confirmed')) {
      const interval = setInterval(pollSessions, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [appointments])

  useEffect(() => {
    const token = getToken()
    if (!token || appointments.length === 0) return

    const controller = new AbortController()

    const preloadSessions = async () => {
      const confirmedAppointments = appointments.filter((apt) => apt.status === 'confirmed')

      if (confirmedAppointments.length === 0) return

      try {
        const responses = await Promise.allSettled(
          confirmedAppointments.map((appointment) =>
            axios.get(`${gatewayBaseUrl}/api/telemedicine/appointment/${appointment._id}`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            })
          )
        )

        const nextSessions = {}
        responses.forEach((response, index) => {
          if (response.status === 'fulfilled' && response.value.data?.success && response.value.data?.data) {
            nextSessions[confirmedAppointments[index]._id] = response.value.data.data
          }
        })

        if (Object.keys(nextSessions).length > 0) {
          setTelemedicineSessions((prev) => ({
            ...prev,
            ...nextSessions,
          }))
        }
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          console.warn('Unable to preload telemedicine sessions for patient appointments')
        }
      }
    }

    preloadSessions()
    return () => controller.abort()
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    const now = new Date()

    let filtered = appointments

    if (filter === 'awaiting_payment') {
      filtered = appointments.filter((apt) => apt.status === 'awaiting_payment')
    } else if (filter === 'completed') {
      filtered = appointments.filter((apt) => apt.status === 'completed')
    } else if (filter === 'cancelled') {
      filtered = appointments.filter((apt) => apt.status === 'cancelled')
    }

    return filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
  }, [appointments, filter])

  const fetchTelemedicineSession = async (appointmentId) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    // Avoid concurrent requests for same appointment
    if (loadingSession === appointmentId) return
    setLoadingSession(appointmentId)

    try {
      console.log('Fetching telemedicine session for appointment:', appointmentId)
      
      const response = await axios.get(
        `${gatewayBaseUrl}/api/telemedicine/appointment/${appointmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log('📊 Session fetch response:', response.data)
      console.log('   Success:', response.data.success)
      console.log('   AppID in response:', response.data.data?.appId)

      if (response.data.success && response.data.data) {
        const sessionData = response.data.data
        
        if (!sessionData.appId) {
          console.warn('⚠️ WARNING: appId is missing from session data!')
        }
        
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: sessionData,
        }))
        console.log('✅ Session fetched:', sessionData)
        return sessionData
      }
    } catch (error) {
      console.error('❌ Error fetching telemedicine session:', error.response?.data || error.message)
      setError(error.response?.data?.error?.message || 'Failed to fetch telemedicine session')
    } finally {
      setLoadingSession(null)
    }
  }

  const openVideoCall = async (appointmentId) => {
    try {
      console.log('Opening Agora video call for appointment:', appointmentId)
      
      // Check if we already have the session cached
      if (telemedicineSessions[appointmentId]) {
        console.log('Using cached session, showing Agora video component')
        setActiveSessionData(telemedicineSessions[appointmentId])
        setShowVideoCall(true)
        return
      }
      
      // Fetch the session if not cached
      console.log('Session not cached, fetching...')
      const session = await fetchTelemedicineSession(appointmentId)
      
      if (session) {
        console.log('✅ Fetched session, showing Agora video component')
        setActiveSessionData(session)
        setShowVideoCall(true)
      } else {
        console.error('❌ No session found:', session)
        setError('Unable to join video call. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error opening video call:', error)
      setError('Failed to open meeting.')
    }
  }

  const stats = {
    total: appointments.length,
    awaitingPayment: appointments.filter((apt) => apt.status === 'awaiting_payment').length,
    completed: appointments.filter((apt) => {
      return apt.status === 'completed'
    }).length,
    cancelled: appointments.filter((apt) => apt.status === 'cancelled').length,
  }

  const getDoctorSummary = (appointment) => {
    const doctorProfile = doctorProfiles[appointment.doctorId]
    const appointmentDoctorName = String(appointment.doctorName || '').trim()
    const profileFullName = [doctorProfile?.firstName, doctorProfile?.lastName].filter(Boolean).join(' ').trim()
    const doctorName = appointmentDoctorName || profileFullName || 'Doctor details unavailable'
    const specialization = appointment.specialization || doctorProfile?.specialization || 'Specialization unavailable'

    return {
      name: /^dr\.?\s+/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`,
      specialization,
    }

  }

  const handleVideoCallLeave = () => {
    setShowVideoCall(false)
    setActiveSessionData(null)
  }

  const handlePayNow = async (appointment) => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const doctorProfile = doctorProfiles[appointment.doctorId]
    const consultationFee = Number(doctorProfile?.consultationFee)

    if (Number.isNaN(consultationFee) || consultationFee <= 0) {
      setError('Unable to determine consultation fee for this doctor. Please refresh and try again.')
      return
    }

    setPayingAppointmentId(appointment._id)
    setError('')

    try {
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

      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city']
      const missingFields = requiredFields.filter((field) => !patient[field])

      if (missingFields.length > 0) {
        setError(
          `Please complete your profile first. Missing: ${missingFields.join(', ')}. ` +
          'Visit your profile settings to update this information.'
        )
        return
      }

      const paymentResponse = await axios.post(
        `${gatewayBaseUrl}/api/payments/checkout/payhere`,
        {
          appointmentId: appointment._id,
          amount: consultationFee,
          currency: 'LKR',
          items: `Consultation for appointment ${appointment._id}`,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          city: patient.city,
          country: patient.country || 'Sri Lanka',
          metadata: {
            doctorId: appointment.doctorId,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            reason: appointment.reason,
            notes: appointment.notes || '',
          },
        },
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

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = paymentData.actionUrl
      form.style.display = 'none'

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
    } catch (requestError) {
      handleTokenError(requestError)
      setError(
        requestError?.response?.data?.error?.message || 'Failed to proceed to payment. Please try again.'
      )
    } finally {
      setPayingAppointmentId(null)
    }
  }

  return (
    <>
      {/* Video Call Component - Full Screen */}
      {showVideoCall && activeSessionData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <AgoraVideoCall 
            sessionData={activeSessionData}
            userRole="patient"
            onLeave={handleVideoCallLeave}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Your appointments</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage your consultations</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          View all your appointments, filter by status, and manage your bookings.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <Link to="/login" className="font-semibold text-red-800 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Awaiting Payment', value: stats.awaitingPayment },
          { label: 'Completed', value: stats.completed },
          { label: 'Cancelled', value: stats.cancelled },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </section>

      {/* Filter */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All appointments' },
            { value: 'awaiting_payment', label: 'Awaiting payment' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === btn.value
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>

      {/* Appointments List */}
      <section className="space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Loading your appointments...
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => {
            const doctorSummary = getDoctorSummary(appointment)

            return (
            <article
              key={appointment._id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3 sm:items-center">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {doctorSummary.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{doctorSummary.specialization}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDateTime(appointment.appointmentDate)} • {appointment.appointmentTime || 'Time not set'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Reason:</span> {appointment.reason || 'Not provided'}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 sm:flex-col sm:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      statusStyles[appointment.status] ||
                      'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}
                  >
                    {appointment.status || 'unknown'}
                  </span>

                  {appointment.status === 'awaiting_payment' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handlePayNow(appointment)
                      }}
                      disabled={payingAppointmentId === appointment._id}
                      className="whitespace-nowrap rounded-2xl bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingAppointmentId === appointment._id ? 'Preparing...' : 'Pay Now'}
                    </button>
                  )}

                  <Link
                    to={`/appointments/${appointment._id}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          )})
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-slate-500">
              {filter === 'all'
                ? 'You have no appointments yet. Start by booking one!'
                : `No ${filter} appointments.`}
            </p>
            <Link
              to="/doctors"
              className="mt-4 inline-block rounded-2xl bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Book an appointment
            </Link>
          </div>
        )}
      </section>
      </div>
    </>
  )
}
