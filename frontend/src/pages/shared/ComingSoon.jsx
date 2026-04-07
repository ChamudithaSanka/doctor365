export default function ComingSoon({ title, description }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
        This page uses the same responsive shell and navigation.
      </div>
    </div>
  )
}