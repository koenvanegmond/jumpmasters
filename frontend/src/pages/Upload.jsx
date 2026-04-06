import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import UploadZone from '../components/UploadZone';
import { calculateSessionPoints } from '../utils/scoring';

function Field({ label, value, onChange, unit }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" step="0.1" min="0" required value={value} onChange={(e) => onChange(e.target.value)}
          className="input flex-1" />
        <span className="text-sm text-jm-muted w-6">{unit}</span>
      </div>
    </div>
  );
}

function TagInput({ tagged, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  async function handleSearch(val) {
    setQuery(val);
    if (val.length < 2) { setResults([]); return; }
    try {
      const users = await api.searchUsers(val);
      setResults(users.filter(u => !tagged.find(t => t.id === u.id)));
    } catch { setResults([]); }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-1.5">Tag rijders (uitdaging)</label>
      {tagged.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tagged.map(u => (
            <span key={u.id} className="flex items-center gap-1 bg-jm-pink/10 text-jm-pink text-xs px-2.5 py-1 rounded-full border border-jm-pink/30">
              {u.name}
              <button type="button" onClick={() => onRemove(u.id)} className="hover:text-red-400 transition-colors ml-0.5">✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Zoek rijder om te taggen..."
          className="input" />
        {results.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-jm-card border border-white/[0.07] rounded-xl shadow-2xl z-10 overflow-hidden">
            {results.map(u => (
              <button key={u.id} type="button" onClick={() => { onAdd(u); setQuery(''); setResults([]); }}
                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0">
                {u.name} <span className="text-jm-muted">· {u.fleet}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const [step, setStep] = useState('idle');
  const [preview, setPreview] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [form, setForm] = useState({ date: '', height: '', airtime: '', distance: '' });
  const [caption, setCaption] = useState('');
  const [tagged, setTagged] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [error, setError] = useState('');
  const mediaRef = useRef();

  function setField(key) { return (val) => setForm(p => ({ ...p, [key]: val })); }

  async function handleScreenshot(file) {
    setError('');
    setPreview(URL.createObjectURL(file));
    setStep('processing');
    const fd = new FormData();
    fd.append('screenshot', file);
    try {
      const { extracted, screenshot_url } = await api.uploadScreenshot(fd);
      setScreenshotUrl(screenshot_url);
      setForm({
        date: extracted.date ? new Date(extracted.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        height: String(extracted.height), airtime: String(extracted.airtime), distance: String(extracted.distance)
      });
      setStep('confirm');
    } catch (err) {
      // OCR failed — silently fall back to manual entry
      setError('Automatisch uitlezen is niet gelukt. Vul de gegevens hieronder zelf in.');
      setForm({ date: new Date().toISOString().split('T')[0], height: '', airtime: '', distance: '' });
      setStep('manual');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStep('submitting');
    const fd = new FormData();
    if (screenshotUrl) fd.append('screenshot_url', screenshotUrl);
    fd.append('height', form.height);
    fd.append('airtime', form.airtime);
    fd.append('distance', form.distance);
    fd.append('date', form.date);
    if (caption) fd.append('caption', caption);
    fd.append('tagged_user_ids', JSON.stringify(tagged.map(u => u.id)));
    if (mediaFile) fd.append('media', mediaFile);
    try {
      const endpoint = screenshotUrl ? api.confirmSession : api.manualSession;
      await endpoint(fd);
      navigate('/profiel');
    } catch (err) {
      setError(err.message);
      setStep(screenshotUrl ? 'confirm' : 'manual');
    }
  }

  const points = form.height && form.airtime && form.distance
    ? calculateSessionPoints(parseFloat(form.height), parseFloat(form.airtime), parseFloat(form.distance))
    : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-1">Sessie uploaden</h1>
      <p className="text-jm-muted text-sm mb-6">Upload je Surfr-screenshot — we extraheren de gegevens automatisch.</p>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

      {step === 'idle' && (
        <>
          <UploadZone onFile={handleScreenshot} />
          <div className="text-center mt-4">
            <button onClick={() => { setStep('manual'); setForm({ date: new Date().toISOString().split('T')[0], height: '', airtime: '', distance: '' }); }}
              className="text-sm text-jm-pink hover:underline">
              Gegevens handmatig invoeren
            </button>
          </div>
        </>
      )}

      {step === 'processing' && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full border-2 border-jm-pink border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-semibold text-white">Gegevens extraheren uit screenshot...</p>
          <p className="text-jm-muted text-sm mt-1">Even geduld</p>
        </div>
      )}

      {(step === 'confirm' || step === 'manual' || step === 'submitting') && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {preview && step === 'confirm' && (
            <img src={preview} alt="Screenshot" className="w-full rounded-xl max-h-40 object-contain border border-white/[0.07]" />
          )}
          {step === 'confirm' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl">
              Gegevens succesvol geextraheerd — controleer en bevestig
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Datum</label>
            <input type="date" required value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
              className="input" />
          </div>
          <Field label="Hoogste sprong" value={form.height} onChange={setField('height')} unit="m" />
          <Field label="Max airtime" value={form.airtime} onChange={setField('airtime')} unit="s" />
          <Field label="Max afstand" value={form.distance} onChange={setField('distance')} unit="m" />

          {points !== null && (
            <div className="bg-jm-pink/5 border border-jm-pink/20 rounded-xl p-5 text-center">
              <div className="text-3xl font-black text-jm-pink">{points.toFixed(2)}</div>
              <div className="text-sm text-jm-muted mt-1">Punten voor deze sessie</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Bijschrift (optioneel)</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2}
              placeholder="Vertel iets over je sessie..."
              className="input resize-none" />
          </div>

          <TagInput tagged={tagged} onAdd={(u) => setTagged(p => [...p, u])} onRemove={(id) => setTagged(p => p.filter(u => u.id !== id))} />

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Foto of video (optioneel)</label>
            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/[0.07]">
                {mediaFile?.type.startsWith('video')
                  ? <video src={mediaPreview} className="w-full max-h-48 object-cover" controls />
                  : <img src={mediaPreview} alt="Media" className="w-full max-h-48 object-cover" />}
                <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/90 transition-colors">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => mediaRef.current.click()}
                className="w-full border-2 border-dashed border-white/10 hover:border-jm-pink/40 rounded-xl py-6 text-center text-jm-muted hover:text-jm-pink transition-colors text-sm">
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                Foto of video toevoegen
              </button>
            )}
            <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden"
              onChange={(e) => { if (e.target.files[0]) { setMediaFile(e.target.files[0]); setMediaPreview(URL.createObjectURL(e.target.files[0])); } }} />
          </div>

          <button type="submit" disabled={step === 'submitting'} className="btn-primary w-full justify-center disabled:opacity-60">
            {step === 'submitting' ? 'Opslaan...' : 'Sessie opslaan'}
          </button>
          <button type="button" onClick={() => { setStep('idle'); setScreenshotUrl(''); setPreview(null); }}
            className="w-full text-sm text-jm-muted hover:text-white transition-colors text-center">
            Opnieuw beginnen
          </button>
        </form>
      )}
    </div>
  );
}
