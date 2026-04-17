import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'
import DoctorPatientMedicalHistory from './DoctorPatientMedicalHistory'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDate = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'short',
  }).format(date)
}

export default function DoctorPatientProfile() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [reports, setReports] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // overview, medical-history, reports, prescriptions

  const parseFilenameFromDisposition = (contentDisposition, fallbackName) => {
    const fallback = fallbackName || 'report'
    if (!contentDisposition) return fallback

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1])
    }

    const quotedMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
    if (quotedMatch?.[1]) {
      return quotedMatch[1]
    }

    return fallback
  }

  const handleReportFileAction = async (report, action = 'view') => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setError('')

      const response = await axios.get(
        `${gatewayBaseUrl}/api/patients/reports/${report._id}/file${action === 'download' ? '?download=true' : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      )

      const blobUrl = URL.createObjectURL(response.data)

      if (action === 'view') {
        window.open(blobUrl, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60 * 1000)
        return
      }

      const filename = parseFilenameFromDisposition(
        response.headers['content-disposition'],
        report.originalName || report.title
      )

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }

      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to open report file. Please try again.'
      )
    }
  }

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()
    let isActive = true

    const loadPatientData = async () => {
      if (isActive) {
        setLoading(true)
        setError('')
      }

      try {
        const patientRes = await axios.get(`${gatewayBaseUrl}/api/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!patientRes.data?.success || !patientRes.data?.data) {
          throw new Error('Patient profile not found')
        }

        if (!isActive) return

        setPatient(patientRes.data.data)

        const [reportsResult, prescriptionsResult] = await Promise.allSettled([
          axios.get(`${gatewayBaseUrl}/api/patients/${patientId}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          axios.get(`${gatewayBaseUrl}/api/patients/${patientId}/prescriptions`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
        ])

        if (!isActive) return

        if (reportsResult.status === 'fulfilled' && reportsResult.value.data?.success) {
          setReports(Array.isArray(reportsResult.value.data.data) ? reportsResult.value.data.data : [])
        } else {
          setReports([])
        }

        if (prescriptionsResult.status === 'fulfilled' && prescriptionsResult.value.data?.success) {
          setPrescriptions(
            Array.isArray(prescriptionsResult.value.data.data) ? prescriptionsResult.value.data.data : []
          )
        } else {
          setPrescriptions([])
        }
      } catch (requestError) {
        if (!isActive) return

        if (requestError.name !== 'CanceledError') {
          if (handleTokenError(requestError)) {
            return
          }
          setError(
            requestError?.response?.data?.error?.message ||
              'Unable to load patient information. Please try again.'
          )
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadPatientData()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [patientId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 py-8 px-4 flex items-center justify-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-400 hover:text-orange-300 mb-4"
          >
            ← Back
          </button>
          <div className="bg-red-600/30 border border-red-600/50 text-red-300 px-4 py-3 rounded-lg backdrop-blur-md">
            {error || 'Patient not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-400 hover:text-orange-300 mb-4 text-sm font-medium"
          >
            ← Back to Appointments
          </button>
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg shadow backdrop-blur-md p-6">
            <h1 className="text-3xl font-bold text-slate-100">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
              <div>
                <p className="text-slate-400">Date of Birth</p>
                <p className="font-medium text-slate-100">{formatDate(patient.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-slate-400">Gender</p>
                <p className="font-medium text-slate-100 capitalize">{patient.gender}</p>
              </div>
              <div>
                <p className="text-slate-400">Phone</p>
                <p className="font-medium text-slate-100">{patient.phone}</p>
              </div>
              <div>
                <p className="text-slate-400">City</p>
                <p className="font-medium text-slate-100">{patient.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg shadow backdrop-blur-md mb-6">
          <div className="flex border-b border-purple-500/20">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'medical-history', label: 'Medical History' },
              { id: 'reports', label: 'Reports', count: reports.length },
              { id: 'prescriptions', label: 'Prescriptions', count: prescriptions.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 font-medium text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-400 border-orange-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                {tab.label} {tab.count !== undefined && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg shadow backdrop-blur-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="font-medium text-slate-100">{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Emergency Contact</p>
                    <p className="font-medium text-slate-100">{patient.emergencyContact}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400">Address</p>
                    <p className="font-medium text-slate-100">{patient.address}</p>
                  </div>
                </div>
              </div>

              {patient.medicalHistorySummary && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Medical Summary</h3>
                  <div className="bg-indigo-600/10 rounded-lg p-4 border border-indigo-600/30">
                    <p className="text-indigo-200 text-sm whitespace-pre-wrap">
                      {patient.medicalHistorySummary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'medical-history' && (
            <DoctorPatientMedicalHistory
              patientId={patientId}
              patientName={`${patient.firstName} ${patient.lastName}`}
            />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg shadow backdrop-blur-md p-6">
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-slate-100">No reports uploaded</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="border border-purple-500/20 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow bg-purple-600/5"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{report.title || report.originalName}</p>
                        <p className="text-sm text-slate-400">{report.mimeType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReportFileAction(report, 'view')}
                          className="px-4 py-2 border border-orange-600/50 text-orange-300 bg-orange-600/10 rounded-lg hover:bg-orange-600/20 text-sm font-medium backdrop-blur-sm"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReportFileAction(report, 'download')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg shadow backdrop-blur-md p-6">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-slate-100">No prescriptions</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx, index) => (
                    <div
                      key={index}
                      className="border border-purple-500/20 rounded-lg p-4 hover:shadow-md transition-shadow bg-purple-600/5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-slate-400">Dr. {rx.doctorName}</p>
                          <p className="text-sm text-slate-400">{formatDate(rx.date)}</p>
                        </div>
                        {rx.diagnosis && (
                          <span className="text-xs bg-indigo-600/30 text-indigo-300 px-2 py-1 rounded font-medium border border-indigo-600/50">
                            {rx.diagnosis}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {rx.medication?.map?.((med, idx) => (
                          <div key={idx} className="text-sm text-slate-100">
                            <p className="font-medium">{med.name} - {med.dosage}</p>
                            <p className="text-slate-400">{med.frequency}</p>
                            {med.duration && <p className="text-slate-400">Duration: {med.duration}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
