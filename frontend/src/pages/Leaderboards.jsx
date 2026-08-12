import { useEffect, useState } from 'react';
import { api } from '../services/api';
import LeaderboardTable from '../components/LeaderboardTable';
import { FLEET_STYLES } from '../components/FleetBadge';

const FLEETS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

function datumKort(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

export default function Leaderboards() {
  const [actief, setActief] = useState('Vandaag');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [feestweek, setFeestweek] = useState(null); // null = onbekend, false = niet ingesteld
  const [zelfGekozen, setZelfGekozen] = useState(false);

  useEffect(() => {
    api.leaderboardFeestweek()
      .then(({ periode, data: entries }) => {
        setFeestweek(periode);
        setData((prev) => ({ ...prev, Feestweek: entries }));
        if (periode.actief) setActief((huidig) => (zelfGekozen ? huidig : 'Feestweek'));
      })
      .catch(() => setFeestweek(false));
  }, []);

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

  function kies(naam) {
    setZelfGekozen(true);
    setActief(naam);
  }

  // De drie klassementen naast elkaar, elk met wat het inhoudt. Zonder die
  // regel eronder zijn het losse woorden waar niemand iets aan heeft.
  const klassementen = [
    feestweek && {
      key: 'Feestweek',
      titel: 'Feestweek',
      uitleg: `je ${feestweek.beste} beste sessies`,
      bijzonder: true,
    },
    { key: 'Vandaag',  titel: 'Vandaag',  uitleg: 'je beste sessie' },
    { key: 'Algeheel', titel: 'Seizoen',  uitleg: 'je 5 beste van het jaar' },
  ].filter(Boolean);

  const kop = {
    Feestweek: feestweek
      ? `${datumKort(feestweek.van)} tot en met ${datumKort(feestweek.tot)}`
      : '',
    Vandaag: 'Wie scoorde vandaag de meeste punten met één sessie',
    Algeheel: 'Het hele seizoen bij elkaar',
  }[actief] || `Alleen rijders in de klasse ${actief}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <div className="mb-5">
        <h1 className="text-3xl font-black text-white">Ranglijst 2026</h1>
        <p className="text-jm-muted mt-1">{kop}</p>
      </div>

      {/* Klassementen */}
      <div className="mb-4">
        <p className="text-xs font-bold text-jm-muted uppercase tracking-wider mb-2">
          Klassement
        </p>
        <div className={`grid gap-2 ${klassementen.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {klassementen.map((k) => {
            const aan = actief === k.key;
            return (
              <button key={k.key} onClick={() => kies(k.key)}
                className="rounded-xl px-3 py-2.5 text-left transition-all border"
                style={{
                  background: aan
                    ? (k.bijzonder ? 'linear-gradient(135deg, #E8196A, #FF4D8D)' : 'var(--jm-pink)')
                    : 'var(--jm-card)',
                  borderColor: aan ? 'transparent' : 'rgba(255,255,255,0.09)',
                  boxShadow: aan ? '0 4px 16px -4px rgba(232,25,106,0.5)' : 'none',
                }}>
                <span className={`block text-sm font-black leading-tight ${aan ? 'text-white' : 'text-white'}`}>
                  {k.bijzonder && <span className="mr-1">🎉</span>}
                  {k.titel}
                </span>
                <span className={`block text-xs mt-0.5 leading-tight ${aan ? 'text-white/85' : 'text-jm-muted'}`}>
                  {k.uitleg}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Klassen */}
      <div className="mb-5">
        <p className="text-xs font-bold text-jm-muted uppercase tracking-wider mb-2">
          Of kijk per klasse
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FLEETS.map((f) => {
            const aan = actief === f;
            const stijl = FLEET_STYLES[f];
            return (
              <button key={f} onClick={() => kies(f)}
                className="flex-shrink-0 rounded-lg px-3.5 py-2 text-sm font-bold transition-all border flex items-center gap-2"
                style={{
                  background: aan ? `${stijl.hex}22` : 'var(--jm-card)',
                  borderColor: aan ? stijl.hex : 'rgba(255,255,255,0.09)',
                  color: aan ? stijl.hex : 'var(--jm-muted)',
                }}>
                <span className="w-2 h-2 rounded-full" style={{ background: stijl.hex }} />
                {f}
              </button>
            );
          })}
        </div>
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
