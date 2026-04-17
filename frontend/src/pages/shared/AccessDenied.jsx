import { Link } from 'react-router-dom'

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-lg border border-rose-600/30 bg-rose-600/10 p-8 shadow-2xl backdrop-blur-md sm:p-10">
          <div className="inline-flex rounded-full bg-rose-600/30 px-4 py-2 text-sm font-semibold text-rose-300 ring-1 ring-rose-600/50">
            403 / Access Denied
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            You do not have permission to access this page.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            This area is restricted for your current role. If you believe this is a mistake, contact an administrator or return to the home page.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-orange-700 hover:to-orange-600"
            >
              Go Home
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-600/30 bg-slate-800/20 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/40 backdrop-blur-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}