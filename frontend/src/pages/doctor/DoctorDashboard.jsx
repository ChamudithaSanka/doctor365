const stats = [
  { label: 'Pending requests', value: '4' },
  { label: 'Today appointments', value: '6' },
  { label: 'Active consultations', value: '2' },
]

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-green-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Doctor dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Manage your schedule and consultation flow</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
          Review appointment requests, confirm consultations, and access your dashboard on mobile or desktop.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-transparent bg-white p-6 shadow-sm hover:shadow-2xl hover:border-slate-200 transform hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Today's appointments</h2>
        <div className="mt-5 space-y-4">
          {['9:00 AM - Patient A', '11:30 AM - Patient B', '2:00 PM - Patient C'].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-transparent bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md transform hover:-translate-y-1 transition-all duration-200 ease-in-out cursor-pointer"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}