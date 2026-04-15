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
  sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  partial: 'bg-orange-50 text-orange-700 ring-orange-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  queued: 'bg-amber-50 text-amber-700 ring-amber-200',
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Notifications Center</h1>
          <p className="mt-2 text-slate-600">Monitor all system notifications across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-600">Total</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{statusBreakdown.all}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-medium text-emerald-700">Sent</div>
            <div className="mt-2 text-2xl font-bold text-emerald-900">{statusBreakdown.sent}</div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="text-sm font-medium text-orange-700">Partial</div>
            <div className="mt-2 text-2xl font-bold text-orange-900">{statusBreakdown.partial}</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-medium text-red-700">Failed</div>
            <div className="mt-2 text-2xl font-bold text-red-900">{statusBreakdown.failed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            {(typeFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Notification Type</label>
              <select
                value={typeFilter}
                onChange={handleTypeChange}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-slate-700">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={handleDateFromChange}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-700">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={handleDateToChange}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* List View */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8">
              <div className="text-slate-600">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-slate-600">
              No notifications found
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="rounded-lg border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl">
                      {typeIcons[notification.type] || '•'}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                        </div>
                        <span
                          className={`ml-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusStyles[notification.status] || statusStyles.queued
                          }`}
                        >
                          {statusLabels[notification.status] || notification.status}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
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
                        <div className="mt-3 rounded-lg bg-slate-50 p-3">
                          <div className="text-xs font-medium text-slate-700 mb-2">Delivery Status:</div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {notification.deliveryStatus.inApp && (
                              <div className="text-xs">
                                <span className="font-medium">In-App:</span> {notification.deliveryStatus.inApp.status}
                              </div>
                            )}
                            {notification.deliveryStatus.email && (
                              <div className="text-xs">
                                <span className="font-medium">Email:</span> {notification.deliveryStatus.email.status}
                              </div>
                            )}
                            {notification.deliveryStatus.sms && (
                              <div className="text-xs">
                                <span className="font-medium">SMS:</span> {notification.deliveryStatus.sms.status}
                              </div>
                            )}
                            <div className="text-xs">
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
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-6 py-4">
                <div className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
