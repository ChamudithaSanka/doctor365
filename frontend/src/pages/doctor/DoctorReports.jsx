import { useState } from 'react'

const patients = [
  {
    id: 'p1',
    name: 'Kavya Mendis',
    avatar: 'KM',
    reports: [
      { id: 'r1', title: 'Full Blood Count', date: '2025-03-10', status: 'Reviewed', type: 'Lab', notes: 'All values within normal range.' },
      { id: 'r2', title: 'Lipid Profile', date: '2025-03-10', status: 'Needs attention', type: 'Lab', notes: 'LDL slightly elevated. Recommend lifestyle changes.' },
    ],
  },
  {
    id: 'p2',
    name: 'Ruwan Jayasinghe',
    avatar: 'RJ',
    reports: [
      { id: 'r3', title: 'Chest X-Ray', date: '2025-02-20', status: 'Reviewed', type: 'Imaging', notes: 'No significant findings.' },
      { id: 'r4', title: 'ECG Report', date: '2025-01-30', status: 'Pending review', type: 'Cardiology', notes: '' },
    ],
  },
  {
    id: 'p3',
    name: 'Shalini Rathnayake',
    avatar: 'SR',
    reports: [
      { id: 'r5', title: 'Thyroid Function', date: '2025-03-01', status: 'Pending review', type: 'Lab', notes: '' },
    ],
  },
]

const statusStyle = {
  Reviewed: 'bg-green-50 text-green-700',
  'Needs attention': 'bg-amber-50 text-amber-700',
  'Pending review': 'bg-slate-100 text-slate-600',
}

export default function DoctorReports() {
  const [selectedPatient, setSelectedPatient] = useState(patients[0])
  const [selectedReport, setSelectedReport] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [saved, setSaved] = useState(false)

  const handleAddNote = () => {
    if (!noteText.trim()) return
    setSaved(true)
    setNoteText('')
    setTimeout(() => setSaved(false), 3000)
  }

  const pendingCount = patients.flatMap((p) => p.reports).filter((r) => r.status === 'Pending review').length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Doctor portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Patient Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Review lab results, imaging, and uploaded reports from your patients.</p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total patients', value: patients.length },
            { label: 'Pending review', value: pendingCount },
            { label: 'Total reports', value: patients.flatMap((p) => p.reports).length },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Patient list */}
          <div className="space-y-3">
            {patients.map((patient) => {
              const pending = patient.reports.filter((r) => r.status === 'Pending review').length
              return (
                <button
                  key={patient.id}
                  onClick={() => { setSelectedPatient(patient); setSelectedReport(null) }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedPatient?.id === patient.id
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                      {patient.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{patient.name}</p>
                      <p className="text-xs text-slate-500">{patient.reports.length} report{patient.reports.length !== 1 ? 's' : ''}</p>
                    </div>
                    {pending > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {pending}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Reports panel */}
          <div>
            {selectedPatient && (
              <>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">{selectedPatient.name}'s Reports</h2>
                <div className="space-y-4">
                  {selectedPatient.reports.map((report) => (
                    <div
                      key={report.id}
                      className={`rounded-3xl border bg-white p-5 shadow-sm transition cursor-pointer ${
                        selectedReport?.id === report.id ? 'border-blue-200' : 'border-slate-200 hover:border-blue-100'
                      }`}
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{report.title}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[report.status]}`}>{report.status}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{report.type} · {report.date}</p>
                        </div>
                        <button className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">
                          View file
                        </button>
                      </div>

                      {selectedReport?.id === report.id && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          {report.notes && (
                            <div className="mb-4 rounded-2xl bg-green-50 p-3 text-sm text-green-800">
                              <span className="font-semibold">Doctor note: </span>{report.notes}
                            </div>
                          )}
                          {saved && (
                            <div className="mb-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                              Note saved successfully.
                            </div>
                          )}
                          <label className="block text-sm font-medium text-slate-700">Add / update note</label>
                          <textarea
                            rows={3}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add clinical note or observation..."
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                          <button
                            onClick={handleAddNote}
                            className="mt-3 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                          >
                            Save note
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}