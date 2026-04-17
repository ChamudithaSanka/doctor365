export default function ComingSoon({ title, description }) {
  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-600/10 p-6 shadow-lg backdrop-blur-md sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6 rounded-lg bg-purple-600/20 p-5 text-sm text-slate-300 border border-purple-500/20">
        This page uses the same responsive shell and navigation.
      </div>
    </div>
  )
}