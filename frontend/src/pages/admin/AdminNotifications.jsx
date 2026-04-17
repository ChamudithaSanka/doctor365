import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'
import { useNavigate } from 'react-router-dom'

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
  sent: 'bg-emerald-600/30 text-emerald-300 ring-emerald-600/50',
  partial: 'bg-orange-600/30 text-orange-300 ring-orange-600/50',
  failed: 'bg-red-600/30 text-red-300 ring-red-600/50',
  queued: 'bg-amber-600/30 text-amber-300 ring-amber-600/50',
}

const statusLabels = {
  sent: 'Sent',
  partial: 'Partial',
  failed: 'Failed',
  queued: 'Queued',
}

const typeLabels = {
  'appointment.booked': 'Appointment Booked',
  'appointment.cancelled': 'Appointment Cancelled',
  'appointment.reminder': 'Appointment Reminder',
  'payment.paid': 'Payment Success',
  'payment.failed': 'Payment Failed',
}

const typeIcons = {
  'appointment.booked': '📅',
  'appointment.cancelled': '✕',
  'appointment.reminder': '⏰',
  'payment.paid': '✓',
  'payment.failed': '⚠',
}

export default function AdminNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadNotifications = async (pageNum = 1) => {
    setLoading(true)
    setError('')

    try {
      const token = getToken()
      if (!token) {
        navigate('/login')
        return
      }

      const params = new URLSearchParams()
      params.set('page', pageNum)
      params.set('limit', '20')

      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        params.set('type', typeFilter)
      }

      if (dateFrom) {
        params.set('startDate', dateFrom)
      }

      if (dateTo) {
        params.set('endDate', dateTo)
      }

      const response = await axios.get(`${gatewayBaseUrl}/api/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data?.data || {}
      setNotifications(Array.isArray(data.items) ? data.items : [])
      const total = data.pagination?.total || 0
      const limit = data.pagination?.limit || 20
      setTotalPages(Math.ceil(total / limit))
      setPage(pageNum)
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }

      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load notifications. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, dateFrom, dateTo])

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value)
    setPage(1)
  }

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value)
    setPage(1)
  }

  const handleDateToChange = (e) => {
    setDateTo(e.target.value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      loadNotifications(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      loadNotifications(page + 1)
    }
  }

  const statusBreakdown = useMemo(() => {
    const breakdown = { all: 0, sent: 0, partial: 0, failed: 0, queued: 0 }
    notifications.forEach((notification) => {
      breakdown.all += 1
      breakdown[notification.status] = (breakdown[notification.status] || 0) + 1
    })
    return breakdown
  }, [notifications])

  const typeBreakdown = useMemo(() => {
    const breakdown = {}
    notifications.forEach((notification) => {
      breakdown[notification.type] = (breakdown[notification.type] || 0) + 1
    })
    return breakdown
  }, [notifications])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Notifications Center</h1>
          <p className="mt-2 text-slate-400">Monitor all system notifications across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400">Total</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">{statusBreakdown.all}</div>
          </div>
          <div className="rounded-lg border border-emerald-600/50 bg-emerald-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-emerald-300">Sent</div>
            <div className="mt-2 text-2xl font-bold text-emerald-200">{statusBreakdown.sent}</div>
          </div>
          <div className="rounded-lg border border-orange-600/50 bg-orange-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-orange-300">Partial</div>
            <div className="mt-2 text-2xl font-bold text-orange-200">{statusBreakdown.partial}</div>
          </div>
          <div className="rounded-lg border border-red-600/50 bg-red-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-red-300">Failed</div>
            <div className="mt-2 text-2xl font-bold text-red-200">{statusBreakdown.failed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Filters</h2>
            {(typeFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Notification Type</label>
              <select
                value={typeFilter}
                onChange={handleTypeChange}
                className="mt-1 block w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-slate-100 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all">All Types</option>
                <option value="appointment.booked">Appointment Booked</option>
                <option value="appointment.cancelled">Appointment Cancelled</option>
                <option value="appointment.reminder">Appointment Reminder</option>
                <option value="payment.paid">Payment Success</option>
                <option value="payment.failed">Payment Failed</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="mt-1 block w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-slate-100 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
                <option value="queued">Queued</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-300">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={handleDateFromChange}
                className="mt-1 block w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-slate-100 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-300">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={handleDateToChange}
                className="mt-1 block w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-slate-100 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-600/50 bg-red-600/30 p-4 text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}

        {/* List View */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 backdrop-blur-md">
              <div className="text-slate-400">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 text-slate-400 backdrop-blur-md">
              No notifications found
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 transition-colors hover:border-purple-500/40 backdrop-blur-md"
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20 text-xl">
                      {typeIcons[notification.type] || '•'}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-100">{notification.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
                        </div>
                        <span
                          className={`ml-4 inline-flex rounded-lg px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusStyles[notification.status] || statusStyles.queued
                          }`}
                        >
                          {statusLabels[notification.status] || notification.status}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                        <div>
                          <span className="font-medium">Type:</span> {typeLabels[notification.type] || notification.type}
                        </div>
                        <div>
                          <span className="font-medium">User ID:</span> {notification.userId}
                        </div>
                        <div>
                          <span className="font-medium">Sent:</span> {formatDateTime(notification.createdAt)}
                        </div>
                        {notification.channels && (
                          <div>
                            <span className="font-medium">Channels:</span>{' '}
                            {['inApp', 'email', 'sms']
                              .filter((c) => notification.channels[c])
                              .join(', ') || 'None'}
                          </div>
                        )}
                      </div>

                      {/* Delivery Status */}
                      {notification.deliveryStatus && (
                        <div className="mt-3 rounded-lg bg-purple-600/10 p-3 border border-purple-500/20">
                          <div className="text-xs font-medium text-slate-300 mb-2">Delivery Status:</div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {notification.deliveryStatus.inApp && (
                              <div className="text-xs text-slate-400">
                                <span className="font-medium">In-App:</span> {notification.deliveryStatus.inApp.status}
                              </div>
                            )}
                            {notification.deliveryStatus.email && (
                              <div className="text-xs text-slate-400">
                                <span className="font-medium">Email:</span> {notification.deliveryStatus.email.status}
                              </div>
                            )}
                            {notification.deliveryStatus.sms && (
                              <div className="text-xs text-slate-400">
                                <span className="font-medium">SMS:</span> {notification.deliveryStatus.sms.status}
                              </div>
                            )}
                            <div className="text-xs text-slate-400">
                              <span className="font-medium">Overall:</span> {notification.deliveryStatus.overall}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-600/10 px-6 py-4 backdrop-blur-md">
                <div className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600/30 transition disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600/30 transition disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
