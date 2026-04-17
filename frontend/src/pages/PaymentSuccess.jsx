import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const message =
    'Your payment was received. The appointment status will update automatically to pending doctor approval.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-2xl rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-8 shadow-2xl backdrop-blur-md">
        <div className="inline-flex rounded-full bg-emerald-600/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 border border-emerald-600/50">
          Payment successful
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-100">Thank you. Your payment was completed.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          We have received your payment confirmation from PayHere.
        </p>

        <div className="mt-6 rounded-lg border border-slate-600/30 bg-slate-800/30 p-4 text-sm text-slate-300 backdrop-blur-sm">
          <p className="text-emerald-300">{message}</p>
        </div>

        <div className="mt-6 space-y-3 rounded-lg border border-slate-600/30 bg-slate-800/30 p-4 text-sm text-slate-300 backdrop-blur-sm">
          <p>
            <span className="font-semibold text-slate-200">Order ID:</span> {orderId || 'N/A'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/appointments"
            className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-orange-700 hover:to-orange-600"
          >
            View appointments
          </Link>
          <Link
            to="/patient/dashboard"
            className="rounded-lg border border-slate-600/30 bg-slate-800/20 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/40 backdrop-blur-sm"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
