import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDateTime = (value) => {
  if (!value) {
    return 'Unknown date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

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

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [reports, setReports] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
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

    const loadDashboardData = async () => {
      setLoading(true)
      setError('')

      try {
        const authHeaders = {
          Authorization: `Bearer ${token}`,
        }

        const [profileResponse, appointmentsResponse, reportsResponse, prescriptionsResponse] = await Promise.all([
          axios.get(`${gatewayBaseUrl}/api/patients/me`, { headers: authHeaders, signal: controller.signal }),
          axios.get(`${gatewayBaseUrl}/api/appointments/me`, { headers: authHeaders, signal: controller.signal }),
          axios.get(`${gatewayBaseUrl}/api/patients/me/reports`, { headers: authHeaders, signal: controller.signal }),
          axios.get(`${gatewayBaseUrl}/api/patients/me/prescriptions`, { headers: authHeaders, signal: controller.signal }),
        ])

        setPatient(profileResponse.data.data)
        setAppointments(Array.isArray(appointmentsResponse.data.data) ? appointmentsResponse.data.data : [])
        setReports(Array.isArray(reportsResponse.data.data) ? reportsResponse.data.data : [])
        setPrescriptions(Array.isArray(prescriptionsResponse.data.data) ? prescriptionsResponse.data.data : [])

        try {
          const notificationsResponse = await axios.get(`${gatewayBaseUrl}/api/notifications/me?page=1&limit=100`, {
            headers: authHeaders,
            signal: controller.signal,
          })
          const notificationItems = Array.isArray(notificationsResponse.data?.data?.items)
            ? notificationsResponse.data.data.items
            : []
          setUnreadNotifications(notificationItems.filter((item) => item.status !== 'read').length)
        } catch (notificationError) {
          if (notificationError.name !== 'CanceledError') {
            setUnreadNotifications(0)
          }
        }
      } catch (requestError) {
        if (requestError.name === 'CanceledError') {
          return
        }

        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load your patient dashboard right now. Please try again shortly.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()

    return () => controller.abort()
  }, [])

  const upcomingAppointments = useMemo(() => {
    const now = new Date()

    return appointments
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate)
        return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= now && appointment.status !== 'cancelled'
      })
      .sort((left, right) => new Date(left.appointmentDate) - new Date(right.appointmentDate))
  }, [appointments])

  const quickStats = [
    { label: 'Upcoming appointments', value: upcomingAppointments.length },
    { label: 'Medical reports', value: reports.length },
    { label: 'Prescriptions', value: prescriptions.length },
    { label: 'Unread notifications', value: unreadNotifications },
  ]

  const fullName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient'
  const age = patient?.dateOfBirth ? Math.max(0, Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000)) : null

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Your health dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {loading ? 'Loading your care summary...' : `Welcome back, ${fullName}`}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
              Keep track of your upcoming care, health records, and prescriptions in one place.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Profile snapshot</p>
            <div className="mt-3 space-y-1 text-sm text-white/90">
              <p>Phone: {patient?.phone || 'Not set'}</p>
              <p>Gender: {patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not set'}</p>
              <p>Age: {age !== null ? `${age} years old` : 'Not set'}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <Link to="/login" className="font-semibold text-red-800 underline-offset-4 hover:underline">
              Go to login
            </Link>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Upcoming appointments</h2>
              <p className="mt-1 text-sm text-slate-500">Your next scheduled visits</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {upcomingAppointments.length} scheduled
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading appointments...
              </div>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 3).map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Doctor: {item.doctorName || item.doctor?.name || item.doctor?.fullName || 'Assigned doctor'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{formatDateTime(item.appointmentDate)}</p>
                      <p className="mt-1 text-sm text-slate-500">Visit reason: {item.reason || 'Not provided'}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[item.status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}
                    >
                      {item.status
                        ? `${String(item.status).charAt(0).toUpperCase()}${String(item.status).slice(1).toLowerCase()}`
                        : 'Unknown'}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                You do not have any upcoming appointments yet.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <Link
                to="/doctors"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Book Appointment
              </Link>
              <Link
                to="/appointments"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                My appointments
              </Link>
              <Link
                to="/patient/prescriptions"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Prescriptions
              </Link>
              <Link
                to="/patient/reports"
                className="block rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Medical reports
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}