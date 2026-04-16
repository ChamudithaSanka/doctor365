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

const fileIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export default function DoctorReports() {
  // ── Patients with appointments ──────────────────────────────────────────────
  const [patientList, setPatientList] = useState([])   // [{ patientId, patientEmail, patientPhone }]
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [patientsError, setPatientsError] = useState('')

  // ── Reports for selected patient ────────────────────────────────────────────
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportsError, setReportsError] = useState('')

  // ── Load appointments to get unique patients ─────────────────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setPatientsError('You need to sign in as a doctor.')
      setLoadingPatients(false)
      return
    }

    const controller = new AbortController()

    const loadPatients = async () => {
      setLoadingPatients(true)
      setPatientsError('')
      try {
        const res = await axios.get(`${gatewayBaseUrl}/api/appointments/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        const appts = Array.isArray(res.data?.data) ? res.data.data : []

        // Build unique patient list from appointment data
        const seen = new Set()
        const unique = []
        for (const apt of appts) {
          if (apt.patientId && !seen.has(apt.patientId)) {
            seen.add(apt.patientId)
            unique.push({
              patientId: apt.patientId,
              patientEmail: apt.patientEmail || null,
              patientPhone: apt.patientPhone || null,
            })
          }
        }
        setPatientList(unique)
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setPatientsError(err?.response?.data?.error?.message || 'Unable to load patient list.')
        }
      } finally {
        setLoadingPatients(false)
      }
    }

    loadPatients()
    return () => controller.abort()
  }, [])

  // ── Load reports when a patient is selected ──────────────────────────────────
  const handleSelectPatient = async (patientId) => {
    if (patientId === selectedPatientId) return
    setSelectedPatientId(patientId)
    setSelectedPatientName('')
    setReports([])
    setReportsError('')
    setLoadingReports(true)

    const token = getToken()
    if (!token) {
      setReportsError('You need to sign in.')
      setLoadingReports(false)
      return
    }

    try {
      const res = await axios.get(`${gatewayBaseUrl}/api/patients/${patientId}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReports(Array.isArray(res.data?.data) ? res.data.data : [])
      setSelectedPatientName(res.data?.patientName || '')
    } catch (err) {
      setReportsError(err?.response?.data?.error?.message || 'Unable to load reports for this patient.')
    } finally {
      setLoadingReports(false)
    }
  }

  const totalReports = patientList.reduce((acc) => acc, 0)

  const handleView = async (reportId) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await axios.get(`${gatewayBaseUrl}/api/patients/reports/${reportId}/file`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const contentType = res.headers['content-type']
      const file = new Blob([res.data], { type: contentType })
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
    } catch (err) {
      console.error('View failed', err)
      alert('Unable to open the file. Please try downloading it instead.')
    }
  }

  const handleDownload = async (reportId, filename) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await axios.get(`${gatewayBaseUrl}/api/patients/reports/${reportId}/file?download=true`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
      alert('Download failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Doctor portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Patient Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            View uploaded reports from patients who have booked appointments with you.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Patients with appointments', value: loadingPatients ? '—' : patientList.length },
            { label: 'Selected patient reports', value: loadingReports ? '—' : (selectedPatientId ? reports.length : '—') },
            { label: 'Data source', value: 'patient_db' },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {patientsError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {patientsError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Patient list */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-2">
              Your patients
            </p>
            {loadingPatients ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Loading patients...
              </div>
            ) : patientList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                No patients with appointments yet.
              </div>
            ) : (
              patientList.map((p) => {
                const initials = p.patientId.slice(0, 2).toUpperCase()
                return (
                  <button
                    key={p.patientId}
                    onClick={() => handleSelectPatient(p.patientId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedPatientId === p.patientId
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {p.patientEmail || `Patient ${p.patientId.slice(-6)}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: <span className="font-mono">{p.patientId.slice(-8)}</span>
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Reports panel */}
          <div>
            {!selectedPatientId ? (
              <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                Select a patient on the left to view their reports.
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  {selectedPatientName
                    ? `${selectedPatientName}'s Reports`
                    : `Patient ${selectedPatientId.slice(-8)} — Reports`}
                </h2>

                {reportsError && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {reportsError}
                  </div>
                )}

                {loadingReports ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Loading reports...
                  </div>
                ) : reports.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    This patient has not uploaded any reports yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report._id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                              {fileIcon}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{report.title || report.originalName}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {report.originalName} &middot; Uploaded {formatDate(report.uploadDate)}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">{report.mimeType}</p>
                            </div>
                            </div>
                            
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => handleView(report._id)}
                              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownload(report._id, report.originalName)}
                              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}