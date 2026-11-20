import { Link } from 'react-router-dom';
import { MapPinned, ArrowRight, ShieldCheck } from 'lucide-react';

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/issues', label: 'Explore Issues' },
  { to: '/register', label: 'Report an Issue' },
];

const supportLinks = [
  { to: '/login', label: 'Citizen Login' },
  { to: '/register', label: 'Create Account' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-100 bg-ink-800 text-paper">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-marigold text-ink-800">
                <MapPinned size={19} />
              </span>
              <span className="font-display text-xl font-semibold">CivicFix</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-ink-200">
              Report civic issues, follow every update, and help build cleaner, safer neighborhoods together.
            </p>
            <Link
              to="/register"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-marigold hover:text-marigold-light"
            >
              Make a report <ArrowRight size={16} />
            </Link>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-paper">Explore</h2>
            <nav className="mt-4 flex flex-col gap-3" aria-label="Footer navigation">
              {quickLinks.map((link) => (
                <Link
                  key={`${link.to}-${link.label}`}
                  to={link.to}
                  className="text-sm text-ink-200 transition-colors hover:text-marigold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-paper">Get started</h2>
            <nav className="mt-4 flex flex-col gap-3" aria-label="Account navigation">
              {supportLinks.map((link) => (
                <Link
                  key={`${link.to}-${link.label}`}
                  to={link.to}
                  className="text-sm text-ink-200 transition-colors hover:text-marigold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-ink-600 pt-6 text-xs text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} CivicFix. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <ShieldCheck size={15} className="text-marigold" />
            Built for citizens and municipal authorities
          </p>
        </div>
      </div>
    </footer>
  );
}