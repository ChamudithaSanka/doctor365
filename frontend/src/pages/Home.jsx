import { Link } from 'react-router-dom'
import useScrollAnimation from '../hooks/useScrollAnimation'
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
  const heroRef = useScrollAnimation({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
  const featuresRef = useScrollAnimation({ threshold: 0.1 })
  const stepsRef = useScrollAnimation({ threshold: 0.1 })
  const doctorsRef = useScrollAnimation({ threshold: 0.1 })
  const ctaRef = useScrollAnimation({ threshold: 0.1 })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-slate-100">
      <Header />

      <main>
        <section className="relative overflow-hidden pt-12 opacity-0 translate-y-10 transition-all duration-1000" ref={heroRef}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(147,51,234,0.15),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full bg-purple-600/20 px-4 py-2 text-sm font-semibold text-purple-200 ring-1 ring-purple-500/30 backdrop-blur-sm">
                ⚕️ Intelligent Healthcare Platform
              </span>

              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
                Meet your doctor, anywhere, anytime.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Doctor365 connects you with specialists. Get AI symptom insights, book appointments, and consult via secure telemedicine—all in one modern platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#doctors"
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition hover:scale-105 backdrop-blur-sm"
                >
                  Find Specialists
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-lg border border-indigo-500/40 bg-indigo-600/10 px-6 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-600/20 hover:border-indigo-500/60 backdrop-blur-sm"
                >
                  See How It Works
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { value: '24/7', label: 'Care access' },
                  { value: 'AI+MD', label: 'Smart insights' },
                  { value: 'Secure', label: 'Enterprise safety' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-4 shadow-sm backdrop-blur-md hover:border-purple-500/40 transition">
                    <p className="text-2xl font-bold text-purple-300">{item.value}</p>
                    <p className="mt-1 text-sm text-purple-200/70">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-xl border border-purple-500/20 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-300/70">Today&apos;s Schedule</p>
                    <p className="text-2xl font-bold text-slate-100">2 consultations</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-r from-orange-600/40 to-orange-500/40 px-4 py-2 text-sm font-semibold text-orange-200">
                    🔴 Live
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { time: '09:00 AM', name: 'Dr. Anjali Perera', status: 'Confirmed' },
                    { time: '11:30 AM', name: 'Dr. Kasun Silva', status: 'Pending payment' },
                  ].map((item) => (
                    <div key={item.time} className="rounded-lg border border-indigo-500/20 bg-indigo-600/10 p-4 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-indigo-300/70">{item.time}</p>
                          <p className="font-semibold text-slate-100">{item.name}</p>
                        </div>
                        <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-300 border border-green-500/30">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-gradient-to-r from-indigo-600/50 to-purple-600/50 p-5 text-slate-100 border border-purple-500/30 backdrop-blur-md">
                  <p className="text-sm/6 opacity-90">🎯 Next Consultation</p>
                  <p className="mt-1 text-xl font-semibold">Join video in one tap</p>
                  <div className="mt-4 inline-flex rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium border border-purple-500/30">
                    Telemedicine ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 opacity-0 translate-y-10 transition-all duration-1000" ref={featuresRef}>
          <div className="grid gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-xl border border-purple-500/20 bg-purple-600/10 p-6 shadow-lg backdrop-blur-md hover:border-purple-500/40 transition group opacity-0 translate-y-10 transition-all duration-700">
                <div className="mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600/40 to-indigo-600/40 ring-1 ring-purple-500/30 group-hover:ring-purple-500/60 transition" />
                <h2 className="text-lg font-semibold text-slate-100">{feature}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Seamless healthcare experience with intelligent design and secure, enterprise-grade care delivery.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-purple-500/20 bg-slate-950/50 backdrop-blur-sm opacity-0 translate-y-10 transition-all duration-1000" ref={stepsRef}>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">Process</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">Three steps to care</h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step} className="rounded-lg border border-indigo-500/20 bg-indigo-600/10 p-6 shadow-lg ring-1 ring-indigo-500/10 backdrop-blur-md hover:border-indigo-500/40 transition opacity-0 translate-y-10 transition-all duration-700">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600/40 to-purple-600/40 text-lg font-bold text-indigo-300 ring-1 ring-indigo-500/30">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-base leading-7 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="doctors" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 opacity-0 translate-y-10 transition-all duration-1000" ref={doctorsRef}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">Medical Excellence</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">Specialists ready for you</h2>
            </div>
            <a href="#" className="text-sm font-semibold text-purple-300 transition hover:text-purple-200">
              View all doctors →
            </a>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {doctors.map((doctor, index) => (
              <article key={doctor.name} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-lg backdrop-blur-md hover:border-purple-500/40 transition group opacity-0 translate-y-10 transition-all duration-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-lg font-bold text-white group-hover:scale-105 transition">
                      {doctor.name
                        .split(' ')
                        .slice(1, 3)
                        .map((part) => part[0])
                        .join('')}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-100">{doctor.name}</h3>
                    <p className="mt-1 text-sm font-medium text-purple-300">{doctor.specialty}</p>
                  </div>
                  <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-300 border border-green-500/30">
                    Available
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <p>⏱️ {doctor.experience}</p>
                  <p>💳 {doctor.fee}</p>
                </div>

                <button className="mt-6 w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105">
                  Book Consultation
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-950 to-indigo-950 opacity-0 translate-y-10 transition-all duration-1000" ref={ctaRef}>
          <div className="mx-auto max-w-7xl px-6 pb-20 pt-4 lg:px-8">
            <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 px-6 py-10 text-slate-100 shadow-2xl backdrop-blur-xl lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Your health journey starts here</h2>
                  <p className="mt-3 max-w-2xl text-slate-300">
                    Connect with verified specialists, get AI-powered insights, and manage your healthcare in one secure platform.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register" className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105">
                    Get Started
                  </Link>
                  <Link to="/login" className="rounded-lg border border-purple-500/40 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/60 hover:border-purple-500/60 backdrop-blur-sm">
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