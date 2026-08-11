import { useEffect, useState } from 'react';
import { api } from '../services/api';
import LeaderboardTable from '../components/LeaderboardTable';

const KLASSEN = ['Vandaag', 'Algeheel', 'Bronze', 'Silver', 'Gold', 'Platinum'];

const ONDERTITELS = {
  Vandaag: 'Alle sessies van vandaag tellen mee',
  Algeheel: 'Top 5 sessies tellen mee voor het eindklassement',
};

function haalOp(klasse) {
  if (klasse === 'Vandaag') return api.leaderboardDaily();
  if (klasse === 'Algeheel') return api.leaderboardOverall();
  return api.leaderboardFleet(klasse);
}

export default function Leaderboards() {
  const [actief, setActief] = useState('Vandaag');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data[actief]) return;
    setLoading(true);
    haalOp(actief)
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
              {ONDERTITELS[actief] || `Klassement binnen ${actief}`}
            </p>
          </div>
          <img src="/logo-text.png" alt="" className="h-7 hidden sm:block opacity-40"
            onError={(e) => e.target.style.display='none'} />
        </div>
      </div>

      {/* Fleet tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {KLASSEN.map((k) => (
          <button key={k} onClick={() => setActief(k)}
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
          : <LeaderboardTable entries={data[actief] || []} showFleet={actief === 'Algeheel' || actief === 'Vandaag'} />}
      </div>
    </div>
  );
}
