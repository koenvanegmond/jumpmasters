import { useEffect, useRef, useState } from 'react';

const BREEDTE = 1080;
const HOOGTE = 1350;

// Laadt een afbeelding zonder het doek te vervuilen. Zonder crossOrigin mag je
// een plaatje van een ander domein wel tonen maar niet uitlezen, en dan kun je
// er dus geen deelplaatje van maken.
function laadAfbeelding(src) {
  return new Promise((klaar) => {
    if (!src) return klaar(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => klaar(img);
    img.onerror = () => klaar(null);
    img.src = src;
  });
}

function tekenVullend(ctx, img, b, h) {
  const schaal = Math.max(b / img.width, h / img.height);
  const nb = img.width * schaal;
  const nh = img.height * schaal;
  ctx.drawImage(img, (b - nb) / 2, (h - nh) / 2, nb, nh);
}

function tekenRondeAfbeelding(ctx, img, x, y, maat) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + maat / 2, y + maat / 2, maat / 2, 0, Math.PI * 2);
  ctx.clip();
  const schaal = Math.max(maat / img.width, maat / img.height);
  const nb = img.width * schaal;
  const nh = img.height * schaal;
  ctx.drawImage(img, x + maat / 2 - nb / 2, y + maat / 2 - nh / 2, nb, nh);
  ctx.restore();
}

function afgerondeRechthoek(ctx, x, y, b, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + b, y, x + b, y + h, r);
  ctx.arcTo(x + b, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + b, y, r);
  ctx.closePath();
}

const VET = '900 %spx system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const NORMAAL = '600 %spx system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export default function DeelPlaatje({ sessie, gebruiker, record, positie }) {
  const doekRef = useRef(null);
  const [blob, setBlob] = useState(null);
  const [bezig, setBezig] = useState(true);
  const [gedeeld, setGedeeld] = useState('');

  useEffect(() => {
    let gestopt = false;

    (async () => {
      const [eigenFoto, standaardFoto, avatar, logo] = await Promise.all([
        sessie.media_type === 'photo' ? laadAfbeelding(sessie.media_url) : null,
        laadAfbeelding('/deel-achtergrond.jpg'),
        laadAfbeelding(gebruiker.avatar_url),
        laadAfbeelding('/logo-full.png'),
      ]);
      if (gestopt) return;

      // Eigen sessiefoto gaat voor. Anders de clubfoto van Skuytevaert, en
      // pas als die ontbreekt een verloop.
      const foto = eigenFoto || standaardFoto;

      const doek = doekRef.current;
      doek.width = BREEDTE;
      doek.height = HOOGTE;
      const ctx = doek.getContext('2d');

      // Achtergrond: je eigen sessiefoto als je er een hebt, anders het merk.
      if (foto) {
        tekenVullend(ctx, foto, BREEDTE, HOOGTE);
      } else {
        const v = ctx.createLinearGradient(0, 0, BREEDTE, HOOGTE);
        v.addColorStop(0, '#0A1628');
        v.addColorStop(0.55, '#12325C');
        v.addColorStop(1, '#7A0E3A');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, BREEDTE, HOOGTE);
      }

      // Donkere sluier zodat de tekst leesbaar blijft op elke foto.
      const sluier = ctx.createLinearGradient(0, 0, 0, HOOGTE);
      sluier.addColorStop(0, 'rgba(10,22,40,0.55)');
      sluier.addColorStop(0.42, 'rgba(10,22,40,0.25)');
      sluier.addColorStop(0.72, 'rgba(10,22,40,0.85)');
      sluier.addColorStop(1, 'rgba(10,22,40,0.96)');
      ctx.fillStyle = sluier;
      ctx.fillRect(0, 0, BREEDTE, HOOGTE);

      if (logo) {
        const h = 110;
        ctx.drawImage(logo, 60, 55, logo.width * (h / logo.height), h);
      }

      // Lintje bij een persoonlijk record.
      if (record?.hoogte || record?.punten) {
        const tekst = record.hoogte ? 'HOOGSTE SPRONG OOIT' : 'BESTE SCORE OOIT';
        ctx.font = VET.replace('%s', 30);
        const b = ctx.measureText(tekst).width + 56;
        ctx.fillStyle = '#E8196A';
        afgerondeRechthoek(ctx, BREEDTE - 60 - b, 78, b, 66, 33);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(tekst, BREEDTE - 60 - b / 2, 122);
        ctx.textAlign = 'left';
      }

      // Rijder
      const avatarY = 792;
      if (avatar) {
        tekenRondeAfbeelding(ctx, avatar, 60, avatarY, 120);
      } else {
        ctx.beginPath();
        ctx.arc(120, avatarY + 60, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#E8196A';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = VET.replace('%s', 56);
        ctx.textAlign = 'center';
        ctx.fillText((gebruiker.name || '?').charAt(0).toUpperCase(), 120, avatarY + 80);
        ctx.textAlign = 'left';
      }

      ctx.fillStyle = '#fff';
      ctx.font = VET.replace('%s', 54);
      ctx.fillText(gebruiker.name, 210, avatarY + 52);

      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = NORMAAL.replace('%s', 34);
      const datum = new Date(sessie.date).toLocaleDateString('nl-NL', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      ctx.fillText(positie ? `${datum}  ·  #${positie} van de club` : datum, 210, avatarY + 102);

      // Score
      const punten = parseFloat(sessie.points).toFixed(2);
      ctx.fillStyle = '#FF4D8D';
      ctx.font = VET.replace('%s', 168);
      ctx.fillText(punten, 60, 1075);
      const breedtePunten = ctx.measureText(punten).width;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = VET.replace('%s', 44);
      ctx.fillText('punten', 60 + breedtePunten + 24, 1075);

      // Drie waarden onderaan
      const waarden = [
        ['HOOGTE', `${parseFloat(sessie.height_m).toFixed(1)} m`],
        ['VLIEGTIJD', `${parseFloat(sessie.airtime_s).toFixed(1)} s`],
        ['AFSTAND', `${parseFloat(sessie.distance_m).toFixed(0)} m`],
      ];
      const vakBreedte = (BREEDTE - 120 - 40) / 3;
      waarden.forEach(([label, waarde], i) => {
        const x = 60 + i * (vakBreedte + 20);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        afgerondeRechthoek(ctx, x, 1130, vakBreedte, 130, 24);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = VET.replace('%s', 24);
        ctx.fillText(label, x + vakBreedte / 2, 1176);
        ctx.fillStyle = '#fff';
        ctx.font = VET.replace('%s', 52);
        ctx.fillText(waarde, x + vakBreedte / 2, 1234);
        ctx.textAlign = 'left';
      });

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = VET.replace('%s', 28);
      ctx.textAlign = 'center';
      ctx.fillText('jump-masters.nl', BREEDTE / 2, 1315);
      ctx.textAlign = 'left';

      doek.toBlob((b) => {
        if (!gestopt) { setBlob(b); setBezig(false); }
      }, 'image/jpeg', 0.92);
    })();

    return () => { gestopt = true; };
  }, [sessie, gebruiker, record, positie]);

  async function deel() {
    if (!blob) return;
    const bestand = new File([blob], 'jumpmasters.jpg', { type: 'image/jpeg' });

    if (navigator.canShare?.({ files: [bestand] })) {
      try {
        await navigator.share({ files: [bestand] });
        return;
      } catch {
        return; // gebruiker heeft geannuleerd
      }
    }
    // Geen deelvenster beschikbaar, dan maar downloaden.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jumpmasters.jpg';
    a.click();
    URL.revokeObjectURL(url);
    setGedeeld('Plaatje opgeslagen bij je downloads.');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-jm-base">
        <canvas ref={doekRef} className="w-full h-auto block"
                style={{ opacity: bezig ? 0.4 : 1, transition: 'opacity .2s' }} />
      </div>
      <button type="button" onClick={deel} disabled={bezig}
              className="btn-primary w-full justify-center text-base py-3 disabled:opacity-60">
        {bezig ? 'Plaatje maken...' : 'Deel je score'}
      </button>
      {gedeeld && <p className="text-sm text-jm-muted text-center">{gedeeld}</p>}
    </div>
  );
}
