import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, MapPinned } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/issues', label: 'Explore Issues' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-700 text-marigold">
            <MapPinned size={18} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink-800">CivicFix</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {publicLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-ink-800' : 'text-slate hover:text-ink-700'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.role === 'citizen' && (
                <Link
                  to="/notifications"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                </Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-ink-100 py-1 pl-1 pr-3 hover:border-ink-300"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-ink-700">{user.name.split(' ')[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-ink-100 bg-white py-1.5 shadow-lg">
                    <Link
                      to={dashboardPath}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      Dashboard
                    </Link>
                    {user.role === 'citizen' && (
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <User size={14} /> Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-signal hover:bg-signal/5"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-ink-800">
                Log in
              </Link>
              <Link to="/register" className="btn-accent">
                Report an Issue
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((v) => !v)} className="md:hidden" aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {publicLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
                  Dashboard
                </Link>
                {user.role === 'citizen' && (
                  <Link to="/notifications" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
                    Notifications
                  </Link>
                )}
                <button onClick={handleLogout} className="text-left text-sm font-medium text-signal">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-accent w-fit">
                  Report an Issue
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
