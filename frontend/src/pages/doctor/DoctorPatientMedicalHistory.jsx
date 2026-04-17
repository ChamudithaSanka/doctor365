import { useEffect, useState } from 'react'
import axios from 'axios'
import { getToken, handleTokenError } from '../../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatDate = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'short',
  }).format(date)
}

const formatDateTime = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function DoctorPatientMedicalHistory({ patientId, patientName, onClose }) {
  const [medicalHistory, setMedicalHistory] = useState([])
  const [summary, setSummary] = useState('')
  const [editSummary, setEditSummary] = useState(false)
  const [editSummaryText, setEditSummaryText] = useState('')
  const [summarySubmitting, setSummarySubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [editingEntryId, setEditingEntryId] = useState('')
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    condition: '',
    treatment: '',
    notes: '',
  })

  // Load medical history
  useEffect(() => {
    if (!patientId) return

    const token = getToken()
    if (!token) return

    const controller = new AbortController()

    const loadMedicalHistory = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/patients/${patientId}/medical-history`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (response.data?.success) {
          setMedicalHistory(response.data.data?.medicalHistory || [])
          setSummary(response.data.data?.medicalHistorySummary || '')
          setEditSummaryText(response.data.data?.medicalHistorySummary || '')
        }
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') {
          if (handleTokenError(requestError)) {
            return
          }
          setError(
            requestError?.response?.data?.error?.message ||
              'Unable to load medical history. Please try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadMedicalHistory()
    return () => controller.abort()
  }, [patientId])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddMedicalHistory = async (e) => {
    e.preventDefault()
    const token = getToken()

    if (!formData.condition.trim() || !formData.treatment.trim()) {
      setError('Please fill in condition and treatment fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const requestBody = {
        date: new Date(formData.date),
        condition: formData.condition,
        treatment: formData.treatment,
        notes: formData.notes,
      }

      const response = editingEntryId
        ? await axios.put(
            `${gatewayBaseUrl}/api/patients/${patientId}/medical-history/${editingEntryId}`,
            requestBody,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        : await axios.post(
            `${gatewayBaseUrl}/api/patients/${patientId}/medical-history`,
            requestBody,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

      if (response.data?.success) {
        setMedicalHistory(response.data.data?.medicalHistory || [])
        setFormData({
          date: new Date().toISOString().split('T')[0],
          condition: '',
          treatment: '',
          notes: '',
        })
        setEditingEntryId('')
        setShowForm(false)
        setSuccessMessage(
          editingEntryId
            ? 'Medical history record updated successfully'
            : 'Medical history record added successfully'
        )
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to add medical history. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveSummary = async () => {
    const token = getToken()
    if (!token) return

    setSummarySubmitting(true)
    setError('')

    try {
      const response = await axios.patch(
        `${gatewayBaseUrl}/api/patients/${patientId}/medical-history/summary`,
        {
          medicalHistorySummary: editSummaryText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data?.success) {
        setSummary(response.data.data?.medicalHistorySummary || '')
        setEditSummaryText(response.data.data?.medicalHistorySummary || '')
        setEditSummary(false)
        setSuccessMessage('Medical summary updated successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to update medical summary. Please try again.'
      )
    } finally {
      setSummarySubmitting(false)
    }
  }

  const handleStartEditRecord = (entry) => {
    setShowForm(true)
    setEditingEntryId(entry._id || '')
    setFormData({
      date: entry?.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      condition: entry?.condition || '',
      treatment: entry?.treatment || '',
      notes: entry?.notes || '',
    })
    setError('')
  }

  return (
    <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg shadow-lg backdrop-blur-md">
      {/* Header */}
      <div className="border-b border-purple-500/20 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Medical History</h2>
          <p className="text-sm text-slate-400 mt-1">{patientName}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-emerald-600/30 border border-emerald-600/50 text-emerald-300 px-4 py-3 rounded-lg backdrop-blur-md">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/30 border border-red-600/50 text-red-300 px-4 py-3 rounded-lg backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Medical Summary Section */}
        {!loading && (
          <div className="bg-indigo-600/10 rounded-lg p-4 border border-indigo-600/30">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="font-semibold text-indigo-200">Patient Medical Summary</h3>
              {!editSummary && (
                <button
                  type="button"
                  onClick={() => setEditSummary(true)}
                  className="text-indigo-300 hover:text-indigo-200 text-xs font-semibold"
                >
                  Edit Summary
                </button>
              )}
            </div>

            {editSummary ? (
              <div className="space-y-3">
                <textarea
                  value={editSummaryText}
                  onChange={(e) => setEditSummaryText(e.target.value)}
                  rows="4"
                  placeholder="Write a concise clinical summary for this patient..."
                  className="w-full px-3 py-2 border border-indigo-600/30 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm bg-slate-800/30 text-slate-100 placeholder-slate-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={summarySubmitting}
                    onClick={handleSaveSummary}
                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {summarySubmitting ? 'Saving...' : 'Save Summary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditSummary(false)
                      setEditSummaryText(summary)
                    }}
                    className="px-3 py-2 border border-indigo-600/30 text-indigo-300 rounded-lg hover:bg-indigo-600/10 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-indigo-200 text-sm whitespace-pre-wrap">
                {summary || 'No medical summary on file.'}
              </p>
            )}
          </div>
        )}

        {/* Add Medical History Form */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Medical Records</h3>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true)
                  setEditingEntryId('')
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    condition: '',
                    treatment: '',
                    notes: '',
                  })
                }}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                + Add Record
              </button>
            )}
          </div>

          {showForm && (
            <form
              onSubmit={handleAddMedicalHistory}
              className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-4 mb-6 space-y-4 backdrop-blur-sm"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-600/30 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-sm bg-slate-800/30 text-slate-100 focus:bg-slate-800/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Condition <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="condition"
                  placeholder="e.g., Hypertension, Diabetes, Respiratory infection"
                  value={formData.condition}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-600/30 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-sm bg-slate-800/30 text-slate-100 placeholder-slate-500 focus:bg-slate-800/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Treatment <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="treatment"
                  placeholder="e.g., Started lisinopril 10mg daily, prescribed antibiotics..."
                  value={formData.treatment}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-600/30 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-sm bg-slate-800/30 text-slate-100 placeholder-slate-500 focus:bg-slate-800/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  placeholder="Any additional clinical notes..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-600/30 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-sm bg-slate-800/30 text-slate-100 placeholder-slate-500 focus:bg-slate-800/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingEntryId ? 'Update Record' : 'Save Record'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingEntryId('')
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      condition: '',
                      treatment: '',
                      notes: '',
                    })
                    setError('')
                  }}
                  className="px-4 py-2 border border-slate-600/30 text-slate-300 rounded-lg hover:bg-slate-700/30 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-8 text-center backdrop-blur-sm">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
              </div>
              <p className="text-slate-400 mt-3 text-sm">Loading medical history...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && medicalHistory.length === 0 && !showForm && (
            <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-8 text-center backdrop-blur-sm">
              <svg
                className="mx-auto h-10 w-10 text-slate-600"
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
              <h4 className="mt-3 text-sm font-medium text-slate-100">No medical records</h4>
              <p className="text-slate-400 text-xs mt-1">Start documenting patient's medical history</p>
            </div>
          )}

          {/* Medical History Timeline */}
          {!loading && medicalHistory.length > 0 && (
            <div className="space-y-3">
              {medicalHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div
                    key={index}
                    className="border border-purple-500/20 rounded-lg p-4 bg-purple-600/5 hover:shadow-md transition-shadow backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-300 bg-slate-800/50 border border-slate-600/30 px-2 py-1 rounded">
                            {formatDate(entry.date)}
                          </span>
                          {entry.doctorName && (
                            <span className="text-xs bg-indigo-600/30 text-indigo-300 px-2 py-1 rounded font-medium border border-indigo-600/50">
                              Dr. {entry.doctorName}
                            </span>
                          )}
                        </div>
                      </div>
                      {entry?._id && (
                        <button
                          type="button"
                          onClick={() => handleStartEditRecord(entry)}
                          className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-100 text-sm mb-1">
                      {entry.condition}
                    </h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap mb-2">
                      {entry.treatment}
                    </p>
                    {entry.notes && (
                      <p className="text-slate-400 text-xs italic border-l-2 border-slate-600/50 pl-3">
                        {entry.notes}
                      </p>
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
