import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentCancel() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  useEffect(() => {
    sessionStorage.removeItem('pendingAppointmentAfterPayment')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 text-slate-900">
      <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Payment cancelled
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Payment was cancelled.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No money was charged. You can return and try payment again when you are ready.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Order ID:</span> {orderId || 'N/A'}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/doctors"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Back to Doctors
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
