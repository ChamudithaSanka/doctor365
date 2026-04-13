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
        current.map((item) => (item._id === doctor._id ? { ...item, isVerified } : item))
      )
      setSuccess(`Doctor ${isVerified ? 'approved' : 'rejected'} successfully.`)
    } catch (requestError) {
      setError(requestError?.response?.data?.error?.message || 'Unable to update verification status.')
    } finally {
      setPendingMap((current) => ({ ...current, [doctor._id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 to-blue-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Admin tools</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Doctor verification</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Review doctor license details and approve or reject doctor accounts.
        </p>
      </section>

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Verification queue</h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, specialization, or license"
            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:max-w-sm"
          />
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading doctors...</p> : null}

        {!loading && filteredDoctors.length === 0 ? (
          <p className="text-sm text-slate-600">No doctors found for this filter.</p>
        ) : null}

        {!loading && filteredDoctors.length > 0 ? (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => {
              const busy = Boolean(pendingMap[doctor._id])
              return (
                <article key={doctor._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{doctor.specialization}</p>
                      <p className="mt-1 text-sm text-slate-600">License: {doctor.licenseNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Experience: {doctor.yearsOfExperience} years | Fee: {doctor.consultationFee}
                      </p>
                    </div>

                    <span
                      className={[
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                        doctor.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                      ].join(' ')}
                    >
                      {doctor.isVerified ? 'Approved' : 'Pending/Rejected'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateVerification(doctor, true)}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busy ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateVerification(doctor, false)}
                      className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busy ? 'Updating...' : 'Reject'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
  )
}
