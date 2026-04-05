import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import FleetBadge from '../components/FleetBadge';
import SessionCard from '../components/SessionCard';
import Avatar from '../components/Avatar';

function StatCard({ label, value }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-2xl font-black text-white">{value ?? '—'}</div>
      <div className="text-sm text-jm-muted mt-1">{label}</div>
    </div>
  );
}

export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.userStats(id).then(setData).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="text-center py-16 text-red-400">{error}</div>;
  if (!data) return <div className="text-center py-16 text-jm-muted">Laden...</div>;

  const { user, stats, recent_sessions } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="card p-6 flex items-center gap-5">
        <Avatar user={user} size="xl" />
        <div>
          <h1 className="text-2xl font-black text-white">{user.name}</h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <FleetBadge fleet={user.fleet} size="lg" />
            <span className="text-jm-muted text-sm">#{stats.rank_overall} algeheel</span>
            <span className="text-jm-muted text-sm">· #{stats.rank_in_fleet} in {user.fleet}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Totaal punten" value={stats.total_points.toFixed(2)} />
        <StatCard label="Sessies" value={stats.sessions_count} />
        <StatCard label="Beste sprong" value={`${stats.max_height.toFixed(1)} m`} />
        <StatCard label="Max vliegtijd" value={`${stats.max_airtime.toFixed(1)} s`} />
      </div>

      {/* Sessions */}
      <div>
        <h2 className="text-lg font-black text-white mb-3">Sessies</h2>
        {recent_sessions.length === 0 ? (
          <p className="text-jm-muted text-sm">Nog geen sessies geüpload.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recent_sessions.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>

      <Link to="/ranglijst" className="block text-center text-sm text-jm-pink font-semibold hover:underline">
        ← Terug naar ranglijst
      </Link>
    </div>
  );
}
