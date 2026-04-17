import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

export default function AdminDoctorVerification() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [pendingMap, setPendingMap] = useState({})

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

  const loadDoctors = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`${gatewayBaseUrl}/api/doctors`)
      setDoctors(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load doctors right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  const updateVerification = async (doctor, isVerified) => {
    const token = localStorage.getItem('doctor365_accessToken')
    if (!token) {
      setError('You must sign in as admin to verify doctors.')
      return
    }

    setSuccess('')
    setError('')
    setPendingMap((current) => ({ ...current, [doctor._id]: true }))

    try {
      const authHeaders = { Authorization: `Bearer ${token}` }

      await axios.patch(
        `${gatewayBaseUrl}/api/doctors/${doctor._id}/verify`,
        { isVerified },
        { headers: authHeaders }
      )

      await axios.patch(
        `${gatewayBaseUrl}/api/auth/admin/users/${doctor.userId}/verify`,
        { isVerified },
        { headers: authHeaders }
      )

      setDoctors((current) =>
        current.map((item) => (item._id === doctor._id ? { ...item, isVerified, verificationStatus: isVerified ? 'approved' : 'rejected' } : item))
      )
      setSuccess(`Doctor ${isVerified ? 'approved' : 'rejected'} successfully.`)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Unable to update verification status.')
    } finally {
      setPendingMap((current) => ({ ...current, [doctor._id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6">
      <div className="space-y-6">
      <section className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg backdrop-blur-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Admin tools</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Doctor verification</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Review doctor license details and approve or reject doctor accounts.
        </p>
      </section>

      {error ? <div className="rounded-lg border border-red-600/50 bg-red-600/30 p-4 text-sm text-red-300 backdrop-blur-md">{error}</div> : null}
      {success ? <div className="rounded-lg border border-emerald-600/50 bg-emerald-600/30 p-4 text-sm text-emerald-300 backdrop-blur-md">{success}</div> : null}

      <section className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Verification queue</h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, specialization, or license"
            className="w-full rounded-lg border border-slate-600/30 px-4 py-2.5 text-sm bg-slate-800/30 text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/30 sm:max-w-sm"
          />
        </div>

        {loading ? <p className="text-sm text-slate-400">Loading doctors...</p> : null}

        {!loading && filteredDoctors.length === 0 ? (
          <p className="text-sm text-slate-400">No doctors found for this filter.</p>
        ) : null}

        {!loading && filteredDoctors.length > 0 ? (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => {
              const busy = Boolean(pendingMap[doctor._id])
              return (
                <article key={doctor._id} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 backdrop-blur-md">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">{doctor.specialization}</p>
                      <p className="mt-1 text-sm text-slate-400">License: {doctor.licenseNumber}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Experience: {doctor.yearsOfExperience} years | Fee: {doctor.consultationFee}
                      </p>
                    </div>

                    <span
                      className={[
                        'inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold',
                        doctor.verificationStatus === 'approved' || doctor.isVerified
                          ? 'bg-emerald-600/30 text-emerald-300 ring-emerald-600/50'
                          : doctor.verificationStatus === 'rejected'
                            ? 'bg-rose-600/30 text-rose-300 ring-rose-600/50'
                            : 'bg-amber-600/30 text-amber-300 ring-amber-600/50',
                      ].join(' ')}
                    >
                      {doctor.verificationStatus === 'approved' || doctor.isVerified
                        ? 'Approved'
                        : doctor.verificationStatus === 'rejected'
                          ? 'Rejected'
                          : 'Pending'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {(!doctor.verificationStatus || doctor.verificationStatus === 'pending') && !doctor.isVerified && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateVerification(doctor, true)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {busy ? 'Updating...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateVerification(doctor, false)}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {busy ? 'Updating...' : 'Reject'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
    </div>
  )
}
