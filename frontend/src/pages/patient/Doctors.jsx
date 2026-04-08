import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const formatCurrency = (amount) => {
  const value = Number(amount)

  if (Number.isNaN(value)) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)
}

const normalizeText = (value) => String(value || '').toLowerCase().trim()

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [maxFee, setMaxFee] = useState('')
  const [availability, setAvailability] = useState('all')

  useEffect(() => {
    const controller = new AbortController()

    const loadDoctors = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.get(`${gatewayBaseUrl}/api/doctors`, {
          signal: controller.signal,
        })

        const doctorList = Array.isArray(response.data?.data) ? response.data.data : []
        setDoctors(doctorList)
      } catch (requestError) {
        if (requestError.name === 'CanceledError') {
          return
        }

        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load doctors right now. Please try again in a moment.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDoctors()

    return () => controller.abort()
  }, [])

  const specialties = useMemo(() => {
    const values = Array.from(new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean)))
    return values.sort((left, right) => left.localeCompare(right))
  }, [doctors])

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const doctorName = normalizeText(`${doctor.firstName || ''} ${doctor.lastName || ''}`)
      const doctorSpecialty = normalizeText(doctor.specialization)
      const doctorClinic = normalizeText(doctor.hospitalOrClinic)

      const hasSearchMatch =
        !search ||
        doctorName.includes(normalizeText(search)) ||
        doctorSpecialty.includes(normalizeText(search)) ||
        doctorClinic.includes(normalizeText(search))

      const hasSpecialtyMatch = specialty === 'all' || doctor.specialization === specialty

      const feeValue = Number(doctor.consultationFee)
      const maxFeeValue = maxFee === '' ? null : Number(maxFee)
      const hasFeeMatch = maxFeeValue === null || (!Number.isNaN(feeValue) && feeValue <= maxFeeValue)

      const hasAvailabilityData = Boolean(doctor.availabilityStartTime && doctor.availabilityEndTime)
      const hasAvailabilityMatch =
        availability === 'all' ||
        (availability === 'available' && hasAvailabilityData) ||
        (availability === 'no-slots' && !hasAvailabilityData)

      return hasSearchMatch && hasSpecialtyMatch && hasFeeMatch && hasAvailabilityMatch
    })
  }, [availability, doctors, maxFee, search, specialty])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-cyan-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Find a doctor</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Browse specialists and book your next consultation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Search by doctor name or specialty, filter by fee and availability, then move to details or booking.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="doctor-search" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Search
            </label>
            <input
              id="doctor-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, specialty, clinic"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="doctor-specialty" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Specialty
            </label>
            <select
              id="doctor-specialty"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All specialties</option>
              {specialties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="doctor-fee" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Max fee (LKR)
            </label>
            <input
              id="doctor-fee"
              type="number"
              min="0"
              value={maxFee}
              onChange={(event) => setMaxFee(event.target.value)}
              placeholder="Any"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="doctor-availability" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Availability
            </label>
            <select
              id="doctor-availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="available">Has slots</option>
              <option value="no-slots">No slots listed</option>
            </select>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Doctors</h2>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : `${filteredDoctors.length} match${filteredDoctors.length === 1 ? '' : 'es'}`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading doctor list...</div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No doctors found for the current filters.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDoctors.map((doctor) => {
              const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor'
              const hasAvailability = Boolean(doctor.availabilityStartTime && doctor.availabilityEndTime)
              const availabilityLabel = hasAvailability
                ? `${doctor.availabilityStartTime} - ${doctor.availabilityEndTime}`
                : 'No working hours listed'

              return (
                <article key={doctor._id || doctor.userId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{fullName}</h3>
                      <p className="mt-1 text-sm font-medium text-blue-700">{doctor.specialization || 'Specialty not listed'}</p>
                      <p className="mt-1 text-sm text-slate-500">{doctor.hospitalOrClinic || 'Clinic not listed'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {doctor.isVerified ? 'Verified' : 'Pending verification'}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Consultation fee</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(doctor.consultationFee)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Experience</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{doctor.yearsOfExperience ?? 'N/A'} years</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Availability</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{availabilityLabel}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/doctors/${doctor._id || doctor.userId}`}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      View details
                    </Link>
                    <Link
                      to="/appointments/book"
                      className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      Book appointment
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}