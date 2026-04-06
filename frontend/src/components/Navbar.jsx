import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import FleetBadge from './FleetBadge';
import Avatar from './Avatar';
import { api } from '../services/api';

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    function fetchNotifs() {
      api.getNotifications().then(d => {
        setUnread(d.unread);
        setNotifs(d.notifications);
      }).catch(() => {});
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  function openNotifs() {
    setShowNotifs(v => !v);
    if (!showNotifs && unread > 0) {
      api.markNotificationsRead().then(() => setUnread(0)).catch(() => {});
    }
  }

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
            <NavLink to="/hoe-het-werkt" className={linkCls}>Hoe het werkt</NavLink>
            {user && <NavLink to="/uploaden" className={linkCls}>Uploaden</NavLink>}
            {user?.is_admin && <NavLink to="/beheer" className={linkCls}>Beheer</NavLink>}
          </div>

          {/* Desktop user */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notification bell */}
                <div className="relative">
                  <button onClick={openNotifs} className="relative p-1.5 text-jm-muted hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
                        style={{ background: 'var(--jm-pink)', color: 'white' }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 top-10 w-80 rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                      style={{ background: 'var(--jm-card)' }}>
                      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Meldingen</span>
                        <button onClick={() => setShowNotifs(false)} className="text-jm-muted hover:text-white text-xs">✕</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <p className="text-xs text-jm-muted px-4 py-6 text-center">Geen meldingen.</p>
                        ) : notifs.map(n => (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: n.type === 'like' ? '#E8196A22' : n.type === 'comment' ? '#0EA5E922' : '#8B5CF622' }}>
                              <span className="text-sm">
                                {n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : '🏷️'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/90 leading-snug">{n.message}</p>
                              <p className="text-[10px] text-jm-muted mt-0.5">
                                {new Date(n.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--jm-pink)' }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
          <NavLink to="/hoe-het-werkt" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Hoe het werkt</NavLink>
          {user && <NavLink to="/uploaden" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Uploaden</NavLink>}
          {user?.is_admin && <NavLink to="/beheer" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Beheer</NavLink>}
          {user ? (
            <>
              <NavLink to="/profiel" className="block text-sm font-medium text-jm-muted hover:text-white" onClick={() => setOpen(false)}>Mijn profiel</NavLink>
              <button onClick={() => { setOpen(false); openNotifs(); }}
                className="flex items-center gap-2 text-sm font-medium text-jm-muted hover:text-white">
                Meldingen {unread > 0 && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-black" style={{ background: 'var(--jm-pink)', color: 'white' }}>{unread}</span>}
              </button>
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
