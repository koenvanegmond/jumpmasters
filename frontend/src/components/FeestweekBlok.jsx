import { Link } from 'react-router-dom';
import Avatar from './Avatar';

function datumKort(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function dagenTot(iso) {
  const vandaag = new Date(new Date().toDateString());
  const start = new Date(iso + 'T00:00:00');
  return Math.round((start - vandaag) / 86400000);
}

/**
 * Feestweek is een keer per jaar, dus dit blok ziet er anders uit dan de rest
 * van de site: een gevulde roze kaart in plaats van de gewone donkere.
 */
export default function FeestweekBlok({ periode, entries }) {
  if (!periode) return null;

  const dagen = dagenTot(periode.van);
  const komtEraan = dagen > 0;
  const top3 = (entries || []).slice(0, 3);

  return (
    <div className="relative overflow-hidden rounded-2xl p-5"
         style={{
           background: 'linear-gradient(135deg, #E8196A 0%, #C4145A 55%, #7A0E3A 100%)',
           boxShadow: '0 12px 30px -12px rgba(232,25,106,0.6)',
         }}>
      {/* confetti-achtige stippen, puur decoratief */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.13] pointer-events-none" aria-hidden="true">
        <defs>
          <pattern id="fw-stip" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2" fill="white" />
            <circle cx="17" cy="15" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fw-stip)" />
      </svg>

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              Feestweek editie 🎉
            </h2>
            <p className="text-sm text-white/85 mt-1">
              {datumKort(periode.van)} tot en met {datumKort(periode.tot)}.
              Je {periode.beste} beste sessies tellen.
            </p>
          </div>
          {komtEraan && (
            <div className="flex-shrink-0 rounded-xl px-3 py-2 text-center"
                 style={{ background: 'rgba(255,255,255,0.16)' }}>
              <div className="text-sm font-black text-white leading-tight">
                Nog {dagen}<br />{dagen === 1 ? 'dag!' : 'dagen!'}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          {top3.length === 0 ? (
            <p className="text-sm text-white/80 rounded-xl px-3 py-3"
               style={{ background: 'rgba(0,0,0,0.18)' }}>
              {komtEraan
                ? 'Nog niet begonnen. Wie zet de eerste score neer?'
                : 'Nog geen sessies vandaag. Wees de eerste.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {top3.map((e) => (
                <Link to={`/rijder/${e.user_id}`} key={e.user_id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(0,0,0,0.18)' }}>
                  <span className="w-5 text-center font-black text-white/70 text-sm tabular-nums">
                    {e.rank}
                  </span>
                  <Avatar user={{ name: e.name, avatar_url: e.avatar_url }} size="sm" />
                  <span className="flex-1 min-w-0 font-bold text-white text-sm truncate">
                    {e.name}
                  </span>
                  <span className="font-black text-white tabular-nums">
                    {parseFloat(e.total_points).toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/ranglijst"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-white">
          Hele feestweekranglijst
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
