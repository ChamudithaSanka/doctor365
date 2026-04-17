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

const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const formatWorkingDays = (workingDays) => {
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return 'Schedule not listed'
  }

  return workingDays.join(', ')
}

const getWeekdayCode = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return weekdayLabels[date.getDay()]
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [maxFee, setMaxFee] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

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

  const verifiedDoctors = useMemo(() => doctors.filter((doctor) => doctor.isVerified), [doctors])

  const filteredDoctors = useMemo(() => {
    const selectedDay = getWeekdayCode(selectedDate)

    return verifiedDoctors.filter((doctor) => {
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

      const hasBookableDayMatch =
        !selectedDay ||
        (Array.isArray(doctor.workingDays) && doctor.workingDays.includes(selectedDay))

      return hasSearchMatch && hasSpecialtyMatch && hasFeeMatch && hasBookableDayMatch
    })
  }, [maxFee, search, selectedDate, specialty, verifiedDoctors])

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 backdrop-blur-md shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300/80">Find a doctor</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">Browse specialists and book your next consultation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Search by doctor name or specialty, filter by fee and availability, then move to details or booking.
        </p>
      </section>

      <section className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 backdrop-blur-md shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="doctor-search" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Search
            </label>
            <input
              id="doctor-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, specialty, clinic"
              className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label htmlFor="doctor-specialty" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Specialty
            </label>
            <select
              id="doctor-specialty"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/20"
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
            <label htmlFor="doctor-fee" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Max fee (LKR)
            </label>
            <input
              id="doctor-fee"
              type="number"
              min="0"
              value={maxFee}
              onChange={(event) => setMaxFee(event.target.value)}
              placeholder="Any"
              className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label htmlFor="doctor-date" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Pick a date
            </label>
            <input
              id="doctor-date"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-lg border border-red-500/30 bg-red-600/10 p-4 text-sm text-red-300 backdrop-blur-md">{error}</section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Doctors</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Loading...' : `${filteredDoctors.length} verified match${filteredDoctors.length === 1 ? '' : 'es'}`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 text-sm text-slate-400 backdrop-blur-md">Loading doctor list...</div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-purple-500/20 bg-purple-600/10 p-8 text-center text-sm text-slate-400 backdrop-blur-md">
            No doctors found for the current filters.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDoctors.map((doctor) => {
              const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor'
              const availabilityLabel = doctor.availabilityStartTime && doctor.availabilityEndTime
                ? `${doctor.availabilityStartTime} – ${doctor.availabilityEndTime}`
                : 'No working hours listed'
              const workingDaysLabel = formatWorkingDays(doctor.workingDays)
              const selectedDay = getWeekdayCode(selectedDate)
              const isBookableOnSelectedDate =
                !selectedDay || (Array.isArray(doctor.workingDays) && doctor.workingDays.includes(selectedDay))

              return (
                <article key={doctor._id || doctor.userId} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 backdrop-blur-md shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{fullName}</h3>
                      <p className="mt-1 text-sm font-medium text-orange-400">{doctor.specialization || 'Specialty not listed'}</p>
                      <p className="mt-1 text-sm text-slate-400">{doctor.hospitalOrClinic || 'Clinic not listed'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.isVerified ? 'bg-emerald-600/30 text-emerald-300 ring-emerald-600/50 ring-1' : 'bg-amber-600/30 text-amber-300 ring-amber-600/50 ring-1'}`}>
                      {doctor.isVerified ? 'Verified' : 'Pending verification'}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Consultation fee</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">{formatCurrency(doctor.consultationFee)}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Experience</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">{doctor.yearsOfExperience ?? 'N/A'} years</p>
                    </div>
                    <div className="rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-3 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Availability</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">{availabilityLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-indigo-600/10 border border-indigo-500/20 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Working days</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">{workingDaysLabel}</p>
                    {selectedDate ? (
                      <p className={`mt-2 text-sm font-medium ${isBookableOnSelectedDate ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {isBookableOnSelectedDate
                          ? `Bookable on ${selectedDate}`
                          : `Not bookable on ${selectedDate}`}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/doctors/${doctor._id || doctor.userId}`}
                      className="rounded-lg border border-purple-500/30 bg-slate-700/30 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-purple-500/50 hover:bg-slate-700/50"
                    >
                      View details
                    </Link>
                    <Link
                      to={selectedDate ? `/appointments/book?doctorId=${doctor._id || doctor.userId}&date=${selectedDate}` : `/appointments/book?doctorId=${doctor._id || doctor.userId}`}
                      className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-orange-700 hover:to-orange-600"
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