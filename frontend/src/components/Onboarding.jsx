import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

// Korte regels in plaats van lopende tekst: dit is een introscherm dat je in
// tien seconden op het strand leest, niet een pagina om te bestuderen.
const STAPPEN = [
  {
    titel: 'Welkom bij Jump Masters',
    punten: [
      'De kitesurfcompetitie van Skuytevaert',
      'Je springt wanneer jij wilt',
      'Iedereen uploadt zijn eigen sessies',
    ],
    voet: 'Je scores komen uit de Surfr app.',
    afbeelding: '/logo-full.png',
    beeldKlasse: 'h-28 object-contain',
  },
  {
    titel: 'Zo verdien je punten',
    punten: [
      'Hoogte telt het zwaarst',
      'Daarna vliegtijd, daarna afstand',
      'Je 5 beste sessies vormen je seizoensscore',
      'Mindere sessies tellen dus niet tegen je',
    ],
    formule: true,
  },
  {
    titel: 'Deel je sessie in Surfr',
    punten: [
      'Open je sessie in de Surfr app',
      'Tik onderaan op het deel-icoontje, naast het hartje',
      'Kies Save Image',
    ],
    afbeelding: '/stap2.PNG',
    beeldKlasse: 'h-44 object-contain rounded-xl border border-white/10',
  },
  {
    titel: 'Upload hem hier',
    punten: [
      'Kies die foto bij Uploaden',
      'Wij lezen hoogte, vliegtijd en afstand uit de foto',
      'Je hoeft niets in te tikken',
    ],
    waarschuwing: 'Geen screenshot van je hele telefoonscherm. Het moet de deel-afbeelding uit Surfr zijn.',
    afbeelding: '/stap4.PNG',
    beeldKlasse: 'h-44 object-contain rounded-xl border border-white/10',
  },
];

function Formule() {
  return (
    <div className="rounded-2xl p-4 border border-white/10 space-y-2.5"
         style={{ background: 'rgba(232,25,106,0.06)' }}>
      {[
        { label: 'Hoogte', factor: '2,5×', kleur: '#FF4D8D', balk: 'w-full' },
        { label: 'Vliegtijd', factor: '1,5×', kleur: '#38BDF8', balk: 'w-3/5' },
        { label: 'Afstand', factor: '0,25×', kleur: '#A78BFA', balk: 'w-1/4' },
      ].map(({ label, factor, kleur, balk }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-20 text-sm font-semibold text-white">{label}</div>
          <div className="flex-1 rounded-full h-2 bg-white/10">
            <div className={`${balk} h-2 rounded-full`} style={{ background: kleur }} />
          </div>
          <div className="w-12 text-right text-sm font-black" style={{ color: kleur }}>{factor}</div>
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

  function sluit(naarUitleg) {
    markeerAlsGezien(user.id);
    onKlaar();
    navigate(naarUitleg ? '/hoe-het-werkt' : '/');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
         style={{ background: 'rgba(10,22,40,0.94)', backdropFilter: 'blur(6px)' }}
         role="dialog" aria-modal="true" aria-label="Uitleg Jump Masters">
      <div className="card w-full max-w-md p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STAPPEN.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === stap ? 24 : 9,
                      background: i <= stap ? 'var(--jm-pink-text)' : 'rgba(255,255,255,0.22)',
                    }} />
            ))}
          </div>
          <button type="button" onClick={() => sluit(false)}
                  className="text-sm font-medium text-jm-muted hover:text-white transition-colors">
            Overslaan
          </button>
        </div>

        {huidige.afbeelding && (
          <img src={huidige.afbeelding} alt="" className={`mx-auto ${huidige.beeldKlasse}`}
               onError={(e) => { e.target.style.display = 'none'; }} />
        )}

        <h2 className="text-2xl font-black text-white leading-tight">{huidige.titel}</h2>

        <ul className="space-y-2.5">
          {huidige.punten.map((punt) => (
            <li key={punt} className="flex gap-3 text-base text-white/90 leading-snug">
              <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--jm-pink-text)' }} />
              {punt}
            </li>
          ))}
        </ul>

        {huidige.formule && <Formule />}

        {huidige.voet && (
          <p className="text-sm text-jm-pinkText border-l-2 border-jm-pinkText/40 pl-3 leading-snug">
            {huidige.voet}
          </p>
        )}

        {huidige.waarschuwing && (
          <p className="text-sm text-yellow-200 leading-snug rounded-xl p-3 border"
             style={{ background: 'rgba(251,191,36,0.09)', borderColor: 'rgba(251,191,36,0.3)' }}>
            {huidige.waarschuwing}
          </p>
        )}

        {laatste && (
          <button type="button" onClick={() => sluit(true)}
                  className="text-sm font-semibold text-jm-pinkText text-left hover:underline">
            Meer weten? Kijk bij Hoe het werkt →
          </button>
        )}

        <div className="flex items-center gap-3 mt-auto pt-1">
          {stap > 0 && (
            <button type="button" onClick={() => setStap(s => s - 1)}
                    className="btn-secondary text-base py-3 px-5">
              Terug
            </button>
          )}
          <button type="button"
                  onClick={() => (laatste ? sluit(false) : setStap(s => s + 1))}
                  className="btn-primary flex-1 justify-center text-base py-3">
            {laatste ? 'Aan de slag' : 'Volgende'}
          </button>
        </div>
      </div>
    </div>
  );
}
