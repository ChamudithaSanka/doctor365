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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-lg border border-purple-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 px-6 py-8 text-white backdrop-blur-md sm:px-8">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage Patients</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          View patient accounts and manage their status by enabling, disabling, or deleting them.
        </p>
      </section>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-600/50 bg-red-600/30 p-4 text-sm text-red-300 backdrop-blur-md">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-lg border border-emerald-600/50 bg-emerald-600/30 p-4 text-sm text-emerald-300 backdrop-blur-md">{success}</div>
      ) : null}

      <section className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <div className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-slate-400">Loading patients...</div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="text-slate-400">No patients found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 text-left text-sm font-semibold text-slate-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="border-b border-purple-500/20 hover:bg-purple-600/20 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">
                        {patient.firstName} {patient.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{patient.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{patient.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${
                          patient.isActive
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-red-600/30 text-red-300'
                        }`}
                      >
                        {patient.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(patient)}
                        className="text-sm font-medium text-orange-400 hover:text-orange-300"
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
            className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => loadPatients(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-lg backdrop-blur-md">
            <h2 className="text-xl font-bold text-slate-100">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </h2>

            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <div>
                <label className="font-semibold text-slate-300">Email:</label> {selectedPatient.email}
              </div>
              <div>
                <label className="font-semibold text-slate-300">Phone:</label> {selectedPatient.phone}
              </div>
              <div>
                <label className="font-semibold text-slate-300">Address:</label> {selectedPatient.address}
              </div>
              <div>
                <label className="font-semibold text-slate-300">City:</label> {selectedPatient.city}
              </div>
              <div>
                <label className="font-semibold text-slate-300">Status:</label>{' '}
                <span
                  className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${
                    selectedPatient.isActive
                      ? 'bg-emerald-600/30 text-emerald-300'
                      : 'bg-red-600/30 text-red-300'
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
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedPatient.isActive
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {selectedPatient.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedPatient)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border border-slate-600/30 bg-slate-700/30 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-600/30"
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
