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

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  } catch {
    return `LKR ${amount}`
  }
}

const statusStyles = {
  paid: 'bg-emerald-600/30 text-emerald-300 ring-emerald-600/50',
  pending: 'bg-amber-600/30 text-amber-300 ring-amber-600/50',
  failed: 'bg-red-600/30 text-red-300 ring-red-600/50',
  refunded: 'bg-blue-600/30 text-blue-300 ring-blue-600/50',
}

const statusLabels = {
  paid: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
}

export default function PatientPayments() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, paid, pending, failed, refunded

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()

    const loadPayments = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/payments/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        const paymentList = Array.isArray(response.data?.data) ? response.data.data : []
        setPayments(paymentList)
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          // Handle token errors
          if (handleTokenError(requestError)) {
            return
          }

          setError(
            requestError?.response?.data?.error?.message ||
              'Unable to load your payments. Please try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
    return () => controller.abort()
  }, [navigate])

  const filteredPayments = useMemo(() => {
    let filtered = payments

    if (filter !== 'all') {
      filtered = payments.filter((payment) => payment.status === filter)
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [payments, filter])

  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    refunded: payments.filter((p) => p.status === 'refunded').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    totalAmount: payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 px-6 py-10 text-slate-100 backdrop-blur-md">
        <h1 className="text-3xl font-bold">My Payments</h1>
        <p className="text-slate-300 mt-2">Track all your appointment payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 backdrop-blur-md">
          <p className="text-slate-400 text-sm mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-green-500/20 bg-green-600/10 p-4 backdrop-blur-md">
          <p className="text-slate-400 text-sm mb-1">Successful</p>
          <p className="text-2xl font-bold text-green-300">{stats.paid}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-600/10 p-4 backdrop-blur-md">
          <p className="text-slate-400 text-sm mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-300">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-600/10 p-4 backdrop-blur-md">
          <p className="text-slate-400 text-sm mb-1">Refunded</p>
          <p className="text-2xl font-bold text-indigo-300">{stats.refunded}</p>
        </div>
        <div className="rounded-lg border border-slate-500/20 bg-slate-700/20 p-4 backdrop-blur-md">
          <p className="text-slate-400 text-sm mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(stats.totalAmount)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 backdrop-blur-md overflow-x-auto">
        <div className="flex border-b border-purple-500/20">
          {['all', 'paid', 'pending', 'refunded', 'failed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-4 px-4 font-medium text-center transition-colors ${
                filter === tab
                  ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-600/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-600/10 text-red-300 px-4 py-3 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 text-center backdrop-blur-md">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
          <p className="text-slate-300 mt-4">Loading your payments...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPayments.length === 0 && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 text-center backdrop-blur-md">
          <svg
            className="mx-auto h-12 w-12 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-100">No payments found</h3>
          <p className="text-slate-400 mt-2">
            {filter === 'all'
              ? "You haven't made any payments yet."
              : `No ${filter} payments yet.`}
          </p>
        </div>
      )}

      {/* Payments Table */}
      {!loading && filteredPayments.length > 0 && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-500/20">
              <thead className="bg-purple-600/20 border-b border-purple-500/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-purple-600/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-slate-200">{payment.orderId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-100">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300 capitalize">
                        {payment.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                          statusStyles[payment.status] || 'bg-slate-700 text-slate-300 ring-slate-600'
                        }`}
                      >
                        {statusLabels[payment.status] || payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDateTime(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
