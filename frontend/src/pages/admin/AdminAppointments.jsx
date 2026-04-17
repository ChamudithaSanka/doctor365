import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  pending: 'bg-amber-600/30 text-amber-300 ring-amber-600/50',
  confirmed: 'bg-emerald-600/30 text-emerald-300 ring-emerald-600/50',
  cancelled: 'bg-rose-600/30 text-rose-300 ring-rose-600/50',
  completed: 'bg-blue-600/30 text-blue-300 ring-blue-600/50',
}

export default function AdminAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
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
        const response = await axios.get(`${gatewayBaseUrl}/api/appointments`, {
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
              'Unable to load appointments. Please try again.'
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

    // Apply status filter
    if (filter === 'pending') {
      filtered = appointments.filter((apt) => apt.status === 'pending')
    } else if (filter === 'confirmed') {
      filtered = appointments.filter((apt) => apt.status === 'confirmed')
    } else if (filter === 'completed') {
      filtered = appointments.filter((apt) => apt.status === 'completed')
    } else if (filter === 'cancelled') {
      filtered = appointments.filter((apt) => apt.status === 'cancelled')
    } else if (filter === 'overdue') {
      filtered = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate)
        return (
          !Number.isNaN(aptDate.getTime()) &&
          aptDate < now &&
          apt.status !== 'completed' &&
          apt.status !== 'cancelled'
        )
      })
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((apt) => {
        const patientId = String(apt.patientId || '').toLowerCase()
        const doctorId = String(apt.doctorId || '').toLowerCase()
        const reason = String(apt.reason || '').toLowerCase()
        const patientEmail = String(apt.patientEmail || '').toLowerCase()

        return (
          patientId.includes(searchLower) ||
          doctorId.includes(searchLower) ||
          reason.includes(searchLower) ||
          patientEmail.includes(searchLower)
        )
      })
    }

    return filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
  }, [appointments, filter, search])

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
    cancelled: appointments.filter((apt) => apt.status === 'cancelled').length,
    overdue: appointments.filter((apt) => {
      const now = new Date()
      const aptDate = new Date(apt.appointmentDate)
      return (
        !Number.isNaN(aptDate.getTime()) &&
        aptDate < now &&
        apt.status !== 'completed' &&
        apt.status !== 'cancelled'
      )
    }).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950">
      <div className="space-y-6 p-6">
      <section className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg backdrop-blur-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Appointment tracking</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Platform-wide appointment status</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Monitor all appointments across the platform, track statuses, and manage exceptions.
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-red-600/50 bg-red-600/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-600/50 bg-emerald-600/30 p-4 text-sm text-emerald-300">
          ✓ {successMessage}
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Pending', value: stats.pending, highlight: stats.pending > 0 },
          { label: 'Confirmed', value: stats.confirmed },
          { label: 'Completed', value: stats.completed },
          { label: 'Cancelled', value: stats.cancelled },
          { label: 'Overdue', value: stats.overdue, highlight: stats.overdue > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border p-4 shadow-sm ${
              stat.highlight
                ? 'border-amber-600/50 bg-amber-600/30 backdrop-blur-md'
                : 'border-purple-500/20 bg-purple-600/10 backdrop-blur-md'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-2xl font-bold ${
              stat.highlight ? 'text-amber-300' : 'text-slate-100'
            }`}>
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Search and Filter */}
      <section className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 shadow-sm backdrop-blur-md space-y-4">
        <div>
          <label htmlFor="search" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Patient ID, Doctor ID, email, reason..."
            className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === btn.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700/30 text-slate-300 hover:bg-slate-600/30 border border-slate-600/30'
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
          <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 text-center text-slate-400 backdrop-blur-md">
            Loading appointments...
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-purple-500/20 bg-purple-600/10 backdrop-blur-md">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 bg-slate-800/30">
                  <th className="rounded-tl-lg px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Status
                  </th>
                  <th className="rounded-tr-lg px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-slate-700/20 transition">
                    <td className="px-4 py-4 text-sm text-slate-100">
                      <div>
                        <p className="font-medium">{formatDateTime(appointment.appointmentDate)}</p>
                        <p className="text-xs text-slate-400">{appointment.appointmentTime}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      <div>
                        <p className="font-mono text-xs">{String(appointment.patientId || '').slice(0, 12)}...</p>
                        {appointment.patientEmail && (
                          <p className="text-xs text-slate-400">{appointment.patientEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      <p className="font-mono text-xs">{String(appointment.doctorId || '').slice(0, 12)}...</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">{appointment.reason || '—'}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ring-1 ${
                          statusStyles[appointment.status] ||
                          'bg-slate-700/30 text-slate-300 ring-slate-600/50'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                            disabled={updating === appointment._id}
                            className="rounded-lg bg-emerald-600/30 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/50 transition disabled:opacity-50 border border-emerald-600/50"
                          >
                            Confirm
                          </button>
                        )}

                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                            disabled={updating === appointment._id}
                            className="rounded-lg bg-red-600/30 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-600/50 transition disabled:opacity-50 border border-red-600/50"
                          >
                            Cancel
                          </button>
                        )}

                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                            disabled={updating === appointment._id}
                            className="rounded-lg bg-blue-600/30 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-600/50 transition disabled:opacity-50 border border-blue-600/50"
                          >
                            Complete
                          </button>
                        )}

                        {updating === appointment._id && (
                          <span className="text-xs text-slate-400">Updating...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-purple-500/30 bg-purple-600/10 p-8 text-center backdrop-blur-md">
          <p className="text-slate-400">
            {search
              ? 'No appointments match your search.'
              : `No ${filter} appointments found.`}
          </p>
        </div>
      )}
    </section>

    {/* Summary Stats */}
    {filteredAppointments.length > 0 && (
      <section className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md">
        <p className="text-sm font-medium text-slate-300">
          Showing <span className="font-semibold text-slate-100">{filteredAppointments.length}</span> of{' '}
          <span className="font-semibold text-slate-100">{appointments.length}</span> total appointments
        </p>
      </section>
    )}
    </div>
    </div>
  )
}
