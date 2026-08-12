import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import FleetBadge from './FleetBadge';

// Sokkelhoogtes: de winnaar staat zichtbaar hoger dan de nummers 2 en 3.
// Zilver en brons zijn opgelicht: #94A3B8 en #CD7F32 haalden maar 2,6 en 3,1
// contrast op de donkere sokkel, en dat leest voor geen meter in de zon.
const PLEK = {
  1: { hoogte: 'h-16', kleur: 'var(--jm-pink-text)', volgorde: 'order-2' },
  2: { hoogte: 'h-11', kleur: '#CBD5E1',             volgorde: 'order-1' },
  3: { hoogte: 'h-8',  kleur: '#FBBF24',             volgorde: 'order-3' },
};

function Plek({ entry }) {
  const p = PLEK[entry.rank] || PLEK[3];
  const eerste = entry.rank === 1;

  return (
    <Link to={`/rijder/${entry.user_id}`}
      className={`${p.volgorde} flex-1 flex flex-col items-center justify-end gap-2 min-w-0 group`}>
      <Avatar user={{ name: entry.name, avatar_url: entry.avatar_url }} size={eerste ? 'lg' : 'md'} />

      <div className="text-center min-w-0 w-full px-0.5">
        <div className={`font-bold text-white truncate group-hover:text-jm-pinkText transition-colors ${eerste ? 'text-sm' : 'text-xs'}`}>
          {entry.name}
        </div>
        <div className={`font-black text-jm-pinkText tabular-nums ${eerste ? 'text-xl' : 'text-base'}`}>
          {parseFloat(entry.total_points).toFixed(2)}
        </div>
        <div className="text-[11.5px] text-jm-muted">
          {parseFloat(entry.max_height) > 0 ? `${parseFloat(entry.max_height).toFixed(1)} m` : '—'}
        </div>
      </div>

      <div className={`w-full ${p.hoogte} rounded-t-lg flex items-start justify-center pt-1.5 font-black text-sm`}
           style={{
             background: eerste ? 'rgba(232,25,106,0.16)' : 'rgba(255,255,255,0.05)',
             borderTop: `2px solid ${p.kleur}`,
             color: p.kleur,
           }}>
        {entry.rank}
      </div>
    </Link>
  );
}

/**
 * Podium voor de top 3. Valt terug op een gewone rij zolang er nog geen drie
 * rijders zijn, zodat het er bij een lege competitie niet kaal uitziet.
 */
export default function Podium({ entries }) {
  const top3 = (entries || []).slice(0, 3);
  if (top3.length === 0) return null;

  if (top3.length < 3) {
    return (
      <div className="space-y-2">
        {top3.map((e) => (
          <Link to={`/rijder/${e.user_id}`} key={e.user_id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="w-6 text-center font-black text-jm-muted text-sm">{e.rank}</span>
            <Avatar user={{ name: e.name, avatar_url: e.avatar_url }} size="sm" />
            <span className="flex-1 min-w-0 font-semibold text-white truncate">{e.name}</span>
            <FleetBadge fleet={e.fleet} />
            <span className="font-black text-jm-pinkText tabular-nums">
              {parseFloat(e.total_points).toFixed(2)}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      {top3.map((e) => <Plek key={e.user_id} entry={e} />)}
    </div>
  );
}
