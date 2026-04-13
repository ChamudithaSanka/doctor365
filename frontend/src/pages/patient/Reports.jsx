import { useState } from 'react'

const reports = [
  {
    id: 'r1',
    title: 'Full Blood Count',
    doctor: 'Dr. Anjali Perera',
    date: '2025-03-10',
    type: 'Lab',
    status: 'Normal',
    size: '1.2 MB',
  },
  {
    id: 'r2',
    title: 'Lipid Profile',
    doctor: 'Dr. Anjali Perera',
    date: '2025-03-10',
    type: 'Lab',
    status: 'Review required',
    size: '0.8 MB',
  },
  {
    id: 'r3',
    title: 'Chest X-Ray',
    doctor: 'Dr. Kasun Silva',
    date: '2025-02-20',
    type: 'Imaging',
    status: 'Normal',
    size: '4.5 MB',
  },
  {
    id: 'r4',
    title: 'Echocardiogram Report',
    doctor: 'Dr. Anjali Perera',
    date: '2025-01-15',
    type: 'Cardiology',
    status: 'Normal',
    size: '2.1 MB',
  },
  {
    id: 'r5',
    title: 'Thyroid Function Test',
    doctor: 'Dr. Nadeesha Fernando',
    date: '2024-12-05',
    type: 'Lab',
    status: 'Normal',
    size: '0.6 MB',
  },
]

const statusStyle = {
  Normal: 'bg-green-50 text-green-700',
  'Review required': 'bg-amber-50 text-amber-700',
}

const typeStyle = {
  Lab: 'bg-blue-50 text-blue-700',
  Imaging: 'bg-slate-100 text-slate-700',
  Cardiology: 'bg-purple-50 text-purple-700',
}

export default function Reports() {
  const [filter, setFilter] = useState('All')
  const types = ['All', 'Lab', 'Imaging', 'Cardiology']

  const filtered = filter === 'All' ? reports : reports.filter((r) => r.type === filter)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">My health</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Medical Reports</h1>
          <p className="mt-1 text-sm text-slate-500">View and download reports shared by your doctors.</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total reports', value: reports.length },
            { label: 'Needs review', value: reports.filter((r) => r.status === 'Review required').length },
            { label: 'This year', value: reports.filter((r) => r.date.startsWith('2025')).length },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === t
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Report list */}
        <div className="space-y-4">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{report.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeStyle[report.type]}`}>{report.type}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[report.status]}`}>{report.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{report.doctor} · {report.date} · {report.size}</p>
                  </div>
                </div>

                <button className="shrink-0 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                  Download
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-sm font-medium text-slate-500">No reports found for this category.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}