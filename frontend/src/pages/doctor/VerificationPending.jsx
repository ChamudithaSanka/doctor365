import { Link } from 'react-router-dom'

const nextSteps = [
  'Wait for an admin to approve your doctor account.',
  'You can review your profile information while you wait.',
  'Once approved, your full dashboard and appointment tools unlock automatically.',
]

export default function VerificationPending() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_30%),linear-gradient(135deg,_#fff,_#fffbeb)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Verification pending</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Your doctor account is under review.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
          You can log in, but full clinical tools stay locked until an admin approves your profile. That keeps the system secure while still letting you manage the parts that are safe to access.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {nextSteps.map((item) => (
            <div key={item} className="rounded-3xl border border-amber-100 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/notifications"
            className="rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Check notifications
          </Link>
          <Link
            to="/profile"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Review profile
          </Link>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">What is locked</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Doctor dashboard</li>
            <li>Appointment management</li>
            <li>Consultation tools</li>
            <li>Availability settings</li>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-sm leading-6 text-emerald-900 shadow-sm">
          Approved doctors automatically regain access to the full workspace after verification.
        </div>
      </aside>
    </div>
  )
}