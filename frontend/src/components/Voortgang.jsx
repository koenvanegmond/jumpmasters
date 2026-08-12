import { FLEET_STYLES } from './FleetBadge';

const STRAAL = 62;
const OMTREK = 2 * Math.PI * STRAAL;

// Waar begint de klasse waar je nu in zit? Dat is het startpunt van de ring.
const ONDERGRENS = { Bronze: 0, Silver: 5, Gold: 10, Platinum: 15 };

function Ring({ deel, kleur, midden, onder }) {
  const gevuld = Math.max(0, Math.min(1, deel));
  return (
    <div className="relative flex-shrink-0" style={{ width: 150, height: 150 }}>
      <svg width="150" height="150" className="-rotate-90">
        <circle cx="75" cy="75" r={STRAAL} fill="none"
                stroke="rgba(255,255,255,0.10)" strokeWidth="12" />
        <circle cx="75" cy="75" r={STRAAL} fill="none"
                stroke={kleur} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={OMTREK}
                strokeDashoffset={OMTREK * (1 - gevuld)}
                style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{midden}</span>
        <span className="text-[11px] text-jm-muted mt-1">{onder}</span>
      </div>
    </div>
  );
}

export default function Voortgang({ stats, fleet }) {
  const { max_height, volgende_klasse, boven_mij, rank_overall, rijders_totaal } = stats;

  const vanaf = ONDERGRENS[fleet] ?? 0;
  const deel = volgende_klasse
    ? (max_height - vanaf) / (volgende_klasse.min_hoogte - vanaf)
    : 1;

  const kleur = FLEET_STYLES[volgende_klasse?.naam || fleet]?.hex || '#FF4D8D';

  return (
    <div className="card p-5 md:p-6">
      <h2 className="text-lg font-black text-white mb-4">Jouw voortgang</h2>

      <div className="flex items-center gap-5">
        <Ring
          deel={deel}
          kleur={kleur}
          midden={volgende_klasse ? `${max_height.toFixed(1)} m` : 'Top'}
          onder={volgende_klasse ? `van ${volgende_klasse.min_hoogte} m` : 'hoogste klasse'}
        />

        <div className="min-w-0 space-y-3">
          {volgende_klasse ? (
            <div>
              <p className="text-base text-white leading-snug">
                Spring <strong className="font-black" style={{ color: kleur }}>
                  {volgende_klasse.min_hoogte} m
                </strong> en je zit in {volgende_klasse.naam}.
              </p>
              <p className="text-sm text-jm-muted mt-0.5">
                Je hoogste tot nu toe is {max_height.toFixed(1)} m.
              </p>
            </div>
          ) : (
            <p className="text-base text-white leading-snug">
              Je zit in Platinum, de hoogste klasse. Niets meer boven je.
            </p>
          )}

          {boven_mij ? (
            <div className="pt-3 border-t border-white/[0.07]">
              <p className="text-base text-white leading-snug">
                {boven_mij.verschil <= 0 ? (
                  <>Je staat gelijk met {boven_mij.naam}. Eén sessie en je gaat eroverheen.</>
                ) : (
                  <>
                    Nog <strong className="font-black text-jm-pinkText">
                      {boven_mij.verschil.toFixed(2)} punten
                    </strong> en je gaat over {boven_mij.naam} heen.
                  </>
                )}
              </p>
              <p className="text-sm text-jm-muted mt-0.5">
                Je staat {rank_overall}e van de {rijders_totaal}.
              </p>
            </div>
          ) : (
            <div className="pt-3 border-t border-white/[0.07]">
              <p className="text-base text-white leading-snug">
                Je staat bovenaan. Niemand om in te halen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
