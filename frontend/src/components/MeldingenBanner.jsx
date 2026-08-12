import { useState } from 'react';
import { useMeldingen } from './MeldingenKnop';

// Weggeklikt onthouden we per account, zodat de balk niet blijft zeuren.
const sleutel = (userId) => `jm_meldingen_weg_${userId}`;

function alWeggeklikt(userId) {
  try {
    return localStorage.getItem(sleutel(userId)) === 'ja';
  } catch {
    return false;
  }
}

/**
 * Balk bovenaan de homepage voor wie meldingen nog niet aan heeft staan.
 * Verdwijnt zodra je ze aanzet of wegklikt.
 */
export default function MeldingenBanner({ user, className = '' }) {
  const { aan, bezig, fout, blokkade, schakel } = useMeldingen();
  const [weg, setWeg] = useState(() => alWeggeklikt(user?.id));

  // Niets tonen zolang we niet weten of ze al aanstaan, of als ze aanstaan.
  // Er komt dan ook geen omhullend element, dus geen lege marge op de pagina.
  if (!user || weg || aan === null || aan === true) return null;

  function klikWeg() {
    try { localStorage.setItem(sleutel(user.id), 'ja'); } catch { /* niets */ }
    setWeg(true);
  }

  return (
    <div className={`rounded-2xl p-4 border ${className}`}
         style={{ background: 'rgba(232,25,106,0.09)', borderColor: 'rgba(232,25,106,0.3)' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none flex-shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Zet meldingen aan</p>
          <p className="text-sm text-jm-muted mt-0.5 leading-snug">
            Dan weet je het meteen als iemand je tagt of je inhaalt.
          </p>
        </div>
        <button type="button" onClick={klikWeg} aria-label="Wegklikken"
                className="text-jm-muted hover:text-white text-lg leading-none flex-shrink-0 px-1">
          ✕
        </button>
      </div>

      {blokkade ? (
        <p className="text-sm mt-3 leading-relaxed" style={{ color: '#FDE68A' }}>{blokkade}</p>
      ) : (
        <button type="button" onClick={schakel} disabled={bezig}
                className="btn-primary w-full justify-center text-sm py-2.5 mt-3 disabled:opacity-60">
          {bezig ? 'Bezig...' : 'Aanzetten'}
        </button>
      )}
      {fout && <p className="text-sm text-red-400 mt-2">{fout}</p>}
    </div>
  );
}
