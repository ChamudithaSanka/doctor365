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
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  refunded: 'bg-blue-50 text-blue-700 ring-blue-200',
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Transactions & Payments</h1>
          <p className="mt-2 text-slate-600">Monitor all payment activity across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-600">Total</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{statusBreakdown.all}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-medium text-emerald-700">Success</div>
            <div className="mt-2 text-2xl font-bold text-emerald-900">{statusBreakdown.paid}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-medium text-amber-700">Pending</div>
            <div className="mt-2 text-2xl font-bold text-amber-900">{statusBreakdown.pending}</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-medium text-red-700">Failed</div>
            <div className="mt-2 text-2xl font-bold text-red-900">{statusBreakdown.failed}</div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-medium text-blue-700">Refunded</div>
            <div className="mt-2 text-2xl font-bold text-blue-900">{statusBreakdown.refunded}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Search by Transaction / Patient ID
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
                <option value="paid">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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

        {/* Table */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-slate-600">Loading transactions...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-slate-600">
              No transactions found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-slate-700">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-700">
                        Patient ID
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-700">Amount</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-700">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-700">Date & Time</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-700">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        onClick={() => handleRowClick(transaction._id)}
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-mono text-sm text-blue-600 hover:underline">
                          {transaction.transactionId || transaction.orderId}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.patientId}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                              statusStyles[transaction.status] || statusStyles.pending
                            }`}
                          >
                            {statusLabels[transaction.status] || transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.paymentMethod || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
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
