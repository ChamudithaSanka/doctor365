import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

export default function ManagePatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const filteredPatients = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return patients
    }

    return patients.filter((patient) => {
      const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase()
      const email = String(patient.email || '').toLowerCase()
      const phone = String(patient.phone || '').toLowerCase()
      return fullName.includes(keyword) || email.includes(keyword) || phone.includes(keyword)
    })
  }, [patients, search])

  const loadPatients = async (pageNum = 1) => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('doctor365_accessToken')
      const response = await axios.get(
        `${gatewayBaseUrl}/api/patients?page=${pageNum}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setPatients(Array.isArray(response.data?.data) ? response.data.data : [])
      setTotalPages(response.data?.pagination?.totalPages || 1)
      setPage(pageNum)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load patients right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients(1)
  }, [])

  const handleToggleStatus = async (patient) => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      setError('You must sign in as admin.')
      return
    }

    try {
      setError('')
      await axios.patch(
        `${gatewayBaseUrl}/api/patients/${patient._id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccess(`Patient ${patient.isActive ? 'disabled' : 'enabled'} successfully`)
      loadPatients(page)
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Failed to update patient status')
    }
  }

  const handleDelete = async (patient) => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      setError('You must sign in as admin.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}? This action cannot be undone.`)) {
      return
    }

    try {
      setError('')
      await axios.delete(`${gatewayBaseUrl}/api/patients/${patient._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSuccess('Patient deleted successfully')
      loadPatients(page)
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Failed to delete patient')
    }
  }

  const openModal = (patient) => {
    setSelectedPatient(patient)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPatient(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white sm:px-8">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage Patients</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          View patient accounts and manage their status by enabling, disabling, or deleting them.
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
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-slate-600">Loading patients...</div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="text-slate-600">No patients found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-700">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{patient.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{patient.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          patient.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {patient.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(patient)}
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

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => loadPatients(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => loadPatients(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </h2>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div>
                <label className="font-semibold text-slate-700">Email:</label> {selectedPatient.email}
              </div>
              <div>
                <label className="font-semibold text-slate-700">Phone:</label> {selectedPatient.phone}
              </div>
              <div>
                <label className="font-semibold text-slate-700">Address:</label> {selectedPatient.address}
              </div>
              <div>
                <label className="font-semibold text-slate-700">City:</label> {selectedPatient.city}
              </div>
              <div>
                <label className="font-semibold text-slate-700">Status:</label>{' '}
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedPatient.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedPatient.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedPatient)}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  selectedPatient.isActive
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {selectedPatient.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedPatient)}
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
