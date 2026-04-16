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

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()

    const loadPatientData = async () => {
      setLoading(true)
      setError('')

      try {
        const [patientRes, reportsRes, prescriptionsRes] = await Promise.allSettled([
        axios.get(`${gatewayBaseUrl}/api/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        axios.get(`${gatewayBaseUrl}/api/patients/${patientId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        axios.get(`${gatewayBaseUrl}/api/patients/${patientId}/prescriptions`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
      ])

      if (patientRes.status === 'fulfilled' && patientRes.value.data?.success) {
        setPatient(patientRes.value.data.data)
      } else if (patientRes.status === 'rejected') {
        if (patientRes.reason?.name !== 'CanceledError') {
          if (handleTokenError(patientRes.reason)) return
          setError('Unable to load patient information. Please try again.')
        }
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value.data?.success) {
        setReports(Array.isArray(reportsRes.value.data.data) ? reportsRes.value.data.data : [])
      }

      if (prescriptionsRes.status === 'fulfilled' && prescriptionsRes.value.data?.success) {
        setPrescriptions(Array.isArray(prescriptionsRes.value.data.data) ? prescriptionsRes.value.data.data : [])
      }
      } catch (requestError) {
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
        setLoading(false)
      }
    }

    loadPatientData()
    return () => controller.abort()
  }, [patientId, navigate])

  const handleDownload = async (reportId, filename) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await axios.get(
        `${gatewayBaseUrl}/api/patients/reports/${reportId}/file?download=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      )
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
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Patient not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
          >
            ← Back to Appointments
          </button>
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
              <div>
                <p className="text-gray-600">Date of Birth</p>
                <p className="font-medium text-gray-900">{formatDate(patient.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-gray-600">Gender</p>
                <p className="font-medium text-gray-900 capitalize">{patient.gender}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{patient.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">City</p>
                <p className="font-medium text-gray-900">{patient.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
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
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
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
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Emergency Contact</p>
                    <p className="font-medium text-gray-900">{patient.emergencyContact}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{patient.address}</p>
                  </div>
                </div>
              </div>

              {patient.medicalHistorySummary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical Summary</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800 text-sm whitespace-pre-wrap">
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
            <div className="bg-white rounded-lg shadow p-6">
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No reports uploaded</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{report.title || report.originalName}</p>
                        <p className="text-sm text-gray-600">{report.mimeType}</p>
                      </div>
                      <button
                      onClick={() => handleDownload(report._id, report.originalName)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Download
                    </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white rounded-lg shadow p-6">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No prescriptions</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Dr. {rx.doctorName}</p>
                          <p className="text-sm text-gray-600">{formatDate(rx.date)}</p>
                        </div>
                        {rx.diagnosis && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                            {rx.diagnosis}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {rx.medication?.map?.((med, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            <p className="font-medium">{med.name} - {med.dosage}</p>
                            <p className="text-gray-600">{med.frequency}</p>
                            {med.duration && <p className="text-gray-600">Duration: {med.duration}</p>}
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
