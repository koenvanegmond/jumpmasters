import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import FleetBadge from '../components/FleetBadge';
import SessionCard from '../components/SessionCard';
import Avatar from '../components/Avatar';

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-2xl font-black text-white">{value ?? '—'}</div>
      {sub && <div className="text-xs text-jm-muted mt-0.5">{sub}</div>}
      <div className="text-sm text-jm-muted mt-1">{label}</div>
    </div>
  );
}

export default function Profile({ user, onUserUpdate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '' });
  const [pwMsg, setPwMsg] = useState('');
  const avatarRef = useRef();

  useEffect(() => {
    if (!user) return;
    api.userStats(user.id).then(setData).catch((err) => setError(err.message));
  }, [user]);

  async function handleAvatar(file) {
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { avatar_url } = await api.uploadAvatar(fd);
      onUserUpdate({ ...user, avatar_url });
    } catch (err) { alert(err.message); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMsg('');
    try {
      await api.changePassword({ current_password: pwForm.current, new_password: pwForm.next });
      setPwMsg('Wachtwoord bijgewerkt.');
      setPwForm({ current: '', next: '' });
    } catch (err) { setPwMsg(err.message); }
  }

  if (!user) return <div className="text-center py-16 text-jm-muted">Log in om je profiel te bekijken.</div>;
  if (error) return <div className="text-center py-16 text-red-400">{error}</div>;
  if (!data) return <div className="text-center py-16 text-jm-muted">Laden...</div>;

  const { stats, recent_sessions } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative group cursor-pointer" onClick={() => avatarRef.current.click()}>
          <Avatar user={user} size="xl" />
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
            Wijzigen
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files[0] && handleAvatar(e.target.files[0])} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">{user.name}</h1>
          <p className="text-sm text-jm-muted">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <FleetBadge fleet={user.fleet} size="lg" />
            <span className="text-sm text-jm-muted">Rang #{stats.rank_overall}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Algehele rang" value={`#${stats.rank_overall}`} />
        <StatCard label="Klasserang" value={`#${stats.rank_in_fleet}`} sub={user.fleet} />
        <StatCard label="Totaal punten" value={stats.total_points.toFixed(2)} />
        <StatCard label="Sessies" value={stats.sessions_count} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Beste sprong" value={`${stats.max_height.toFixed(1)} m`} />
        <StatCard label="Gem. sprong" value={`${stats.avg_height.toFixed(1)} m`} />
        <StatCard label="Max vliegtijd" value={`${stats.max_airtime.toFixed(1)} s`} />
        <StatCard label="Max afstand" value={`${stats.max_distance.toFixed(0)} m`} />
      </div>

      {/* Sessions */}
      <div>
        <h2 className="text-lg font-black text-white mb-3">Mijn sessies</h2>
        {recent_sessions.length === 0 ? (
          <p className="text-jm-muted text-sm">Nog geen sessies.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recent_sessions.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="text-lg font-black text-white mb-4">Wachtwoord wijzigen</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
          {pwMsg && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${
              pwMsg === 'Wachtwoord bijgewerkt.'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {pwMsg}
            </div>
          )}
          <input type="password" placeholder="Huidig wachtwoord" required value={pwForm.current}
            onChange={(e) => setPwForm(p => ({ ...p, current: e.target.value }))} className="input" />
          <input type="password" placeholder="Nieuw wachtwoord (min. 8 tekens)" required value={pwForm.next}
            onChange={(e) => setPwForm(p => ({ ...p, next: e.target.value }))} className="input" />
          <button type="submit" className="btn-primary text-sm py-2.5 px-5">
            Wachtwoord opslaan
          </button>
        </form>
      </div>
    </div>
  );
}
