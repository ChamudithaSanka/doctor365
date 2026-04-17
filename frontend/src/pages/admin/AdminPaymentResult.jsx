import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDateTime = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'long',
    timeStyle: 'medium',
  }).format(date)
}

const formatCurrency = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  } catch {
    return `${currency || 'USD'} ${amount}`
  }
}

const statusStyles = {
  paid: 'bg-emerald-600/30 text-emerald-300 border-emerald-600/50',
  pending: 'bg-amber-600/30 text-amber-300 border-amber-600/50',
  failed: 'bg-red-600/30 text-red-300 border-red-600/50',
  refunded: 'bg-blue-600/30 text-blue-300 border-blue-600/50',
}

const statusLabels = {
  paid: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
}

const statusIcons = {
  paid: '✓',
  pending: '⏳',
  failed: '✕',
  refunded: '↺',
}

export default function AdminPaymentResult() {
  const navigate = useNavigate()
  const { transactionId } = useParams()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTransaction = async () => {
      setLoading(true)
      setError('')

      try {
        const token = getToken()
        if (!token) {
          navigate('/login')
          return
        }

        const response = await axios.get(`${gatewayBaseUrl}/api/payments/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = response.data?.data
        if (data) {
          setTransaction(data)
        } else {
          setError('Payment details not found')
        }
      } catch (requestError) {
        if (handleTokenError(requestError)) {
          return
        }

        if (requestError?.response?.status === 404) {
          setError('Payment not found')
        } else {
          setError(
            requestError?.response?.data?.error?.message ||
              'Unable to load payment details. Please try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    if (transactionId) {
      loadTransaction()
    }
  }, [transactionId, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950">
        <div className="text-slate-400">Loading payment details...</div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate('/admin/transactions')}
            className="mb-6 inline-flex items-center text-orange-400 hover:text-orange-300"
          >
            ← Back to Transactions
          </button>

          <div className="rounded-lg border border-red-600/50 bg-red-600/30 p-6 text-red-300 backdrop-blur-md">
            {error || 'Payment not found'}
          </div>
        </div>
      </div>
    )
  }

  const statusStyle = statusStyles[transaction.status] || statusStyles.pending
  const statusLabel = statusLabels[transaction.status] || transaction.status
  const statusIcon = statusIcons[transaction.status] || '•'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/transactions')}
          className="mb-6 inline-flex items-center text-orange-400 hover:text-orange-300"
        >
          ← Back to Transactions
        </button>

        {/* Header with Status */}
        <div className={`mb-8 rounded-lg border ${statusStyle} p-6 backdrop-blur-md`}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Payment Result</h1>
              <p className="mt-2 text-sm opacity-75">Transaction ID: {transaction.transactionId || transaction.orderId}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold opacity-50">{statusIcon}</div>
              <div className="mt-2 inline-block rounded-full px-4 py-2 text-sm font-semibold" style={{backgroundColor: 'currentColor', color: 'white', opacity: 0.2, mixBlendMode: 'multiply'}}>
                <span className="font-bold text-current">{statusLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Card */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
              <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase">Amount</h2>
              <div className="text-4xl font-bold text-slate-100">
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Payment Method: <span className="font-medium capitalize text-slate-300">{transaction.paymentMethod}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
              <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase">Payment Details</h2>
              <dl className="space-y-4">
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <dt className="text-sm text-slate-400">Payment ID</dt>
                  <dd className="font-mono text-sm font-medium text-slate-100">{transaction._id}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <dt className="text-sm text-slate-400">Transaction ID</dt>
                  <dd className="font-mono text-sm font-medium text-slate-100">
                    {transaction.transactionId || transaction.orderId}
                  </dd>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <dt className="text-sm text-slate-400">Order ID</dt>
                  <dd className="font-mono text-sm font-medium text-slate-100">{transaction.orderId}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-purple-500/20">
                  <dt className="text-sm text-slate-400">Appointment ID</dt>
                  <dd className="font-mono text-sm font-medium text-slate-100">
                    {transaction.appointmentId}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-sm text-slate-400">Amount</dt>
                  <dd className="font-medium text-slate-100">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
              <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase">Transaction Timeline</h2>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <div className="h-8 w-0.5 bg-purple-500/20"></div>
                  </div>
                  <div className="py-1">
                    <div className="text-sm font-medium text-slate-100">Created</div>
                    <div className="text-sm text-slate-400">{formatDateTime(transaction.createdAt)}</div>
                  </div>
                </div>

                {/* Paid/Failed */}
                {(transaction.paidAt || transaction.status === 'failed' || transaction.status === 'refunded') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          transaction.status === 'paid' ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                      ></div>
                    </div>
                    <div className="py-1">
                      <div className="text-sm font-medium text-slate-100">
                        {transaction.paidAt ? 'Payment Successful' : `Payment ${statusLabel}`}
                      </div>
                      <div className="text-sm text-slate-400">
                        {transaction.paidAt
                          ? formatDateTime(transaction.paidAt)
                          : formatDateTime(transaction.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
                <h2 className="mb-4 text-sm font-semibold text-slate-300 uppercase">Additional Info</h2>
                <pre className="overflow-auto rounded-md bg-slate-800/30 border border-slate-600/30 p-3 text-xs text-slate-300">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase">Status</h3>
              <div
                className={`rounded-lg border ${statusStyle} p-4 text-center`}
              >
                <div className="text-3xl font-bold opacity-50 mb-2">{statusIcon}</div>
                <div className="text-lg font-bold">{statusLabel}</div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase">User Info</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-slate-400">Patient ID</dt>
                  <dd className="mt-1 font-mono text-sm text-slate-100">{transaction.patientId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-400">Email</dt>
                  <dd className="mt-1 text-sm text-slate-100 break-all">
                    {transaction.customerEmail || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-400">Phone</dt>
                  <dd className="mt-1 text-sm text-slate-100">{transaction.customerPhone || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Dates Card */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-sm font-semibold text-slate-300 uppercase">Dates</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-400">Created</dt>
                  <dd className="mt-1 text-slate-100">{formatDateTime(transaction.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-400">Updated</dt>
                  <dd className="mt-1 text-slate-100">{formatDateTime(transaction.updatedAt)}</dd>
                </div>
                {transaction.paidAt && (
                  <div>
                    <dt className="text-xs font-medium text-slate-400">Paid</dt>
                    <dd className="mt-1 text-slate-100">{formatDateTime(transaction.paidAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
