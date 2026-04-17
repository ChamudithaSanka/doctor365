import { Link } from 'react-router-dom'

const footerLinks = [
  {
    title: 'Platform',
    links: ['Doctors', 'Appointments', 'Payments', 'Notifications'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Privacy', 'Terms', 'Contact'],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-purple-500/20 bg-gradient-to-b from-slate-950 to-indigo-950 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight text-purple-300">
              Doctor365
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              Modern healthcare platform. Smart appointments, secure consultations, intelligent care delivery.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">{group.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="transition hover:text-purple-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-purple-500/20 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Doctor365. All rights reserved.</p>
          <p className="text-purple-400">⚕️ Healthcare redefined. Smart, secure, seamless.</p>
        </div>
      </div>
    </footer>
  )
}