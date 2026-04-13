import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 text-slate-900">
      <div className="w-full max-w-2xl rounded-[2rem] border border-emerald-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Payment successful
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Thank you. Your payment was completed.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We have received your payment confirmation from PayHere. Your appointment booking will continue in the
          background.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Order ID:</span> {orderId || 'N/A'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Payment ID:</span> {paymentId || 'N/A'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/appointments"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            View appointments
          </Link>
          <Link
            to="/patient/dashboard"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
