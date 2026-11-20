import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogOut, MapPinned, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ items, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-marigold text-ink-800">
          <MapPinned size={18} />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-paper">CivicFix</p>
          <p className="text-[11px] text-ink-300">{title}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-marigold text-ink-800' : 'text-ink-100 hover:bg-ink-600'
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-600 px-3 py-4">
        <div className="mb-2 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-600 text-xs font-semibold text-paper">
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-paper">{user?.name}</p>
            <p className="truncate text-xs capitalize text-ink-300">{user?.role}</p>
          </div>
        </div>
        <Link to="/" className="block px-2 py-1.5 text-xs text-ink-300 hover:text-paper">
          ← Back to site
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-ink-100 hover:bg-ink-600"
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-ink-700 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-marigold text-ink-800">
            <MapPinned size={15} />
          </span>
          <span className="font-display text-sm font-semibold text-paper">CivicFix — {title}</span>
        </div>
        <button onClick={() => setOpen(true)} className="text-paper">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-ink-700">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 text-paper">
              <X size={20} />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-ink-700 lg:block">{content}</aside>
    </>
  );
}
