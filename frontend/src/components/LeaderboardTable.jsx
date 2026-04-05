import { Link } from 'react-router-dom';
import FleetBadge from './FleetBadge';
import Avatar from './Avatar';

function Medal({ rank }) {
  if (rank === 1) return <span className="text-yellow-400 font-black">1</span>;
  if (rank === 2) return <span className="text-slate-400 font-black">2</span>;
  if (rank === 3) return <span className="text-amber-600 font-black">3</span>;
  return <span className="text-jm-muted font-semibold text-sm">{rank}</span>;
}

export default function LeaderboardTable({ entries, showFleet = true }) {
  if (!entries || entries.length === 0) {
    return <div className="text-center py-12 text-jm-muted">Nog geen rijders. Wees de eerste!</div>;
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="text-center py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider w-10">#</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Rijder</th>
              {showFleet && <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Klasse</th>}
              <th className="text-right py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Punten</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Sessies</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Beste sprong</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {entries.map((entry) => (
              <tr key={entry.user_id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="py-3.5 px-4 text-center"><Medal rank={entry.rank} /></td>
                <td className="py-3.5 px-4">
                  <Link to={`/rijder/${entry.user_id}`} className="flex items-center gap-3">
                    <Avatar user={{ name: entry.name, avatar_url: entry.avatar_url }} size="sm" />
                    <span className="font-semibold text-white group-hover:text-jm-pink transition-colors">{entry.name}</span>
                  </Link>
                </td>
                {showFleet && <td className="py-3.5 px-4"><FleetBadge fleet={entry.fleet} /></td>}
                <td className="py-3.5 px-4 text-right font-black text-jm-pink text-base">{entry.total_points.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right text-jm-muted">{entry.sessions_count}</td>
                <td className="py-3.5 px-4 text-right text-jm-muted">{entry.max_height.toFixed(1)} m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {entries.map((entry) => (
          <Link to={`/rijder/${entry.user_id}`} key={entry.user_id}
            className="flex items-center gap-3 bg-jm-base hover:bg-white/[0.03] rounded-xl p-3.5 transition-colors border border-white/[0.06]">
            <div className="w-8 text-center font-black text-lg"><Medal rank={entry.rank} /></div>
            <Avatar user={{ name: entry.name, avatar_url: entry.avatar_url }} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate text-sm">{entry.name}</div>
              {showFleet && <div className="mt-1"><FleetBadge fleet={entry.fleet} /></div>}
            </div>
            <div className="text-right">
              <div className="font-black text-jm-pink">{entry.total_points.toFixed(2)}</div>
              <div className="text-xs text-jm-muted">{entry.max_height.toFixed(1)} m</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
