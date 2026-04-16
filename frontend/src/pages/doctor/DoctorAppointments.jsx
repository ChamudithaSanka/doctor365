import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'
import PrescriptionForm from '../../components/PrescriptionForm'
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
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  completed: 'bg-blue-50 text-blue-700 ring-blue-200',
}

const statusOptions = [
  { value: 'pending', label: 'Pending review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

const getStatusOptionsForAppointment = (status) => {
  if (status === 'pending') {
    return statusOptions.filter((option) => ['confirmed', 'cancelled'].includes(option.value))
  }

  if (status === 'confirmed') {
    return statusOptions.filter((option) => ['completed', 'cancelled'].includes(option.value))
  }

  return []
}

export default function DoctorAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [creatingSession, setCreatingSession] = useState(null)
  const [telemedicineSessions, setTelemedicineSessions] = useState({})
  const [loadingSession, setLoadingSession] = useState(null)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [prescriptionAppointmentId, setPrescriptionAppointmentId] = useState(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [activeSessionData, setActiveSessionData] = useState(null)

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

  const filteredAppointments = useMemo(() => {
    const now = new Date()

    let filtered = appointments

    if (filter === 'pending') {
      filtered = appointments.filter((apt) => apt.status === 'pending')
    } else if (filter === 'confirmed') {
      filtered = appointments.filter((apt) => apt.status === 'confirmed')
    } else if (filter === 'completed') {
      filtered = appointments.filter((apt) => apt.status === 'completed')
    } else if (filter === 'cancelled') {
      filtered = appointments.filter((apt) => apt.status === 'cancelled')
    } else if (filter === 'upcoming') {
      filtered = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate)
        return !Number.isNaN(aptDate.getTime()) && aptDate >= now && apt.status !== 'cancelled'
      })
    }

    return filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
  }, [appointments, filter])

  const handleStatusUpdate = async (appointmentId, newStatus, appointment) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    setUpdating(appointmentId)
    setError('')

    try {
      await axios.patch(
        `${gatewayBaseUrl}/api/appointments/${appointmentId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      )

      // If status is confirmed, create telemedicine session automatically
      if (newStatus === 'confirmed' && appointment) {
        await createTelemedicineSession(appointmentId, appointment)
      }

      setSuccessMessage(`Appointment updated to ${newStatus}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (requestError) {
      // Handle token errors
      if (handleTokenError(requestError)) {
        return
      }
      
      setError(
        requestError?.response?.data?.error?.message || 'Failed to update appointment status'
      )
    } finally {
      setUpdating(null)
    }
  }

  const createTelemedicineSession = async (appointmentId, appointment) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    // Avoid creating multiple sessions
    if (creatingSession === appointmentId) return
    setCreatingSession(appointmentId)

    try {
      console.log('Creating telemedicine session for appointment:', appointmentId)
      
      const response = await axios.post(
        `${gatewayBaseUrl}/api/telemedicine`,
        { appointmentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log('📊 Session creation response:', response.data)
      console.log('   Success:', response.data.success)
      console.log('   Data keys:', response.data.data ? Object.keys(response.data.data) : 'no data')
      console.log('   AppID in response:', response.data.data?.appId)

      if (response.data.success && response.data.data) {
        const sessionData = response.data.data
        
        // Verify required fields
        if (!sessionData.appId) {
          console.warn('⚠️ WARNING: appId is missing from created session!')
          console.warn('   Session fields:', Object.keys(sessionData))
        }
        
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: sessionData,
        }))
        console.log('✅ Telemedicine session created:', sessionData)
        setSuccessMessage('Telemedicine session created successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('❌ Error creating telemedicine session:', error.response?.data || error.message)
      console.error('   Status:', error.response?.status)
      console.error('   Error response:', error.response?.data)
      setError(error.response?.data?.error?.message || 'Failed to create telemedicine session')
    } finally {
      setCreatingSession(null)
    }
  }

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
      console.log('   Data:', response.data.data)
      console.log('   AppID in response:', response.data.data?.appId)

      if (response.data.success && response.data.data) {
        const sessionData = response.data.data
        
        // Verify required fields
        if (!sessionData.appId) {
          console.warn('⚠️ WARNING: appId is missing from session data!')
          console.warn('   Session fields:', Object.keys(sessionData))
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
      console.error('   Status:', error.response?.status)
      console.error('   Error response:', error.response?.data)
      setError(error.response?.data?.error?.message || 'Failed to fetch telemedicine session')
    } finally {
      setLoadingSession(null)
    }
  }

  const openDoctorJoinUrl = async (appointmentId) => {
    try {
      console.log('Opening video call for appointment:', appointmentId)
      
      // First, start the session (change status to active)
      await startTelemedicineSession(appointmentId)
      
      // Check if we already have the session cached
      if (telemedicineSessions[appointmentId]) {
        console.log('Using cached session, showing video component')
        setActiveSessionData(telemedicineSessions[appointmentId])
        setShowVideoCall(true)
        return
      }
      
      // Fetch the session if not cached
      console.log('Session not cached, fetching...')
      const session = await fetchTelemedicineSession(appointmentId)
      
      if (session) {
        console.log('✅ Fetched session, showing video component')
        setActiveSessionData(session)
        setShowVideoCall(true)
      } else {
        console.error('❌ No session found:', session)
        setError('Unable to join meeting. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error opening video call:', error)
      setError('Failed to open meeting.')
    }
  }

  const startTelemedicineSession = async (appointmentId) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    try {
      console.log('🟢 Starting telemedicine session for appointment:', appointmentId)
      
      // Get the session ID from cached sessions
      const sessionId = telemedicineSessions[appointmentId]?._id
      if (!sessionId) {
        console.log('Session not cached, fetching first...')
        const session = await fetchTelemedicineSession(appointmentId)
        if (!session?._id) {
          throw new Error('No session ID found')
        }
        return startTelemedicineSession(appointmentId)
      }

      const response = await axios.patch(
        `${gatewayBaseUrl}/api/telemedicine/${sessionId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.success) {
        console.log('✅ Session started:', response.data.data)
        // Update cached session
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }))
        setSuccessMessage('Meeting started')
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    } catch (error) {
      console.error('❌ Error starting session:', error.response?.data || error.message)
      // Don't fail if already active
      if (error.response?.status !== 400) {
        setError('Failed to start session')
      }
    }
  }

  const endTelemedicineSession = async (appointmentId) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    try {
      console.log('🔴 Ending telemedicine session for appointment:', appointmentId)
      
      const sessionId = telemedicineSessions[appointmentId]?._id
      if (!sessionId) {
        console.log('Session not cached, fetching first...')
        const session = await fetchTelemedicineSession(appointmentId)
        if (!session?._id) {
          throw new Error('No session ID found')
        }
        return endTelemedicineSession(appointmentId)
      }

      const response = await axios.patch(
        `${gatewayBaseUrl}/api/telemedicine/${sessionId}/end`,
        { doctorNotes: 'Consultation completed' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.success) {
        console.log('✅ Session ended:', response.data.data)
        // Update cached session
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }))
        setSuccessMessage('Meeting ended successfully')
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    } catch (error) {
      console.error('❌ Error ending session:', error.response?.data || error.message)
      // Don't fail if already ended
      if (error.response?.status !== 400) {
        setError('Failed to end session')
      }
    }
  }

  const handleVideoCallLeave = () => {
    setShowVideoCall(false)
    setActiveSessionData(null)
    setSuccessMessage('You left the video call')
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  const stats = {
    total: appointments.length,
    pending: appointments.filter((apt) => apt.status === 'pending').length,
    confirmed: appointments.filter((apt) => apt.status === 'confirmed').length,
    completed: appointments.filter((apt) => apt.status === 'completed').length,
  }

  return (
    <>
      {/* Video Call Component - Full Screen */}
      {showVideoCall && activeSessionData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <AgoraVideoCall 
            sessionData={activeSessionData}
            userRole="doctor"
            onLeave={handleVideoCallLeave}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Doctor appointments</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Accept, reject, and update appointments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
            Review patient bookings, accept or reject requests, and update appointment status as care progresses.
          </p>
        </section>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

      {successMessage && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          ✓ {successMessage}
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Pending', value: stats.pending },
          { label: 'Confirmed', value: stats.confirmed },
          { label: 'Completed', value: stats.completed },
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
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === btn.value
                  ? 'bg-purple-600 text-white'
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
            Loading appointments...
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                {/* Main Content */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Patient ID: {String(appointment.patientId || 'unknown').slice(0, 12)}...
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {formatDateTime(appointment.appointmentDate)}
                      </p>
                      <p className="text-sm text-slate-500">Time: {appointment.appointmentTime || 'Not set'}</p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 w-fit ${
                        statusStyles[appointment.status] ||
                        'bg-slate-100 text-slate-700 ring-slate-200'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-50 rounded-2xl p-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Reason:</span> {appointment.reason || 'Not provided'}
                    </p>
                    {appointment.patientEmail && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Email:</span> {appointment.patientEmail}
                      </p>
                    )}
                    {appointment.patientPhone && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Phone:</span> {appointment.patientPhone}
                      </p>
                    )}
                    {appointment.notes && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:min-w-fit">
                  <Link
                    to={`/doctor/patient/${appointment.patientId}`}
                    className="rounded-2xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition text-center"
                  >
                    📋 Patient Profile
                  </Link>

                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'confirmed', appointment)}
                        disabled={updating === appointment._id}
                        className="rounded-2xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating === appointment._id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        disabled={updating === appointment._id}
                        className="rounded-2xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating === appointment._id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </>
                  )}

                  {appointment.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                        disabled={updating === appointment._id}
                        className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating === appointment._id ? 'Updating...' : 'Mark Complete'}
                      </button>
                      
                      {telemedicineSessions[appointment._id]?.status === 'ended' ? (
                        <button
                          disabled={true}
                          className="rounded-2xl bg-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 cursor-not-allowed"
                        >
                          ✅ Meeting Ended
                        </button>
                      ) : telemedicineSessions[appointment._id]?.status === 'active' ? (
                        <button
                          onClick={() => endTelemedicineSession(appointment._id)}
                          className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🔴 End Meeting
                        </button>
                      ) : (
                        <button
                          onClick={() => openDoctorJoinUrl(appointment._id)}
                          disabled={loadingSession === appointment._id || creatingSession === appointment._id}
                          className="rounded-2xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingSession === appointment._id ? 'Loading...' : '🎥 Join Meeting'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setPrescriptionAppointmentId(appointment._id)
                          setShowPrescriptionForm(true)
                        }}
                        className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        💊 Prescribe
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        disabled={updating === appointment._id}
                        className="rounded-2xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating === appointment._id ? 'Updating...' : 'Reject / Cancel'}
                      </button>
                    </>
                  )}



                  {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                    <div className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 text-center">
                      {appointment.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-slate-500">
              {filter === 'all'
                ? 'No appointments yet. Patients will book with you soon!'
                : `No ${filter} appointments.`}
            </p>
          </div>
        )}
      </section>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <PrescriptionForm
          appointmentId={prescriptionAppointmentId}
          onClose={() => {
            setShowPrescriptionForm(false)
            setPrescriptionAppointmentId(null)
          }}
          onSuccess={() => {
            // Optionally reload appointments to show success
            setSuccessMessage('Prescription issued successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
          }}
        />
      )}
      </div>
    </>
  )
}
