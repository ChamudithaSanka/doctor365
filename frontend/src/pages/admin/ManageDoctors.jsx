import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const filteredDoctors = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return doctors
    }

    return doctors.filter((doctor) => {
      const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.toLowerCase()
      const specialization = String(doctor.specialization || '').toLowerCase()
      const licenseNumber = String(doctor.licenseNumber || '').toLowerCase()
      return fullName.includes(keyword) || specialization.includes(keyword) || licenseNumber.includes(keyword)
    })
  }, [doctors, search])

  const loadDoctors = async (pageNum = 1) => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('doctor365_accessToken')
      const response = await axios.get(`${gatewayBaseUrl}/api/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setDoctors(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load doctors right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors(1)
  }, [])

  const handleToggleStatus = async (doctor) => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      setError('You must sign in as admin.')
      return
    }

    try {
      setError('')
      await axios.patch(
        `${gatewayBaseUrl}/api/doctors/${doctor._id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccess(`Doctor ${doctor.isActive ? 'disabled' : 'enabled'} successfully`)
      loadDoctors(page)
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Failed to update doctor status')
    }
  }

  const handleDelete = async (doctor) => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      setError('You must sign in as admin.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete Dr. ${doctor.firstName} ${doctor.lastName}? This action cannot be undone.`)) {
      return
    }

    try {
      setError('')
      await axios.delete(`${gatewayBaseUrl}/api/doctors/${doctor._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSuccess('Doctor deleted successfully')
      loadDoctors(page)
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Failed to delete doctor')
    }
  }

  const openModal = (doctor) => {
    setSelectedDoctor(doctor)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDoctor(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white sm:px-8">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage Doctors</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          View doctor accounts and manage their status by enabling, disabling, or deleting them.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search by name, specialization, or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-slate-600">Loading doctors...</div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="text-slate-600">No doctors found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-700">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">License</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{doctor.specialization}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{doctor.licenseNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          doctor.isVerified
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {doctor.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          doctor.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {doctor.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(doctor)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900">
              Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
            </h2>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>
                <label className="font-semibold text-slate-700">Specialization:</label> {selectedDoctor.specialization}
              </div>
              <div>
                <label className="font-semibold text-slate-700">License Number:</label> {selectedDoctor.licenseNumber}
              </div>
              <div>
                <label className="font-semibold text-slate-700">Experience:</label> {selectedDoctor.yearsOfExperience} years
              </div>
              <div>
                <label className="font-semibold text-slate-700">Consultation Fee:</label> Rs. {selectedDoctor.consultationFee}
              </div>
              <div>
                <label className="font-semibold text-slate-700">Hospital/Clinic:</label> {selectedDoctor.hospitalOrClinic}
              </div>
              <div>
                <label className="font-semibold text-slate-700">Verified:</label>{' '}
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedDoctor.isVerified
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedDoctor.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Status:</label>{' '}
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedDoctor.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedDoctor.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedDoctor)}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  selectedDoctor.isActive
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {selectedDoctor.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedDoctor)}
                className="flex-1 rounded-2xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 transition"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
