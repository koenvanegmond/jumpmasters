import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INTRO_KORT, SURFR_VERMELDING } from '../content';

// Per account onthouden, niet per browser: log je op dezelfde telefoon in met
// een ander account, dan hoort die de uitleg ook één keer te krijgen.
const sleutel = (userId) => `jm_uitleg_gezien_${userId}`;

export function uitlegAlGezien(userId) {
  if (!userId) return true;
  try {
    return localStorage.getItem(sleutel(userId)) === 'ja';
  } catch {
    return true; // localStorage geblokkeerd — dan maar niet zeuren
  }
}

function markeerAlsGezien(userId) {
  try {
    localStorage.setItem(sleutel(userId), 'ja');
  } catch { /* niets aan te doen */ }
}

const STAPPEN = [
  {
    titel: 'Welkom bij Jump Masters',
    tekst: INTRO_KORT,
    voet: SURFR_VERMELDING,
    afbeelding: '/logo-full.png',
    beeldKlasse: 'h-32 object-contain',
  },
  {
    titel: 'Zo verdien je punten',
    tekst: 'Elke sessie levert punten op. Hoogte telt het zwaarst, daarna je vliegtijd, daarna de afstand. Je vijf beste sessies vormen samen je seizoensscore — mindere sessies tellen dus niet tegen je.',
    formule: true,
    afbeelding: null,
  },
  {
    titel: 'Deel je sessie in Surfr',
    tekst: 'Open je sessie in de Surfr app en tik onderaan op het deel-icoontje, naast het hartje. Kies daarna "Save Image" om de officiële samenvatting in je galerij te zetten.',
    afbeelding: '/stap2.PNG',
    beeldKlasse: 'h-52 object-contain rounded-xl border border-white/10',
  },
  {
    titel: 'Upload hem hier',
    tekst: 'Kies die foto op de uploadpagina. Wij lezen je hoogte, vliegtijd en afstand er automatisch uit — jij hoeft niets in te tikken. Let op: een screenshot van je hele telefoonscherm werkt niet, het moet de deel-afbeelding uit Surfr zijn.',
    afbeelding: '/stap4.PNG',
    beeldKlasse: 'h-52 object-contain rounded-xl border border-white/10',
  },
];

function Formule() {
  return (
    <div className="rounded-2xl p-4 border border-white/10 space-y-2"
         style={{ background: 'rgba(232,25,106,0.06)' }}>
      {[
        { label: 'Hoogte', factor: '2,5×', kleur: '#E8196A', balk: 'w-full' },
        { label: 'Vliegtijd', factor: '1,5×', kleur: '#0EA5E9', balk: 'w-3/5' },
        { label: 'Afstand', factor: '0,25×', kleur: '#8B5CF6', balk: 'w-1/4' },
      ].map(({ label, factor, kleur, balk }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-16 text-xs font-semibold text-white">{label}</div>
          <div className="flex-1 rounded-full h-1.5 bg-white/10">
            <div className={`${balk} h-1.5 rounded-full`} style={{ background: kleur }} />
          </div>
          <div className="w-10 text-right text-xs font-black" style={{ color: kleur }}>{factor}</div>
        </div>
      ))}
    </div>
  );
}

export default function Onboarding({ user, onKlaar }) {
  const [stap, setStap] = useState(0);
  const navigate = useNavigate();
  const huidige = STAPPEN[stap];
  const laatste = stap === STAPPEN.length - 1;

  function sluit(naarUploaden) {
    markeerAlsGezien(user.id);
    onKlaar();
    if (naarUploaden) navigate('/uploaden');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
         style={{ background: 'rgba(10,22,40,0.92)', backdropFilter: 'blur(6px)' }}
         role="dialog" aria-modal="true" aria-label="Uitleg Jump Masters">
      <div className="card w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STAPPEN.map((_, i) => (
              <span key={i} className="h-1 rounded-full transition-all"
                    style={{
                      width: i === stap ? 22 : 8,
                      background: i <= stap ? 'var(--jm-pink)' : 'rgba(255,255,255,0.18)',
                    }} />
            ))}
          </div>
          <button type="button" onClick={() => sluit(false)}
                  className="text-xs text-jm-muted hover:text-white transition-colors">
            Overslaan
          </button>
        </div>

        {huidige.afbeelding && (
          <img src={huidige.afbeelding} alt="" className={`mx-auto ${huidige.beeldKlasse}`}
               onError={(e) => { e.target.style.display = 'none'; }} />
        )}

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">{huidige.titel}</h2>
          <p className="text-sm text-jm-muted leading-relaxed">{huidige.tekst}</p>
        </div>

        {huidige.formule && <Formule />}

        {huidige.voet && (
          <p className="text-xs text-jm-pink/90 border-l-2 border-jm-pink/40 pl-3">
            {huidige.voet}
          </p>
        )}

        <div className="flex items-center gap-3 mt-auto">
          {stap > 0 && (
            <button type="button" onClick={() => setStap(s => s - 1)}
                    className="btn-secondary text-sm py-2.5 px-4">
              Terug
            </button>
          )}
          <button type="button"
                  onClick={() => (laatste ? sluit(true) : setStap(s => s + 1))}
                  className="btn-primary flex-1 justify-center text-sm py-2.5">
            {laatste ? 'Upload je eerste sessie' : 'Volgende'}
          </button>
        </div>
      </div>
    </div>
  );
}
