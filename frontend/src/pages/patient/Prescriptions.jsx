import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'long' }).format(date)
}

export default function PatientPrescriptions() {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedPrescription, setExpandedPrescription] = useState(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()

    const loadPrescriptions = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/patients/me/prescriptions`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        const prescriptionList = Array.isArray(response.data?.data) ? response.data.data : []
        setPrescriptions(prescriptionList)
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          if (handleTokenError(requestError)) {
            return
          }

          setError(
            requestError?.response?.data?.error?.message ||
              'Unable to load prescriptions. Please try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadPrescriptions()
    return () => controller.abort()
  }, [navigate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Your Prescriptions</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage your medical prescriptions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          View and manage all prescriptions issued by your doctors. Keep track of your medications, dosages, and treatment
          instructions.
        </p>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      <section className="space-y-3">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Loading prescriptions...
          </div>
        ) : prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map((prescription, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedPrescription(expandedPrescription === index ? null : index)
                  }
                  className="w-full px-6 py-4 sm:p-6 text-left hover:bg-slate-50 transition"
                >
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Dr. {prescription.doctorName}
                        </h3>
                        <span className="text-sm text-slate-500">{formatDate(prescription.date)}</span>
                      </div>
                      {prescription.diagnosis && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                        </p>
                      )}
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Medications:</span> {prescription.medication?.length || 0}{' '}
                        medication{prescription.medication?.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <svg
                        className={`w-6 h-6 text-slate-400 transition transform ${
                          expandedPrescription === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Details */}
                {expandedPrescription === index && (
                  <div className="border-t border-slate-200 px-6 py-4 sm:p-6 bg-slate-50 space-y-4">
                    {/* Medications */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Medications</h4>
                      <div className="space-y-2">
                        {prescription.medication && prescription.medication.length > 0 ? (
                          prescription.medication.map((med, medIndex) => (
                            <div
                              key={medIndex}
                              className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-medium text-slate-900">{med.name}</p>
                                <span className="text-xs font-semibold bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5">
                                  {med.dosage}
                                </span>
                              </div>
                              <div className="grid gap-2 text-sm text-slate-600">
                                <p>
                                  <span className="font-medium">Frequency:</span> {med.frequency}
                                </p>
                                <p>
                                  <span className="font-medium">Duration:</span> {med.duration}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No medications listed</p>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    {prescription.instructions && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Additional Instructions</h4>
                        <p className="text-sm text-slate-600 rounded-2xl bg-white border border-slate-200 p-4">
                          {prescription.instructions}
                        </p>
                      </div>
                    )}

                    {/* Doctor Info */}
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Doctor ID:</span> {prescription.doctorId}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Issued on:</span> {new Intl.DateTimeFormat('en-LK', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        }).format(new Date(prescription.date))}
                      </p>
                    </div>

                    {/* Print Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => window.print()}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        🖨️ Print Prescription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <svg className="mx-auto w-16 h-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-slate-900 font-medium">No prescriptions yet</p>
            <p className="text-slate-500 text-sm mt-1">Your prescriptions from doctors will appear here</p>
          </div>
        )}
      </section>
    </div>
  )
}
