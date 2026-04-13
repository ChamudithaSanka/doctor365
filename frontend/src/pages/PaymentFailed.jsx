import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentFailed() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const statusCode = searchParams.get('status_code')

  useEffect(() => {
    sessionStorage.removeItem('pendingAppointmentAfterPayment')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 text-slate-900">
      <div className="w-full max-w-2xl rounded-[2rem] border border-red-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="inline-flex rounded-full bg-red-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
          Payment failed
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Your payment could not be completed.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This can happen due to bank rejection, timeout, or network interruption. Please try again.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Order ID:</span> {orderId || 'N/A'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Gateway status code:</span> {statusCode || 'N/A'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/appointments/book"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Retry payment
          </Link>
          <Link
            to="/patient/dashboard"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
