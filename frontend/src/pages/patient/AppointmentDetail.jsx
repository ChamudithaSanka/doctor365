import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDateTime = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  completed: 'bg-blue-50 text-blue-700 ring-blue-200',
}

export default function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [appointment, setAppointment] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [telemedicineSession, setTelemedicineSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()

    const loadAppointment = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        const apt = response.data?.data
        setAppointment(apt)

        // Try to fetch doctor details
        if (apt?.doctorId) {
          try {
            const docResponse = await axios.get(`${gatewayBaseUrl}/api/doctors/${apt.doctorId}`, {
              signal: controller.signal,
            })
            setDoctor(docResponse.data?.data || null)
          } catch {
            // Doctor fetch is optional
          }
        }
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          // Handle token errors
          if (handleTokenError(requestError)) {
            return
          }
          
          setError(
            requestError?.response?.data?.error?.message || 'Unable to load appointment details.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadAppointment()
    return () => controller.abort()
  }, [id])

  // Poll telemedicine session status when appointment is confirmed
  useEffect(() => {
    if (appointment?.status !== 'confirmed' || !id) return

    const token = getToken()
    if (!token) return

    const pollSession = async () => {
      try {
        const response = await axios.get(
          `${gatewayBaseUrl}/api/telemedicine/appointment/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (response.data.success && response.data.data) {
          setTelemedicineSession(response.data.data)
        }
      } catch (error) {
        // Silently skip polling errors - session may not exist yet
        console.log('Polling telemedicine session for appointment:', id)
      }
    }

    // Initial fetch
    pollSession()

    // Poll every 5 seconds
    const interval = setInterval(pollSession, 5000)
    return () => clearInterval(interval)
  }, [appointment?.status, id])

  const fetchTelemedicineSession = async (appointmentId) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    if (loadingSession) return
    setLoadingSession(true)

    try {
      console.log('Fetching telemedicine session for appointment:', appointmentId)
      
      const response = await axios.get(
        `${gatewayBaseUrl}/api/telemedicine/appointment/${appointmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log('Session fetch response:', response.data)

      if (response.data.success && response.data.data) {
        setTelemedicineSession(response.data.data)
        console.log('✅ Session fetched:', response.data.data)
      }
    } catch (error) {
      console.error('❌ Error fetching telemedicine session:', error.response?.data || error.message)
      // Don't set error state for 404s - it's normal if session doesn't exist yet
      if (error.response?.status !== 404) {
        setError(error.response?.data?.error?.message || 'Failed to fetch telemedicine session')
      }
    } finally {
      setLoadingSession(false)
    }
  }

  const openPatientJoinUrl = async () => {
    try {
      console.log('Opening patient join URL')
      
      if (telemedicineSession?.patientJoinUrl) {
        console.log('Opening URL:', telemedicineSession.patientJoinUrl)
        window.open(telemedicineSession.patientJoinUrl, '_blank', 'noopener,noreferrer')
      } else {
        console.error('❌ No patient join URL found in session:', telemedicineSession)
        setError('Unable to get meeting URL. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error opening patient join URL:', error)
      setError('Failed to open meeting.')
    }
  }

  const handleCancel = async () => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    setCancelling(true)

    try {
      await axios.delete(`${gatewayBaseUrl}/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      navigate('/appointments')
    } catch (requestError) {
      // Handle token errors
      if (handleTokenError(requestError)) {
        return
      }
      
      setError(requestError?.response?.data?.error?.message || 'Failed to cancel appointment')
      setCancelling(false)
    }
  }

  if (error && !appointment) {
    return (
      <div className="space-y-4">
        <section className="rounded-[2rem] bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white shadow-lg sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </section>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="mb-4">{error}</p>
          <Link
            to="/appointments"
            className="inline-block rounded-2xl bg-red-600 px-6 py-2 text-white font-semibold hover:bg-red-700 transition"
          >
            Back to appointments
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Loading...</p>
          <h1 className="mt-2 text-3xl font-bold">Appointment details</h1>
        </section>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading appointment details...
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="space-y-4">
        <section className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Appointment not found</h1>
        </section>
        <Link
          to="/appointments"
          className="inline-block rounded-2xl bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700 transition"
        >
          Back to appointments
        </Link>
      </div>
    )
  }

  const appointmentDate = new Date(appointment.appointmentDate)
  const isUpcoming =
    appointmentDate >= new Date() && appointment.status !== 'cancelled' && appointment.status !== 'completed'
  const isPast = appointmentDate < new Date()

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Appointment</p>
        <div className="mt-2 flex flex-col gap-2 sm:items-baseline sm:justify-between sm:flex-row">
          <h1 className="text-3xl font-bold tracking-tight">
            {formatDateTime(appointment.appointmentDate)}
          </h1>
          <span
            className={`rounded-full px-4 py-1 text-sm font-semibold ring-1 ${
              statusStyles[appointment.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
            }`}
          >
            {appointment.status}
          </span>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
          {/* Doctor Info */}
          {doctor ? (
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Doctor</p>
              <div className="mt-3">
                <p className="font-semibold text-slate-900">
                  Dr. {doctor.firstName} {doctor.lastName}
                </p>
                <p className="text-sm text-slate-600 mt-1">{doctor.specialization}</p>
                {doctor.hospitalOrClinic && (
                  <p className="text-sm text-slate-600">{doctor.hospitalOrClinic}</p>
                )}
              </div>
            </div>
          ) : null}

          {/* Appointment Details */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Appointment details</h2>
            <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {new Intl.DateTimeFormat('en-LK', { dateStyle: 'long' }).format(appointmentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</p>
                  <p className="mt-1 font-medium text-slate-900">{appointment.appointmentTime}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Reason for visit</p>
                <p className="mt-1 text-slate-900">{appointment.reason}</p>
              </div>

              {appointment.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Additional notes</p>
                  <p className="mt-1 text-slate-900">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Contact information</h2>
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2 text-sm">
              {appointment.patientEmail && (
                <p>
                  <span className="font-medium text-slate-600">Email:</span> {appointment.patientEmail}
                </p>
              )}
              {appointment.patientPhone && (
                <p>
                  <span className="font-medium text-slate-600">Phone:</span> {appointment.patientPhone}
                </p>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Status</h2>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    appointment.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                />
                <div>
                  <p className="font-medium text-slate-900">
                    {appointment.status === 'pending' ? 'Awaiting confirmation' : 'Status updated'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat('en-LK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(appointment.createdAt || appointment.appointmentDate))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Actions</h2>

          {appointment.status === 'confirmed' && (
            <>
              {telemedicineSession?.status === 'ended' ? (
                <button
                  disabled={true}
                  className="w-full rounded-2xl bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 cursor-not-allowed"
                >
                  ✅ Meeting Ended
                </button>
              ) : (
                <button
                  onClick={openPatientJoinUrl}
                  disabled={loadingSession}
                  className="w-full rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSession ? 'Loading...' : '🎥 Join Meeting'}
                </button>
              )}
            </>
          )}

          {isUpcoming && appointment.status !== 'cancelled' && (
            <>
              {!cancelConfirm ? (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="w-full rounded-2xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  Cancel appointment
                </button>
              ) : (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-3">
                  <p className="text-sm text-red-700 font-medium">Confirm cancellation?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                    </button>
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="flex-1 rounded-2xl border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      No, keep it
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {isPast && (
            <button
              onClick={() => navigate('/appointments/book')}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition"
            >
              Book another
            </button>
          )}

          <Link
            to="/appointments"
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 text-center hover:bg-slate-50 transition"
          >
            Back to appointments
          </Link>

          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
            <p className="font-medium">Appointment ID:</p>
            <p className="font-mono break-all">{appointment._id}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
