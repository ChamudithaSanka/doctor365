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

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  completed: 'bg-blue-50 text-blue-700 ring-blue-200',
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
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Doctor dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Manage your schedule and consultation flow
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Live data from the appointment service — review requests, confirmations, and today's sessions.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-transparent bg-white p-6 shadow-sm hover:shadow-2xl hover:border-slate-200 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? '—' : item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Today's appointments</h2>
        <p className="mt-1 text-sm text-slate-500">Live from the appointment service</p>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Loading appointments...
            </div>
          ) : todaysAppointments.length > 0 ? (
            todaysAppointments.map((apt) => (
              <div
                key={apt._id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md hover:-translate-y-0.5 duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {apt.appointmentTime || '—'} &mdash; Patient ID:{' '}
                      <span className="font-mono text-sm">{String(apt.patientId || '').slice(0, 10)}…</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Reason: {apt.reason || 'Not provided'}
                    </p>
                    {apt.patientEmail && (
                      <p className="mt-0.5 text-xs text-slate-400">{apt.patientEmail}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[apt.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No appointments scheduled for today.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}