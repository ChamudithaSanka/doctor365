const quickStats = [
  { label: 'Upcoming appointments', value: '3' },
  { label: 'Unread notifications', value: '5' },
  { label: 'Pending payments', value: '1' },
]

const recentAppointments = [
  { doctor: 'Dr. Anjali Perera', time: 'Today, 9:00 AM', status: 'Confirmed' },
  { doctor: 'Dr. Kasun Silva', time: 'Tomorrow, 11:30 AM', status: 'Pending payment' },
]

export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Patient dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage appointments, payments, and care updates</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Use the left navigation to move between doctors, appointments, notifications, and your profile. This shell is responsive on desktop and mobile.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickStats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Upcoming appointments</h2>
              <p className="mt-1 text-sm text-slate-500">Quick overview of your next visits</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Live</span>
          </div>

          <div className="mt-6 space-y-4">
            {recentAppointments.map((item) => (
              <article key={item.doctor} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.doctor}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.time}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item.status}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
            <div className="mt-4 space-y-3">
              {['Book Appointment', 'View Notifications', 'Update Profile'].map((action) => (
                <button key={action} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-semibold">Payment status</h2>
            <p className="mt-2 text-sm text-slate-300">1 appointment is waiting for payment confirmation.</p>
            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Next payment</p>
              <p className="mt-1 text-2xl font-bold">LKR 2,500</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}