import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

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

const getToken = () => localStorage.getItem('doctor365_accessToken')

const getAppointmentPatientName = (appointment) => {
  if (appointment.patientName) return appointment.patientName
  const patientId = appointment?.patientId
  if (typeof patientId === 'object' && patientId?.name) return patientId.name
  if (typeof patientId === 'object' && patientId?.fullName) return patientId.fullName
  return 'Unknown Patient'
}

const statusStyles = {
  pending: 'bg-amber-600/30 text-amber-300 ring-amber-600/50',
  confirmed: 'bg-emerald-600/30 text-emerald-300 ring-emerald-600/50',
  cancelled: 'bg-rose-600/30 text-rose-300 ring-rose-600/50',
  completed: 'bg-blue-600/30 text-blue-300 ring-blue-600/50',
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setError('You need to sign in to view your dashboard.')
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const loadDashboard = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/appointments/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        setAppointments(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err?.response?.data?.error?.message || 'Unable to load dashboard data.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [])

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

  const now = new Date()

  const todaysAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const d = new Date(apt.appointmentDate)
      return (
        !Number.isNaN(d.getTime()) &&
        d.toDateString() === now.toDateString() &&
        apt.status !== 'cancelled'
      )
    })
  }, [appointments])

  const pendingCount = useMemo(
    () => appointments.filter((apt) => apt.status === 'pending').length,
    [appointments]
  )

  const activeCount = useMemo(
    () => appointments.filter((apt) => apt.status === 'confirmed').length,
    [appointments]
  )

  const stats = [
    { label: 'Pending requests', value: pendingCount },
    { label: "Today's appointments", value: todaysAppointments.length },
    { label: 'Active consultations', value: activeCount },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg backdrop-blur-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Doctor dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Manage your schedule and consultation flow
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Live data from the appointment service — review requests, confirmations, and today's sessions.
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-red-600/50 bg-red-600/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm hover:shadow-2xl hover:border-purple-500/40 transform hover:-translate-y-1 transition-all duration-300 ease-in-out backdrop-blur-md"
          >
            <p className="text-sm font-medium text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">
              {loading ? '—' : item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md">
        <h2 className="text-xl font-semibold text-slate-100">Today's appointments</h2>
        <p className="mt-1 text-sm text-slate-400">Live from the appointment service</p>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 text-sm text-slate-400 backdrop-blur-md">
              Loading appointments...
            </div>
          ) : todaysAppointments.length > 0 ? (
            todaysAppointments.map((apt) => (
              <div
                key={apt._id}
                className="rounded-lg border border-purple-500/20 bg-indigo-600/10 p-4 transition hover:bg-indigo-600/20 hover:shadow-md hover:-translate-y-0.5 duration-200 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-100">
                      {apt.appointmentTime || '—'} &mdash; {getAppointmentPatientName(apt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Reason: {apt.reason || 'Not provided'}
                    </p>
                    {apt.patientEmail && (
                      <p className="mt-0.5 text-xs text-slate-400">{apt.patientEmail}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[apt.status] || 'bg-slate-700/30 text-slate-300 ring-slate-600/50'}`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-purple-500/30 bg-purple-600/10 p-6 text-sm text-slate-400 backdrop-blur-md">
              No appointments scheduled for today.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}