import { Link } from 'react-router-dom'

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            403 / Access Denied
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            You do not have permission to access this page.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            This area is restricted for your current role. If you believe this is a mistake, contact an administrator or return to the home page.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Go Home
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}