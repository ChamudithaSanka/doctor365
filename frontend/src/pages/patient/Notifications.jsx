import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

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

const statusStyles = {
  read: 'bg-slate-100 text-slate-700 ring-slate-200',
  sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  queued: 'bg-amber-50 text-amber-700 ring-amber-200',
  partial: 'bg-orange-50 text-orange-700 ring-orange-200',
  failed: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [markingId, setMarkingId] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      window.location.href = '/login'
      return
    }

    const controller = new AbortController()

    const loadNotifications = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/notifications/me?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        const notificationItems = Array.isArray(response.data?.data?.items) ? response.data.data.items : []
        setItems(notificationItems)
      } catch (requestError) {
        if (requestError.name === 'CanceledError') {
          return
        }

        if (handleTokenError(requestError)) {
          return
        }

        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load notifications right now. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    return () => controller.abort()
  }, [])

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime()
      const rightTime = new Date(right.createdAt).getTime()
      return rightTime - leftTime
    })

    if (filter === 'unread') {
      return sorted.filter((item) => item.status !== 'read')
    }

    if (filter === 'read') {
      return sorted.filter((item) => item.status === 'read')
    }

    return sorted
  }, [filter, items])

  const unreadCount = useMemo(() => items.filter((item) => item.status !== 'read').length, [items])

  const markAsRead = async (id) => {
    const token = getToken()
    if (!token) {
      window.location.href = '/login'
      return
    }

    setMarkingId(id)

    try {
      const response = await axios.patch(
        `${gatewayBaseUrl}/api/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const updated = response.data?.data
      setItems((current) =>
        current.map((item) => {
          if (item._id !== id) {
            return item
          }

          return updated || { ...item, status: 'read', readAt: new Date().toISOString() }
        })
      )
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }

      setError(
        requestError?.response?.data?.error?.message ||
          'Could not mark notification as read. Please try again.'
      )
    } finally {
      setMarkingId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-cyan-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Notifications</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Patient alerts and reminders</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          See booking confirmations, appointment reminders, and payment updates in one place.
        </p>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : items.length}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Unread</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : unreadCount}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Read</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : items.length - unreadCount}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'read', label: 'Read' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition',
                filter === option.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Loading notifications...
          </div>
        ) : visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <article key={item._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                        statusStyles[item.status] || 'bg-slate-100 text-slate-700 ring-slate-200',
                      ].join(' ')}
                    >
                      {item.status || 'unknown'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.type || 'general'}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-900">{item.title || 'Untitled notification'}</h2>
                  <p className="text-sm leading-6 text-slate-600">{item.message || 'No message available.'}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <p>Created: {formatDateTime(item.createdAt)}</p>
                    <p>Read: {item.readAt ? formatDateTime(item.readAt) : 'Not read yet'}</p>
                  </div>
                </div>

                {item.status !== 'read' ? (
                  <button
                    type="button"
                    onClick={() => markAsRead(item._id)}
                    disabled={markingId === item._id}
                    className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {markingId === item._id ? 'Updating...' : 'Mark as read'}
                  </button>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No notifications in this view.
          </div>
        )}
      </section>
    </div>
  )
}