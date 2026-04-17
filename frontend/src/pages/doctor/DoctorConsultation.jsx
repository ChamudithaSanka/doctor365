import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

const getAppointmentPatientId = (appointment) => {
  const patientId = appointment?.patientId
  if (!patientId) return ''
  if (typeof patientId === 'string') return patientId
  if (typeof patientId === 'object') {
    return patientId.userId || patientId._id || patientId.id || ''
  }
  return ''
}

const getAppointmentPatientName = (appointment) => {
  if (appointment.patientName) return appointment.patientName
  const patientId = appointment?.patientId
  if (typeof patientId === 'object' && patientId?.name) return patientId.name
  if (typeof patientId === 'object' && patientId?.fullName) return patientId.fullName
  return 'Unknown Patient'
}

export default function DoctorConsultation() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [creatingSession, setCreatingSession] = useState(null)
  const [telemedicineSessions, setTelemedicineSessions] = useState({})
  const [loadingSession, setLoadingSession] = useState(null)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [prescriptionAppointmentId, setPrescriptionAppointmentId] = useState(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [activeSessionData, setActiveSessionData] = useState(null)
  const [activeAppointmentId, setActiveAppointmentId] = useState(null)

  // Load appointments
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
        // Filter confirmed and completed appointments
        const filteredAppointments = appointmentList.filter((apt) => apt.status === 'confirmed' || apt.status === 'completed')
        setAppointments(filteredAppointments)
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          if (handleTokenError(requestError)) {
            return
          }
          setError(requestError?.response?.data?.error?.message || 'Failed to load consultations')
        }
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
    return () => controller.abort()
  }, [navigate])

  // Fetch telemedicine sessions for all appointments
  useEffect(() => {
    appointments.forEach((appointment) => {
      if (!telemedicineSessions[appointment._id]) {
        fetchTelemedicineSession(appointment._id)
      }
    })
  }, [appointments])

  // Fetch patient details to get patient names
  useEffect(() => {
    const fetchPatientDetails = async () => {
      const token = getToken()
      if (!token || appointments.length === 0) return

      for (const appointment of appointments) {
        // Skip if already has patient name
        if (appointment.patientName) continue

        const patientId = typeof appointment.patientId === 'string' ? appointment.patientId : appointment.patientId?._id
        if (!patientId) continue

        try {
          const response = await axios.get(`${gatewayBaseUrl}/api/patients/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          const patientData = response.data?.data
          if (patientData?.firstName) {
            const fullName = `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim()
            setAppointments((prev) =>
              prev.map((apt) =>
                apt._id === appointment._id ? { ...apt, patientName: fullName } : apt
              )
            )
          }
        } catch (error) {
          console.log('Could not fetch patient details for:', patientId)
        }
      }
    }

    fetchPatientDetails()
  }, [appointments.length])

  const handleStatusUpdate = async (appointmentId, newStatus) => {
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

      setSuccessMessage(`Appointment marked as ${newStatus}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }
      setError(requestError?.response?.data?.error?.message || 'Failed to update appointment status')
    } finally {
      setUpdating(null)
    }
  }

  const fetchTelemedicineSession = async (appointmentId) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    if (loadingSession === appointmentId) return
    setLoadingSession(appointmentId)

    try {
      const response = await axios.get(
        `${gatewayBaseUrl}/api/telemedicine/appointment/${appointmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.success && response.data.data) {
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }))
      }
    } catch (error) {
      console.error('Error fetching telemedicine session:', error)
      // Session might not be created yet, that's okay
    } finally {
      setLoadingSession(null)
    }
  }

  const openVideoCall = async (appointmentId) => {
    try {
      // Track which appointment is in active call
      setActiveAppointmentId(appointmentId)
      
      // First, start the session (change status to active)
      await startTelemedicineSession(appointmentId)

      // Check if we already have the session cached
      if (telemedicineSessions[appointmentId]) {
        setActiveSessionData(telemedicineSessions[appointmentId])
        setShowVideoCall(true)
        return
      }

      // Fetch the session if not cached
      const token = getToken()
      if (!token) {
        setError('You must be logged in')
        return
      }

      const response = await axios.get(
        `${gatewayBaseUrl}/api/telemedicine/appointment/${appointmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.success && response.data.data) {
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }))
        setActiveSessionData(response.data.data)
        setShowVideoCall(true)
      } else {
        setError('Unable to join video call. Please try again.')
      }
    } catch (error) {
      console.error('Error opening video call:', error)
      setError('Failed to open video call.')
    }
  }

  const startTelemedicineSession = async (appointmentId) => {
    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    try {
      const sessionId = telemedicineSessions[appointmentId]?._id
      if (!sessionId) {
        const response = await axios.get(
          `${gatewayBaseUrl}/api/telemedicine/appointment/${appointmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (response.data.success && response.data.data) {
          return startTelemedicineSession(appointmentId)
        }
        throw new Error('No session ID found')
      }

      const response = await axios.patch(
        `${gatewayBaseUrl}/api/telemedicine/${sessionId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.success) {
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }))
        setSuccessMessage('Meeting started')
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    } catch (error) {
      console.error('Error starting session:', error)
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
      const sessionId = telemedicineSessions[appointmentId]?._id
      if (!sessionId) {
        const response = await axios.get(
          `${gatewayBaseUrl}/api/telemedicine/appointment/${appointmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (response.data.success && response.data.data) {
          return endTelemedicineSession(appointmentId)
        }
        throw new Error('No session ID found')
      }

      const response = await axios.patch(
        `${gatewayBaseUrl}/api/telemedicine/${sessionId}/end`,
        { doctorNotes: 'Consultation completed' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.success) {
        setTelemedicineSessions((prev) => ({
          ...prev,
          [appointmentId]: response.data.data,
        }))
        setSuccessMessage('Meeting ended successfully')
        setTimeout(() => setSuccessMessage(''), 2000)
      }
    } catch (error) {
      console.error('Error ending session:', error)
      if (error.response?.status !== 400) {
        setError('Failed to end session')
      }
    }
  }

  const handleVideoCallLeave = async () => {
    // End the telemedicine session
    if (activeAppointmentId) {
      await endTelemedicineSession(activeAppointmentId)
    }
    
    setShowVideoCall(false)
    setActiveSessionData(null)
    setActiveAppointmentId(null)
    setSuccessMessage('You left the video call')
    setTimeout(() => setSuccessMessage(''), 2000)
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

      <div className="space-y-6">
        {/* Header */}
        <section className="rounded-[2rem] bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white shadow-lg sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Doctor consultations</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Active Consultations</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
            Join video meetings with patients, end consultations, and prescribe medications.
          </p>
        </section>

        {/* Messages */}
        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* Appointments List */}
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              Loading consultations...
            </div>
          ) : appointments.length > 0 ? (
            appointments.map((appointment) => {
              const appointmentPatientId = getAppointmentPatientId(appointment)
              const sessionStatus = telemedicineSessions[appointment._id]?.status

              return (
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
                            {getAppointmentPatientName(appointment)}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDateTime(appointment.appointmentDate)}
                          </p>
                          <p className="text-sm text-slate-500">Time: {appointment.appointmentTime || 'Not set'}</p>
                        </div>
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
                      {appointmentPatientId ? (
                        <Link
                          to={`/doctor/patient/${appointmentPatientId}`}
                          className="rounded-2xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition text-center"
                        >
                          📋 Patient Profile
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-2xl bg-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 cursor-not-allowed"
                        >
                          Patient Profile Unavailable
                        </button>
                      )}

                      {/* Show buttons only if appointment is not completed */}
                      {appointment.status !== 'completed' && (
                        <>
                          {/* Video Meeting Logic */}
                          {sessionStatus === 'ended' ? (
                            // After meeting ended - show Mark Complete and Prescribe
                            <>
                              <button
                                onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                disabled={updating === appointment._id}
                                className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updating === appointment._id ? 'Updating...' : 'Mark Complete'}
                              </button>

                              <button
                                onClick={() => {
                                  setPrescriptionAppointmentId(appointment._id)
                                  setShowPrescriptionForm(true)
                                }}
                                className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                              >
                                💊 Prescribe
                              </button>
                            </>
                          ) : (
                            // Before or during meeting - show Join Meeting
                            <button
                              onClick={() => openVideoCall(appointment._id)}
                              disabled={loadingSession === appointment._id || creatingSession === appointment._id}
                              className="rounded-2xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingSession === appointment._id ? 'Loading...' : '🎥 Join Meeting'}
                            </button>
                          )}
                        </>
                      )}

                      {/* Show completed status when done */}
                      {appointment.status === 'completed' && (
                        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 text-center">
                          ✅ Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-slate-500">No active consultations at the moment.</p>
            </div>
          )}
        </section>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <PrescriptionForm
          appointmentId={prescriptionAppointmentId}
          onClose={() => {
            setShowPrescriptionForm(false)
            setPrescriptionAppointmentId(null)
          }}
          onSuccess={() => {
            setSuccessMessage('Prescription issued successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
          }}
        />
      )}
    </>
  )
}
