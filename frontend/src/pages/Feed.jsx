import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import FleetBadge from '../components/FleetBadge';
import { IconHeight, IconAirtime, IconDistance } from '../components/Icons';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dagen geleden`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function FeedPost({ session }) {
  const [imgOpen, setImgOpen] = useState(false);

  return (
    <article className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/rijder/${session.user_id}`}>
          <Avatar user={{ name: session.user_name, avatar_url: session.avatar_url }} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/rijder/${session.user_id}`}
            className="font-bold text-white hover:text-jm-pink transition-colors text-sm">
            {session.user_name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <FleetBadge fleet={session.fleet} />
            <span className="text-xs text-jm-muted">{timeAgo(session.created_at)}</span>
          </div>
        </div>
        <span className="text-xl font-black text-jm-pink flex-shrink-0">
          {parseFloat(session.points).toFixed(2)} pts
        </span>
      </div>

      {/* Media */}
      {session.media_url && (
        <div className="relative cursor-pointer" onClick={() => setImgOpen(true)}>
          {session.media_type === 'video'
            ? <video src={session.media_url} className="w-full max-h-72 object-cover" controls onClick={e => e.stopPropagation()} />
            : <img src={session.media_url} alt="Sessie" className="w-full max-h-72 object-cover hover:opacity-95 transition-opacity" />}
        </div>
      )}

      {/* Caption */}
      {session.caption && (
        <p className="px-4 pt-3 text-sm text-white/80 italic">"{session.caption}"</p>
      )}

      {/* Tagged */}
      {session.tagged_names?.length > 0 && (
        <p className="px-4 pt-1 text-xs text-jm-pink">
          Uitdaging aan: {session.tagged_names.join(', ')}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 pt-3">
        {[
          { icon: <IconHeight className="w-4 h-4" />, value: `${parseFloat(session.height_m).toFixed(1)}m`, label: 'Hoogte', color: 'text-jm-pink' },
          { icon: <IconAirtime className="w-4 h-4" />, value: `${parseFloat(session.airtime_s).toFixed(1)}s`, label: 'Airtime', color: 'text-sky-400' },
          { icon: <IconDistance className="w-4 h-4" />, value: `${parseFloat(session.distance_m).toFixed(0)}m`, label: 'Afstand', color: 'text-violet-400' },
        ].map(({ icon, value, label, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--jm-base)' }}>
            <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
            <div className={`text-base font-black ${color}`}>{value}</div>
            <div className="text-[10px] text-jm-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {imgOpen && session.media_url && session.media_type !== 'video' && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
             onClick={() => setImgOpen(false)}>
          <img src={session.media_url} alt="Sessie" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </article>
  );
}

export default function Feed() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessionFeed()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Feed</h1>
        <p className="text-sm text-jm-muted">Nieuwste sessies van alle rijders</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-jm-pink border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-jm-muted text-sm">Laden...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-jm-muted">Nog geen sessies geplaatst.</p>
          <Link to="/uploaden" className="btn-primary mt-4 text-sm">Upload je eerste sessie</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => <FeedPost key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
}
