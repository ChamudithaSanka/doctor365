import { useEffect, useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const getToken = () => localStorage.getItem('doctor365_accessToken')

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(d)
}

export default function MedicalHistory() {
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setError('You need to sign in to view your medical history.')
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [profileRes, prescriptionsRes] = await Promise.all([
          axios.get(`${gatewayBaseUrl}/api/patients/me`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          axios.get(`${gatewayBaseUrl}/api/patients/me/prescriptions`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
        ])
        setPatient(profileRes.data?.data || null)
        setPrescriptions(Array.isArray(prescriptionsRes.data?.data) ? prescriptionsRes.data.data : [])
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err?.response?.data?.error?.message || 'Unable to load your medical history.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

  // medicalHistory array from patient profile
  const history = patient?.medicalHistory || []
  const medHistorySummary = patient?.medicalHistorySummary || ''

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">My health</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Medical History</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your complete health record loaded live from your patient database.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Summary stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Recorded conditions', value: loading ? '—' : history.length },
            { label: 'Prescriptions', value: loading ? '—' : prescriptions.length },
            { label: 'Medications', value: loading ? '—' : prescriptions.reduce((acc, p) => acc + (p.medication?.length || 0), 0) },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* General summary from profile */}
        {(medHistorySummary || loading) && (
          <div className="mb-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-[0.15em]">General summary</p>
            <p className="mt-2 text-sm text-blue-900">
              {loading ? 'Loading…' : medHistorySummary || 'No summary provided.'}
            </p>
          </div>
        )}

        {/* Conditions from medicalHistory array */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Conditions &amp; Diagnoses</h2>
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Loading conditions…
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No recorded conditions found.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200"
                >
                  <button
                    onClick={() => setExpanded(expanded === item._id ? null : item._id)}
                    className="w-full p-5 text-left"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{item.condition}</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Diagnosed {formatDate(item.date)}
                          {item.doctorName ? ` · ${item.doctorName}` : ''}
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${expanded === item._id ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>

                  {expanded === item._id && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Treatment: </span>{item.treatment || '—'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions → Current Medications */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Prescriptions &amp; Medications</h2>
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Loading prescriptions…
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No prescriptions recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription._id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{prescription.doctorName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{formatDate(prescription.date)}</p>
                    </div>
                    {prescription.isDigital && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Digital
                      </span>
                    )}
                  </div>

                  {prescription.instructions && (
                    <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span className="font-semibold">Instructions: </span>{prescription.instructions}
                    </p>
                  )}

                  {Array.isArray(prescription.medication) && prescription.medication.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
                      {prescription.medication.map((med, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between ${
                            idx < prescription.medication.length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{med.name}</p>
                            {med.dosage && (
                              <p className="mt-0.5 text-sm text-slate-500">Dosage: {med.dosage}</p>
                            )}
                            {med.duration && (
                              <p className="text-sm text-slate-500">Duration: {med.duration}</p>
                            )}
                          </div>
                          {med.frequency && (
                            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {med.frequency}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}