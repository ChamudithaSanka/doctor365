import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function PatientMedicalHistory() {
  const navigate = useNavigate()
  const [medicalHistory, setMedicalHistory] = useState([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editSummary, setEditSummary] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    condition: '',
    treatment: '',
  })
  const [editSummaryText, setEditSummaryText] = useState('')

  // Load medical history
  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const controller = new AbortController()

    const loadMedicalHistory = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/patients/me/medical-history`, {
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
              'Unable to load your medical history. Please try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadMedicalHistory()
    return () => controller.abort()
  }, [navigate])

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
      setError('Please fill in all fields')
      return
    }

    try {
      const response = await axios.put(
        `${gatewayBaseUrl}/api/patients/me/medical-history`,
        {
          medicalHistory: [
            ...medicalHistory,
            {
              date: new Date(formData.date),
              condition: formData.condition,
              treatment: formData.treatment,
            },
          ],
        },
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
        })
        setShowForm(false)
        setError('')
      }
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to add medical history. Please try again.'
      )
    }
  }

  const handleSaveSummary = async () => {
    const token = getToken()

    try {
      const response = await axios.put(
        `${gatewayBaseUrl}/api/patients/me`,
        {
          medicalHistorySummary: editSummaryText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data?.success) {
        setSummary(editSummaryText)
        setEditSummary(false)
        setError('')
      }
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to save summary. Please try again.'
      )
    }
  }

  const handleDeleteEntry = async (index) => {
    const token = getToken()

    try {
      const updatedHistory = medicalHistory.filter((_, i) => i !== index)
      const response = await axios.put(
        `${gatewayBaseUrl}/api/patients/me/medical-history`,
        {
          medicalHistory: updatedHistory,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data?.success) {
        setMedicalHistory(response.data.data?.medicalHistory || [])
        setError('')
      }
    } catch (requestError) {
      if (handleTokenError(requestError)) {
        return
      }
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to delete entry. Please try again.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical History</h1>
          <p className="text-gray-600 mt-2">Track your medical conditions and treatments</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Medical History Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Medical Summary</h2>
            {!editSummary && (
              <button
                onClick={() => setEditSummary(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editSummary ? (
            <div className="space-y-4">
              <textarea
                value={editSummaryText}
                onChange={(e) => setEditSummaryText(e.target.value)}
                rows="4"
                placeholder="Write a summary of your medical history..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSummary}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditSummary(false)
                    setEditSummaryText(summary)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 min-h-24">
              <p className="text-gray-700 whitespace-pre-wrap">
                {summary || 'No medical summary added yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Add Medical History Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Medical History</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Entry
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleAddMedicalHistory} className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <input
                  type="text"
                  name="condition"
                  placeholder="e.g., Hypertension, Diabetes"
                  value={formData.condition}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment
                </label>
                <textarea
                  name="treatment"
                  placeholder="Describe the treatment received..."
                  value={formData.treatment}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      condition: '',
                      treatment: '',
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading medical history...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && medicalHistory.length === 0 && !showForm && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">No history yet</h3>
              <p className="text-gray-600 mt-2">Start adding your medical history entries to keep track of your health</p>
            </div>
          )}

          {/* Medical History Timeline */}
          {!loading && medicalHistory.length > 0 && (
            <div className="space-y-4">
              {medicalHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            {formatDate(entry.date)}
                          </span>
                          {entry.doctorName && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              Dr. {entry.doctorName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {entry.condition}
                        </h3>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {entry.treatment}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(medicalHistory.length - 1 - index)}
                        className="ml-4 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}