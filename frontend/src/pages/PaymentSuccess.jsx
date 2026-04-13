import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')
  const [creating, setCreating] = useState(true)
  const [appointmentId, setAppointmentId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const createAppointmentAfterPayment = async () => {
      if (!orderId) {
        setCreating(false)
        setError('Missing order id in return URL. Unable to confirm appointment creation.')
        return
      }

      const createdKey = `appointment_created_${orderId}`
      const createdAppointmentId = sessionStorage.getItem(createdKey)
      if (createdAppointmentId) {
        setAppointmentId(createdAppointmentId)
        setCreating(false)
        return
      }

      const pendingRaw = sessionStorage.getItem('pendingAppointmentAfterPayment')
      if (!pendingRaw) {
        setCreating(false)
        setError('No pending appointment data found. Please contact support if payment was charged.')
        return
      }

      let pending
      try {
        pending = JSON.parse(pendingRaw)
      } catch {
        setCreating(false)
        setError('Pending appointment data is invalid. Please try booking again.')
        return
      }

      if (pending.orderId !== orderId) {
        setCreating(false)
        setError('Order mismatch detected. Please try booking again.')
        return
      }

      const token = getToken()
      if (!token) {
        setCreating(false)
        setError('You are not logged in. Please log in and check your appointments.')
        return
      }

      try {
        const response = await axios.post(
          `${gatewayBaseUrl}/api/appointments`,
          {
            doctorId: pending.doctorId,
            appointmentDate: pending.appointmentDate,
            appointmentTime: pending.appointmentTime,
            reason: pending.reason,
            notes: pending.notes || '',
            paymentOrderId: orderId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const createdId = response?.data?.data?._id || ''
        if (createdId) {
          setAppointmentId(createdId)
          sessionStorage.setItem(createdKey, createdId)
        }
        sessionStorage.removeItem('pendingAppointmentAfterPayment')
      } catch (requestError) {
        handleTokenError(requestError)
        setError(requestError?.response?.data?.error?.message || 'Payment succeeded, but appointment creation failed.')
      } finally {
        setCreating(false)
      }
    }

    createAppointmentAfterPayment()
  }, [orderId])

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

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {creating ? (
            <p>Creating your appointment now...</p>
          ) : error ? (
            <p className="text-red-700">{error}</p>
          ) : (
            <p className="text-emerald-700">
              Appointment created successfully{appointmentId ? ` (ID: ${appointmentId})` : ''}.
            </p>
          )}
        </div>

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
