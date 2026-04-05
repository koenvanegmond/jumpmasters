import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import FleetBadge from './FleetBadge';
import Avatar from './Avatar';

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() { logout(); onLogout(); navigate('/inloggen'); }

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors px-1 py-0.5 ${isActive
      ? 'text-white border-b-2 border-jm-pink'
      : 'text-jm-muted hover:text-white'}`;

  return (
    <nav className="bg-jm-card/80 backdrop-blur-md border-b border-white/[0.07] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo-text.png" alt="JumpMasters" className="h-8"
              onError={(e) => {
                e.target.style.display = 'none';
                document.getElementById('jm-logo-fallback').style.display = 'flex';
              }} />
            <span id="jm-logo-fallback"
              className="hidden items-center font-black text-xl tracking-wide text-jm-pink">
              JUMPMASTERS
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={linkCls} end>Home</NavLink>
            <NavLink to="/feed" className={linkCls}>Feed</NavLink>
            <NavLink to="/wind" className={linkCls}>Wind</NavLink>
            <NavLink to="/ranglijst" className={linkCls}>Ranglijst</NavLink>
            <NavLink to="/nieuws" className={linkCls}>Nieuws</NavLink>
            {user && <NavLink to="/uploaden" className={linkCls}>Uploaden</NavLink>}
            {user?.is_admin && <NavLink to="/beheer" className={linkCls}>Beheer</NavLink>}
          </div>

          {/* Desktop user */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <NavLink to="/profiel" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                  <Avatar user={user} size="sm" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
                    <div className="mt-0.5"><FleetBadge fleet={user.fleet} /></div>
                  </div>
                </NavLink>
                <button onClick={handleLogout} className="text-xs text-jm-muted hover:text-white transition-colors">
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link to="/inloggen" className="text-sm font-medium text-jm-muted hover:text-white transition-colors">Inloggen</Link>
                <Link to="/registreren" className="btn-primary text-sm py-2 px-4">Registreren</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-jm-muted hover:text-white" onClick={() => setOpen(!open)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.07] bg-jm-card px-4 py-4 space-y-3">
          <NavLink to="/" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/feed" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Feed</NavLink>
          <NavLink to="/wind" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Wind</NavLink>
          <NavLink to="/ranglijst" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Ranglijst</NavLink>
          <NavLink to="/nieuws" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Nieuws</NavLink>
          {user && <NavLink to="/uploaden" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Uploaden</NavLink>}
          {user?.is_admin && <NavLink to="/beheer" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Beheer</NavLink>}
          {user ? (
            <>
              <NavLink to="/profiel" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Mijn profiel</NavLink>
              <button onClick={handleLogout} className="block text-sm text-red-400">Uitloggen</button>
            </>
          ) : (
            <>
              <Link to="/inloggen" className="block text-sm text-jm-muted" onClick={() => setOpen(false)}>Inloggen</Link>
              <Link to="/registreren" className="block text-sm font-semibold text-jm-pink" onClick={() => setOpen(false)}>Registreren</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
