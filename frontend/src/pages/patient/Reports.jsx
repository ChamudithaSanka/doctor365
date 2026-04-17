import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'

const getToken = () => localStorage.getItem('doctor365_accessToken')

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(d)
}

const getMimeLabel = (mime) => {
  if (!mime) return 'Unknown'
  if (mime === 'application/pdf') return 'PDF'
  if (mime.startsWith('image/')) return mime.split('/')[1].toUpperCase()
  return mime
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [filter, setFilter] = useState('All')
  const fileInputRef = useRef(null)

  const loadReports = async (signal) => {
    const token = getToken()
    if (!token) {
      setError('You need to sign in to view your reports.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${gatewayBaseUrl}/api/patients/me/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      setReports(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err?.response?.data?.error?.message || 'Unable to load your reports.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadReports(controller.signal)
    return () => controller.abort()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) return

    const token = getToken()
    if (!token) {
      setUploadError('You need to sign in.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const formData = new FormData()
    for (const file of files) {
      formData.append('reports', file)
    }

    try {
      await axios.post(`${gatewayBaseUrl}/api/patients/me/reports`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      setUploadSuccess(`${files.length} report(s) uploaded and saved to your medical record.`)
      fileInputRef.current.value = ''
      // Reload reports from DB
      await loadReports()
    } catch (err) {
      setUploadError(err?.response?.data?.error?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return
    
    const token = getToken()
    if (!token) return
    try {
      await axios.delete(`${gatewayBaseUrl}/api/patients/me/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReports((prev) => prev.filter((r) => r._id !== reportId))
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Unable to delete report.')
    }
  }

  const handleView = async (reportId) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await axios.get(`${gatewayBaseUrl}/api/patients/reports/${reportId}/file`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const contentType = res.headers['content-type']
      const file = new Blob([res.data], { type: contentType })
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
    } catch (err) {
      console.error('View failed', err)
      setError('Unable to open the file. Please try downloading it instead.')
    }
  }

  const handleDownload = async (reportId, filename) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await axios.get(`${gatewayBaseUrl}/api/patients/reports/${reportId}/file?download=true`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
      setError('Download failed. Please try again.')
    }
  }

  // Derive mime-based type labels for filter tabs
  const typeLabel = (mime) => {
    if (!mime) return 'Other'
    if (mime === 'application/pdf') return 'PDF'
    if (mime.startsWith('image/')) return 'Image'
    return 'Other'
  }

  const types = ['All', 'PDF', 'Image']
  const filtered = filter === 'All' ? reports : reports.filter((r) => typeLabel(r.mimeType) === filter)

  const thisYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950">
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">My health</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Medical Reports</h1>
          <p className="mt-1 text-sm text-slate-300">
            Upload and view your medical reports — stored securely in your database.
          </p>
        </div>

        {/* Upload form */}
        <div className="mb-8 rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-100">Upload a new report</h2>
          <p className="mt-1 text-sm text-slate-300">Accepted: PDF, JPG, PNG — max 5 MB each. Up to 5 files at once.</p>

          <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="block w-full flex-1 rounded-lg border border-slate-600/30 bg-slate-800/30 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-orange-600/30 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-300 hover:file:bg-orange-600/50 backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>

          {uploadSuccess && (
            <p className="mt-3 rounded-lg border border-green-500/30 bg-green-600/10 px-4 py-3 text-sm font-medium text-green-300 backdrop-blur-md">
              ✓ {uploadSuccess}
            </p>
          )}
          {uploadError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-600/10 px-4 py-3 text-sm text-red-300 backdrop-blur-md">
              {uploadError}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total reports', value: loading ? '—' : reports.length },
            { label: 'PDF reports', value: loading ? '—' : reports.filter((r) => r.mimeType === 'application/pdf').length },
            { label: 'This year', value: loading ? '—' : reports.filter((r) => new Date(r.uploadDate).getFullYear() === thisYear).length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 shadow-sm backdrop-blur-md">
              <p className="text-sm font-medium text-slate-400">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-600/10 p-4 text-sm text-red-300 backdrop-blur-md">{error}</div>
        )}

        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === t
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm'
                  : 'border border-purple-500/20 bg-purple-600/10 text-slate-300 hover:bg-purple-600/20 backdrop-blur-md'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Report list */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-8 text-center text-sm text-slate-400 backdrop-blur-md">
              Loading your reports…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-purple-500/20 bg-purple-600/10 p-10 text-center backdrop-blur-md">
              <p className="text-sm font-medium text-slate-400">
                {filter === 'All' ? 'No reports uploaded yet.' : `No ${filter} reports found.`}
              </p>
            </div>
          ) : (
            filtered.map((report) => (
              <div
                key={report._id}
                className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-5 shadow-sm transition hover:border-purple-500/40 backdrop-blur-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-100">{report.title || report.originalName}</h3>
                        <span className="rounded-full bg-purple-600/30 px-2.5 py-0.5 text-xs font-semibold text-purple-200 border border-purple-500/20">
                          {getMimeLabel(report.mimeType)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {report.originalName} &middot; Uploaded {formatDate(report.uploadDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleView(report._id)}
                      className="rounded-lg border border-purple-500/30 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-600/20 backdrop-blur-md"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(report._id, report.originalName)}
                      className="rounded-lg border border-slate-600/30 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/30 backdrop-blur-md"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-600/20 backdrop-blur-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}