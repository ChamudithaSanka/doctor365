import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

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

  const stats = {
    total: appointments.length,
    pending: appointments.filter((apt) => apt.status === 'pending').length,
    confirmed: appointments.filter((apt) => apt.status === 'confirmed').length,
    completed: appointments.filter((apt) => apt.status === 'completed').length,
  }

  return (
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
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
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
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        disabled={updating === appointment._id}
                        className="rounded-2xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating === appointment._id ? 'Updating...' : 'Reject / Cancel'}
                      </button>
                    </>
                  )}

                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Update status
                      </label>
                      <select
                        value={appointment.status}
                        onChange={(event) => handleStatusUpdate(appointment._id, event.target.value)}
                        disabled={updating === appointment._id}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <option value={appointment.status}>{statusStyles[appointment.status] ? appointment.status : 'Current status'}</option>
                        {getStatusOptionsForAppointment(appointment.status).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
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
    </div>
  )
}
