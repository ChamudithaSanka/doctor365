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

export default function AdminTransactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadTransactions = async (pageNum = 1) => {
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

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      if (dateFrom) {
        params.set('startDate', dateFrom)
      }

      if (dateTo) {
        params.set('endDate', dateTo)
      }

      const response = await axios.get(`${gatewayBaseUrl}/api/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data?.data || {}
      setTransactions(Array.isArray(data.items) ? data.items : [])
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
          'Unable to load transactions. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, dateFrom, dateTo])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
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
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleRowClick = (transactionId) => {
    navigate(`/admin/payment-results/${transactionId}`)
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      loadTransactions(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      loadTransactions(page + 1)
    }
  }

  const statusBreakdown = useMemo(() => {
    const breakdown = { all: 0, paid: 0, pending: 0, failed: 0, refunded: 0 }
    transactions.forEach((transaction) => {
      breakdown.all += 1
      breakdown[transaction.status] = (breakdown[transaction.status] || 0) + 1
    })
    return breakdown
  }, [transactions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Transactions & Payments</h1>
          <p className="mt-2 text-slate-400">Monitor all payment activity across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400">Total</div>
            <div className="mt-2 text-2xl font-bold text-slate-100">{statusBreakdown.all}</div>
          </div>
          <div className="rounded-lg border border-emerald-600/50 bg-emerald-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-emerald-300">Success</div>
            <div className="mt-2 text-2xl font-bold text-emerald-200">{statusBreakdown.paid}</div>
          </div>
          <div className="rounded-lg border border-amber-600/50 bg-amber-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-amber-300">Pending</div>
            <div className="mt-2 text-2xl font-bold text-amber-200">{statusBreakdown.pending}</div>
          </div>
          <div className="rounded-lg border border-red-600/50 bg-red-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-red-300">Failed</div>
            <div className="mt-2 text-2xl font-bold text-red-200">{statusBreakdown.failed}</div>
          </div>
          <div className="rounded-lg border border-blue-600/50 bg-blue-600/30 p-4 backdrop-blur-md">
            <div className="text-sm font-medium text-blue-300">Refunded</div>
            <div className="mt-2 text-2xl font-bold text-blue-200">{statusBreakdown.refunded}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Filters</h2>
            {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Search by Transaction / Patient ID
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="mt-1 block w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Status</label>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="mt-1 block w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-slate-100 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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

        {/* Table */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-slate-400">Loading transactions...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-slate-400">
              No transactions found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-purple-500/20 bg-purple-600/20">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-slate-300">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-300">
                        Patient ID
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-300">Amount</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-300">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-300">Date & Time</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-300">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        onClick={() => handleRowClick(transaction._id)}
                        className="cursor-pointer transition-colors hover:bg-purple-600/10"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-orange-400 hover:underline">
                          {transaction.transactionId || transaction.orderId}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {transaction.patientId}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-100">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-lg px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                              statusStyles[transaction.status] || statusStyles.pending
                            }`}
                          >
                            {statusLabels[transaction.status] || transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {transaction.paymentMethod || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-purple-500/20 bg-purple-600/20 px-6 py-4">
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
