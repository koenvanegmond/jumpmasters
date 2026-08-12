import { useEffect, useState } from 'react';
import { huidigAbonnement, waaromNiet, wordtOndersteund, zetAan, zetUit } from '../services/meldingen';

export default function MeldingenKnop() {
  const [aan, setAan] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const blokkade = waaromNiet();

  useEffect(() => {
    if (!wordtOndersteund()) return;
    huidigAbonnement().then((a) => setAan(Boolean(a))).catch(() => {});
  }, []);

  async function schakel() {
    setFout('');
    setBezig(true);
    try {
      if (aan) {
        await zetUit();
        setAan(false);
      } else {
        await zetAan();
        setAan(true);
      }
    } catch (err) {
      setFout(err.message);
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="card p-5 md:p-6">
      <h2 className="text-lg font-black text-white mb-1">Meldingen</h2>
      <p className="text-sm text-jm-muted mb-4">
        Krijg bericht als iemand je tagt, een sessie plaatst of je inhaalt.
      </p>

      {blokkade ? (
        <div className="rounded-xl p-4 border text-sm leading-relaxed"
             style={{ background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.25)', color: '#FDE68A' }}>
          {blokkade}
        </div>
      ) : (
        <>
          <button type="button" onClick={schakel} disabled={bezig}
                  className={`${aan ? 'btn-secondary' : 'btn-primary'} text-sm py-2.5 px-5 disabled:opacity-60`}>
            {bezig ? 'Bezig...' : aan ? 'Meldingen uitzetten' : 'Meldingen aanzetten'}
          </button>
          {aan && (
            <p className="text-sm text-emerald-400 mt-3">
              Staan aan op dit toestel.
            </p>
          )}
          {fout && <p className="text-sm text-red-400 mt-3">{fout}</p>}
        </>
      )}
    </div>
  );
}
