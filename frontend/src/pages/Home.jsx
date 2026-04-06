import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const doctors = [
  {
    name: 'Dr. Anjali Perera',
    specialty: 'Cardiology',
    experience: '12 years',
    fee: 'LKR 4,500',
  },
  {
    name: 'Dr. Kasun Silva',
    specialty: 'General Medicine',
    experience: '9 years',
    fee: 'LKR 2,500',
  },
  {
    name: 'Dr. Nadeesha Fernando',
    specialty: 'Pediatrics',
    experience: '10 years',
    fee: 'LKR 3,500',
  },
]

const features = [
  'Book appointments in a few clicks',
  'Join secure telemedicine consultations',
  'Receive payment confirmation and reminders',
]

const steps = [
  'Search doctors by specialty and availability',
  'Book, pay, and manage your appointment online',
  'Attend consultation and receive follow-up updates',
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-200">
                Blue care flow. Green trust. White clean UI.
              </span>

              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Find doctors, book appointments, and join consultations from one place.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Doctor365 helps patients search doctors, confirm appointments, pay securely, and receive telemedicine care with a simple, modern experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#doctors"
                  className="rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  Browse Doctors
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-green-300 px-6 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  See How It Works
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { value: '24/7', label: 'Access to care' },
                  { value: '3 roles', label: 'Patient, Doctor, Admin' },
                  { value: 'Secure', label: 'JWT-based auth' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-blue-700">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Today&apos;s schedule</p>
                    <p className="text-2xl font-bold text-slate-900">2 appointments</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    Live
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { time: '09:00 AM', name: 'Dr. Anjali Perera', status: 'Confirmed' },
                    { time: '11:30 AM', name: 'Dr. Kasun Silva', status: 'Pending payment' },
                  ].map((item) => (
                    <div key={item.time} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">{item.time}</p>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                        </div>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-700 to-green-600 p-5 text-white">
                  <p className="text-sm/6 opacity-90">Next consultation</p>
                  <p className="mt-1 text-xl font-semibold">Join video room in one tap</p>
                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                    Telemedicine ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-blue-50 ring-1 ring-blue-100" />
                <h2 className="text-lg font-semibold text-slate-900">{feature}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Built for a clean patient journey with blue as the primary accent and green for success states and trust signals.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Simple flow from search to consultation</h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-lg font-bold text-green-700 ring-1 ring-green-100">
                    0{index + 1}
                  </div>
                  <p className="mt-4 text-base leading-7 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="doctors" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Featured doctors</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Discover specialists near you</h2>
            </div>
            <a href="#" className="text-sm font-semibold text-green-700 transition hover:text-green-800">
              View all doctors
            </a>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <article key={doctor.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
                      {doctor.name
                        .split(' ')
                        .slice(1, 3)
                        .map((part) => part[0])
                        .join('')}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">{doctor.name}</h3>
                    <p className="mt-1 text-sm font-medium text-blue-700">{doctor.specialty}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Available
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>Experience: {doctor.experience}</p>
                  <p>Consultation fee: {doctor.fee}</p>
                </div>

                <button className="mt-6 w-full rounded-full bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">
                  Book Appointment
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 pb-20 pt-4 lg:px-8">
            <div className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 px-6 py-10 text-white shadow-lg lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Ready to build the patient journey?</h2>
                  <p className="mt-3 max-w-2xl text-white/90">
                    Start with a clean homepage, then connect login, doctor search, booking, payment, notifications, and telemedicine flows.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/login" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-slate-100">
                    Get Started
                  </Link>
                  <Link to="/login" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}