import { useEffect, useState } from 'react'
import axios from 'axios'
import { getToken, handleTokenError } from '../utils/tokenManager'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

export default function PrescriptionForm({ appointmentId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(appointmentId || '')
  const [patientInfo, setPatientInfo] = useState(null)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const [doctorName, setDoctorName] = useState('')

  const [formData, setFormData] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
  })

  const getDoctorNameFromStoredUser = () => {
    try {
      const rawUser = localStorage.getItem('doctor365_user')
      if (!rawUser) return ''

      const user = JSON.parse(rawUser)
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()

      if (fullName) return fullName
      if (typeof user?.name === 'string' && user.name.trim()) return user.name.trim()
      if (typeof user?.email === 'string' && user.email.trim()) return user.email.trim()

      return ''
    } catch {
      return ''
    }
  }

  useEffect(() => {
    const loadDoctorIdentity = async () => {
      const token = getToken()
      if (!token) return

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const doctor = response.data?.data
        const fullName = `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim()
        if (fullName) {
          setDoctorName(fullName)
          return
        }
      } catch {
        // Fallback to locally stored auth user if doctor profile isn't available.
      }

      setDoctorName(getDoctorNameFromStoredUser())
    }

    loadDoctorIdentity()
  }, [])

  // Fetch appointments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      const token = getToken()
      if (!token) {
        setError('You must be logged in')
        setLoadingAppointments(false)
        return
      }

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/appointments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const confirmed = Array.isArray(response.data?.data)
          ? response.data.data.filter((apt) => apt.status === 'confirmed')
          : []
        setAppointments(confirmed)

        // If appointmentId is provided, select it
        if (appointmentId && confirmed.some((apt) => apt._id === appointmentId)) {
          setSelectedAppointment(appointmentId)
        }
      } catch (err) {
        if (!handleTokenError(err)) {
          setError(err.response?.data?.error?.message || 'Failed to load appointments')
        }
      } finally {
        setLoadingAppointments(false)
      }
    }

    fetchAppointments()
  }, [appointmentId])

  // Fetch patient info when appointment is selected
  useEffect(() => {
    if (!selectedAppointment) {
      setPatientInfo(null)
      return
    }

    const appointment = appointments.find((apt) => apt._id === selectedAppointment)
    if (!appointment) return

    const fetchPatientInfo = async () => {
      const token = getToken()
      if (!token) return

      setLoadingPatient(true)
      try {
        const response = await axios.get(
          `${gatewayBaseUrl}/api/patients/${appointment.patientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (response.data?.data) {
          setPatientInfo(response.data.data)
        }
      } catch (err) {
        console.error('Failed to load patient info:', err)
        // Continue without patient info
      } finally {
        setLoadingPatient(false)
      }
    }

    fetchPatientInfo()
  }, [selectedAppointment, appointments])

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications]
    newMedications[index][field] = value
    setFormData({ ...formData, medications: newMedications })
  }

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    })
  }

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!selectedAppointment) {
      setError('Please select an appointment')
      return
    }

    if (!formData.diagnosis.trim()) {
      setError('Please enter a diagnosis')
      return
    }

    if (formData.medications.length === 0) {
      setError('Please add at least one medication')
      return
    }

    // Validate medications
    const invalidMedications = formData.medications.filter(
      (med) => !med.name.trim() || !med.dosage.trim() || !med.frequency.trim() || !med.duration.trim()
    )
    if (invalidMedications.length > 0) {
      setError('Please fill in all medication fields')
      return
    }

    const appointment = appointments.find((apt) => apt._id === selectedAppointment)
    if (!appointment) {
      setError('Selected appointment not found')
      return
    }

    const token = getToken()
    if (!token) {
      setError('You must be logged in')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        `${gatewayBaseUrl}/api/patients/${appointment.patientId}/prescriptions`,
        {
          doctorName: doctorName || 'Unknown doctor',
          medication: formData.medications,
          instructions: formData.instructions.trim(),
          diagnosis: formData.diagnosis.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data?.success) {
        setSuccessMessage('Prescription issued successfully!')
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 1500)
      }
    } catch (err) {
      if (!handleTokenError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to issue prescription')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-purple-600/10 border border-purple-500/20 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">Issue Prescription</h1>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-purple-500/20 text-slate-400 transition"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-300 backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-4 text-sm text-emerald-300 backdrop-blur-md">
            ✓ {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appointment Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Select Appointment
            </label>
            {loadingAppointments ? (
              <div className="text-sm text-slate-400">Loading appointments...</div>
            ) : (
              <select
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
                className="w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
              >
                <option value="">Select a confirmed appointment</option>
                {appointments.map((apt) => (
                  <option key={apt._id} value={apt._id}>
                    Patient: {apt.patientEmail} • {new Date(apt.appointmentDate).toLocaleDateString()} at{' '}
                    {apt.appointmentTime}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Patient Info Display */}
          {selectedAppointment && loadingPatient ? (
            <div className="text-sm text-slate-400">Loading patient information...</div>
          ) : selectedAppointment && patientInfo ? (
            <div className="rounded-lg bg-purple-600/20 border border-purple-500/20 p-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-purple-300">Patient Information</p>
              <div className="mt-3 grid gap-2 text-sm">
                <p className="text-slate-200">
                  <span className="font-medium text-slate-300">Name:</span> {patientInfo.firstName} {patientInfo.lastName}
                </p>
                <p className="text-slate-200">
                  <span className="font-medium text-slate-300">ID:</span> {patientInfo.userId}
                </p>
                <p className="text-slate-400">
                  <span className="font-medium text-slate-300">Email:</span> {patientInfo.email}
                </p>
                <p className="text-slate-400">
                  <span className="font-medium text-slate-300">Phone:</span> {patientInfo.phone}
                </p>
              </div>
            </div>
          ) : null}

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Diagnosis
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Enter patient diagnosis..."
              rows="3"
              className="w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
            />
          </div>

          {/* Medications */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Medications
            </label>
            <div className="space-y-3">
              {formData.medications.map((med, index) => (
                <div key={index} className="rounded-lg border border-slate-600/30 bg-slate-800/20 p-4 space-y-3 backdrop-blur-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      placeholder="Medication name"
                      className="rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      placeholder="Dosage (e.g., 500mg)"
                      className="rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      placeholder="Frequency (e.g., 3 times daily)"
                      className="rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      placeholder="Duration (e.g., 7 days)"
                      className="rounded-lg border border-slate-600/30 bg-slate-800/30 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  {formData.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                    >
                      Remove medication
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMedication}
              className="mt-3 rounded-lg border border-dashed border-slate-600/30 bg-slate-800/20 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-300 hover:border-slate-600/50 transition backdrop-blur-sm"
            >
              + Add medication
            </button>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Additional Instructions (Optional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Enter any additional instructions or notes..."
              rows="2"
              className="w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-600/30 bg-slate-800/20 px-6 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/40 transition disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAppointment}
              className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2 text-sm font-semibold text-white hover:from-orange-700 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
