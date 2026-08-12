import { useEffect, useRef, useState } from 'react';

const KADER = 260;   // zichtbaar rond kader in het venster
const UITVOER = 400; // wat we uiteindelijk wegschrijven, vierkant

/**
 * Kies een uitsnede voor je profielfoto. Je sleept de foto en zoomt met de
 * schuifknop; wat binnen de cirkel valt wordt bewaard. De uitsnede gaat als
 * 400x400 JPEG naar de server, dus geen foto's van drie ton meer.
 */
export default function FotoBijsnijden({ bestand, onKlaar, onAnnuleer }) {
  const [afbeelding, setAfbeelding] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [positie, setPositie] = useState({ x: 0, y: 0 });
  const [bezig, setBezig] = useState(false);
  const sleep = useRef(null);
  const doekRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(bestand);
    const img = new Image();
    img.onload = () => setAfbeelding(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [bestand]);

  // Schaal waarbij de foto het kader precies vult. Alles daaronder zou witte
  // randen geven, dus dat is meteen de ondergrens van de zoom.
  const basisSchaal = afbeelding
    ? Math.max(KADER / afbeelding.width, KADER / afbeelding.height)
    : 1;

  function begrens(pos, schaal) {
    if (!afbeelding) return pos;
    const breedte = afbeelding.width * schaal;
    const hoogte = afbeelding.height * schaal;
    const maxX = Math.max(0, (breedte - KADER) / 2);
    const maxY = Math.max(0, (hoogte - KADER) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, pos.x)),
      y: Math.min(maxY, Math.max(-maxY, pos.y)),
    };
  }

  function startSleep(e) {
    const punt = e.touches ? e.touches[0] : e;
    sleep.current = { x: punt.clientX - positie.x, y: punt.clientY - positie.y };
  }

  function beweeg(e) {
    if (!sleep.current) return;
    const punt = e.touches ? e.touches[0] : e;
    setPositie(begrens(
      { x: punt.clientX - sleep.current.x, y: punt.clientY - sleep.current.y },
      basisSchaal * zoom
    ));
  }

  function stopSleep() { sleep.current = null; }

  function pasZoomAan(nieuw) {
    setZoom(nieuw);
    setPositie((p) => begrens(p, basisSchaal * nieuw));
  }

  async function bewaar() {
    if (!afbeelding) return;
    setBezig(true);
    const doek = doekRef.current;
    doek.width = doek.height = UITVOER;
    const ctx = doek.getContext('2d');

    // Alles omrekenen van kadermaat naar uitvoermaat.
    const factor = UITVOER / KADER;
    const schaal = basisSchaal * zoom * factor;
    const breedte = afbeelding.width * schaal;
    const hoogte = afbeelding.height * schaal;

    ctx.fillStyle = '#0F1E35';
    ctx.fillRect(0, 0, UITVOER, UITVOER);
    ctx.drawImage(
      afbeelding,
      UITVOER / 2 - breedte / 2 + positie.x * factor,
      UITVOER / 2 - hoogte / 2 + positie.y * factor,
      breedte,
      hoogte
    );

    doek.toBlob((blob) => {
      setBezig(false);
      onKlaar(new File([blob], 'profielfoto.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  }

  const schaal = basisSchaal * zoom;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
         style={{ background: 'rgba(10,22,40,0.94)' }}
         role="dialog" aria-modal="true" aria-label="Profielfoto bijsnijden">
      <div className="card w-full max-w-sm p-5 flex flex-col gap-4">
        <h2 className="text-lg font-black text-white">Kies je uitsnede</h2>

        <div className="relative mx-auto rounded-full overflow-hidden cursor-move touch-none select-none"
             style={{ width: KADER, height: KADER, background: 'var(--jm-base)' }}
             onMouseDown={startSleep} onMouseMove={beweeg}
             onMouseUp={stopSleep} onMouseLeave={stopSleep}
             onTouchStart={startSleep} onTouchMove={beweeg} onTouchEnd={stopSleep}>
          {afbeelding && (
            <img src={afbeelding.src} alt="" draggable={false}
                 style={{
                   position: 'absolute',
                   width: afbeelding.width * schaal,
                   height: afbeelding.height * schaal,
                   left: KADER / 2 - (afbeelding.width * schaal) / 2 + positie.x,
                   top: KADER / 2 - (afbeelding.height * schaal) / 2 + positie.y,
                   maxWidth: 'none',
                 }} />
          )}
          <div className="absolute inset-0 rounded-full pointer-events-none"
               style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5)' }} />
        </div>

        <p className="text-sm text-jm-muted text-center">Sleep de foto op zijn plek.</p>

        <div className="flex items-center gap-3">
          <span className="text-sm text-jm-muted">Zoom</span>
          <input type="range" min="1" max="3" step="0.02" value={zoom}
                 onChange={(e) => pasZoomAan(parseFloat(e.target.value))}
                 className="flex-1 accent-jm-pink" aria-label="Zoom" />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onAnnuleer} className="btn-secondary text-sm py-2.5 px-4">
            Annuleren
          </button>
          <button type="button" onClick={bewaar} disabled={!afbeelding || bezig}
                  className="btn-primary flex-1 justify-center text-sm py-2.5 disabled:opacity-60">
            {bezig ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>

        <canvas ref={doekRef} className="hidden" />
      </div>
    </div>
  );
}
