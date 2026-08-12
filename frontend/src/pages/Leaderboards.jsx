import { useEffect, useState } from 'react';
import { api } from '../services/api';
import LeaderboardTable from '../components/LeaderboardTable';

const VASTE_KLASSEN = ['Vandaag', 'Algeheel', 'Bronze', 'Silver', 'Gold', 'Platinum'];

function datumKort(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

export default function Leaderboards() {
  const [actief, setActief] = useState('Vandaag');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [feestweek, setFeestweek] = useState(null); // null = nog onbekend, false = niet ingesteld
  const [zelfGekozen, setZelfGekozen] = useState(false);

  // Het feestweek-tabblad verschijnt alleen als de periode is ingesteld.
  // Loopt de week op dit moment, dan opent de ranglijst er meteen op — tenzij
  // je zelf al een ander tabblad had aangetikt.
  useEffect(() => {
    api.leaderboardFeestweek()
      .then(({ periode, data: entries }) => {
        setFeestweek(periode);
        setData((prev) => ({ ...prev, Feestweek: entries }));
        if (periode.actief) setActief((huidig) => (zelfGekozen ? huidig : 'Feestweek'));
      })
      .catch(() => setFeestweek(false));
  }, []);

  function kiesTabblad(naam) {
    setZelfGekozen(true);
    setActief(naam);
  }

  const klassen = feestweek ? ['Feestweek', ...VASTE_KLASSEN] : VASTE_KLASSEN;

  const ondertitels = {
    Vandaag: 'Je 5 beste sessies van vandaag tellen mee',
    Algeheel: 'Top 5 sessies tellen mee voor het eindklassement',
    Feestweek: feestweek
      ? `${datumKort(feestweek.van)} t/m ${datumKort(feestweek.tot)} · je ${feestweek.beste} beste sessies tellen mee`
      : '',
  };

  useEffect(() => {
    if (data[actief] || actief === 'Feestweek') return;
    setLoading(true);
    const ophalen =
      actief === 'Vandaag'  ? api.leaderboardDaily() :
      actief === 'Algeheel' ? api.leaderboardOverall() :
                              api.leaderboardFleet(actief);
    ophalen
      .then((entries) => setData((prev) => ({ ...prev, [actief]: entries })))
      .catch(() => setData((prev) => ({ ...prev, [actief]: [] })))
      .finally(() => setLoading(false));
  }, [actief]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="card p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Ranglijst 2026</h1>
            <p className="text-jm-muted mt-1">
              {ondertitels[actief] || `Klassement binnen ${actief}`}
            </p>
          </div>
          <img src="/logo-text.png" alt="" className="h-7 hidden sm:block opacity-40"
            onError={(e) => e.target.style.display='none'} />
        </div>
      </div>

      {/* Fleet tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {klassen.map((k) => (
          <button key={k} onClick={() => kiesTabblad(k)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              actief === k
                ? 'bg-jm-pink text-white shadow-lg shadow-jm-pink/20'
                : 'bg-jm-card text-jm-muted hover:text-white border border-white/[0.07]'
            }`}>
            {k}
          </button>
        ))}
      </div>

      <div className="card p-4 md:p-6">
        {loading
          ? <div className="text-center py-16 text-jm-muted">Laden...</div>
          : <LeaderboardTable entries={data[actief] || []}
              showFleet={['Algeheel', 'Vandaag', 'Feestweek'].includes(actief)} />}
      </div>
    </div>
  );
}
