import { useState } from 'react'

const history = [
  {
    id: 'h1',
    condition: 'Hypertension',
    diagnosedDate: '2020-06-12',
    status: 'Ongoing',
    doctor: 'Dr. Anjali Perera',
    notes: 'Controlled with medication. Regular monitoring required.',
    category: 'Cardiovascular',
  },
  {
    id: 'h2',
    condition: 'Type 2 Diabetes',
    diagnosedDate: '2021-01-22',
    status: 'Ongoing',
    doctor: 'Dr. Kasun Silva',
    notes: 'Managed with metformin. HbA1c levels stable.',
    category: 'Endocrine',
  },
  {
    id: 'h3',
    condition: 'Appendectomy',
    diagnosedDate: '2018-09-05',
    status: 'Resolved',
    doctor: 'Dr. Nadeesha Fernando',
    notes: 'Surgical procedure completed without complications.',
    category: 'Surgical',
  },
  {
    id: 'h4',
    condition: 'Asthma',
    diagnosedDate: '2010-03-14',
    status: 'Managed',
    doctor: 'Dr. Anjali Perera',
    notes: 'Mild intermittent asthma. Uses rescue inhaler as needed.',
    category: 'Respiratory',
  },
]

const medications = [
  { name: 'Metformin 500mg', frequency: 'Twice daily', prescribed: 'Dr. Kasun Silva' },
  { name: 'Amlodipine 5mg', frequency: 'Once daily', prescribed: 'Dr. Anjali Perera' },
  { name: 'Salbutamol inhaler', frequency: 'As needed', prescribed: 'Dr. Anjali Perera' },
]

const statusStyle = {
  Ongoing: 'bg-amber-50 text-amber-700',
  Resolved: 'bg-green-50 text-green-700',
  Managed: 'bg-blue-50 text-blue-700',
}

const categoryColor = {
  Cardiovascular: 'bg-red-50 text-red-700',
  Endocrine: 'bg-purple-50 text-purple-700',
  Surgical: 'bg-slate-100 text-slate-700',
  Respiratory: 'bg-blue-50 text-blue-700',
}

export default function MedicalHistory() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">My health</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Medical History</h1>
          <p className="mt-1 text-sm text-slate-500">Your complete health record as maintained by your care team.</p>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total conditions', value: history.length },
            { label: 'Ongoing', value: history.filter((h) => h.status === 'Ongoing').length },
            { label: 'Current medications', value: medications.length },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Conditions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Conditions & Diagnoses</h2>
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200"
              >
                <button
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{item.condition}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor[item.category]}`}>{item.category}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[item.status]}`}>{item.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Diagnosed {item.diagnosedDate} · {item.doctor}</p>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${expanded === item.id ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {expanded === item.id && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                    <p className="text-sm text-slate-600">{item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current medications */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Current Medications</h2>
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {medications.map((med, index) => (
              <div
                key={med.name}
                className={`flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between ${
                  index < medications.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-900">{med.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{med.prescribed}</p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {med.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}