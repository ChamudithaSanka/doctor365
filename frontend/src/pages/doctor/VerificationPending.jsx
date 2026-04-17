import { Link } from 'react-router-dom'

const nextSteps = [
  'Wait for an admin to approve your doctor account.',
  'You can review your profile information while you wait.',
  'Once approved, your full dashboard and appointment tools unlock automatically.',
]

export default function VerificationPending() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="overflow-hidden rounded-lg border border-purple-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-md sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-400">Verification pending</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
          Your doctor account is under review.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
          You can log in, but full clinical tools stay locked until an admin approves your profile. That keeps the system secure while still letting you manage the parts that are safe to access.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {nextSteps.map((item) => (
            <div key={item} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 text-sm leading-6 text-slate-300 shadow-sm backdrop-blur-md">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/notifications"
            className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-700 hover:to-orange-600"
          >
            Check notifications
          </Link>
          <Link
            to="/profile"
            className="rounded-lg border border-slate-600/30 bg-slate-700/30 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-600/30 backdrop-blur-md"
          >
            Review profile
          </Link>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">What is locked</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <li>Doctor dashboard</li>
            <li>Appointment management</li>
            <li>Consultation tools</li>
            <li>Availability settings</li>
          </ul>
        </div>

        <div className="rounded-lg border border-emerald-600/50 bg-emerald-600/30 p-6 text-sm leading-6 text-emerald-200 shadow-sm backdrop-blur-md">
          Approved doctors automatically regain access to the full workspace after verification.
        </div>
      </aside>
    </div>
    </div>
  )
}