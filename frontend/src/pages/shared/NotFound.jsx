import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            404 / Not Found
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            We could not find that page.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            The link may be broken, the page may have moved, or you may have entered the wrong address.
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