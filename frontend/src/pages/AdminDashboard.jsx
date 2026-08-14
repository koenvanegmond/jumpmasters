import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

// Postgres geeft een DATE terug als middernacht in de lokale tijdzone. Via
// toISOString() zou dat in Nederland een dag terugvallen, dus we plakken de
// datum uit de lokale onderdelen aan elkaar.
function datumVoorInvoer(waarde) {
  const d = new Date(waarde);
  const maand = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${maand}-${dag}`;
}

function SessionRow({ session, onVerify, onReject, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    height: session.height_m,
    airtime: session.airtime_s,
    distance: session.distance_m,
    date: datumVoorInvoer(session.date),
  });
  const [imgOpen, setImgOpen] = useState(false);
  const [bezig, setBezig] = useState(false);

  async function saveEdit() {
    setBezig(true);
    try {
      await onEdit(session.id, form);
      setEditing(false);
    } finally {
      setBezig(false);
    }
  }

  async function verwijder() {
    const wanneer = new Date(session.date).toLocaleDateString('nl-NL');
    if (!window.confirm(
      `Sessie van ${session.user_name} op ${wanneer} definitief verwijderen?\n\n` +
      'Likes en reacties op deze sessie gaan mee. Dit kan niet ongedaan gemaakt worden.'
    )) return;
    setBezig(true);
    try {
      await onDelete(session.id);
    } finally {
      setBezig(false);
    }
  }

  const inputCls = 'w-16 bg-jm-base border border-white/10 rounded-lg px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-jm-pink/50';
  const knop = 'text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50';

  return (
    <>
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
        <td className="py-3 px-4 text-sm font-semibold text-white">{session.user_name}</td>
        <td className="py-3 px-4 text-sm text-jm-muted">
          {editing ? (
            <input type="date" value={form.date}
              onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
              className={`${inputCls} w-32`} />
          ) : (
            new Date(session.date).toLocaleDateString('nl-NL')
          )}
        </td>
        <td className="py-3 px-4 text-sm text-jm-muted">
          {editing ? (
            <div className="flex gap-1">
              <input type="number" step="0.1" value={form.height} onChange={(e) => setForm(p => ({ ...p, height: e.target.value }))} className={inputCls} />
              <input type="number" step="0.1" value={form.airtime} onChange={(e) => setForm(p => ({ ...p, airtime: e.target.value }))} className={inputCls} />
              <input type="number" step="0.1" value={form.distance} onChange={(e) => setForm(p => ({ ...p, distance: e.target.value }))} className={inputCls} />
            </div>
          ) : (
            <span>{parseFloat(session.height_m).toFixed(1)}m / {parseFloat(session.airtime_s).toFixed(1)}s / {parseFloat(session.distance_m).toFixed(0)}m</span>
          )}
        </td>
        <td className="py-3 px-4 text-sm font-black text-jm-pinkText">{parseFloat(session.points).toFixed(2)}</td>
        <td className="py-3 px-4">
          {session.verified
            ? <span className="text-xs text-emerald-400">Goedgekeurd</span>
            : <span className="text-xs text-yellow-400">In behandeling</span>}
        </td>
        <td className="py-3 px-4">
          {(session.screenshot_url || session.has_screenshot) && (
            session.screenshot_url
              ? <button onClick={() => setImgOpen(true)} className="text-xs text-jm-pinkText hover:underline">Bekijken</button>
              : <span className="text-xs text-jm-muted">Ja</span>
          )}
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1.5 flex-wrap">
            {editing ? (
              <>
                <button onClick={saveEdit} disabled={bezig} className={`${knop} bg-jm-pink hover:bg-jm-pinkLight text-white`}>Opslaan</button>
                <button onClick={() => setEditing(false)} disabled={bezig} className={`${knop} bg-white/5 hover:bg-white/10 text-jm-muted border border-white/10`}>Annuleren</button>
              </>
            ) : (
              <>
                {session.verified ? (
                  <button onClick={() => onReject(session.id)} disabled={bezig} className={`${knop} bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20`}>Intrekken</button>
                ) : (
                  <button onClick={() => onVerify(session.id)} disabled={bezig} className={`${knop} bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20`}>Goedkeuren</button>
                )}
                <button onClick={() => setEditing(true)} disabled={bezig} className={`${knop} bg-white/5 hover:bg-white/10 text-jm-muted border border-white/10`}>Bewerken</button>
                <button onClick={verwijder} disabled={bezig} className={`${knop} bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20`}>Verwijderen</button>
              </>
            )}
          </div>
        </td>
      </tr>
      {imgOpen && session.screenshot_url && (
        <tr>
          <td colSpan={7} className="p-4">
            <div className="relative inline-block">
              <button onClick={() => setImgOpen(false)} className="absolute top-2 right-2 text-white bg-black/70 rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/90 transition-colors">✕</button>
              <img src={session.screenshot_url} alt="Screenshot" className="max-w-xs rounded-xl border border-white/10 shadow-xl" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SessieTabel({ sessies, ...acties }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.07]">
            {['Rijder', 'Datum', 'H / V / A', 'Pts', 'Status', 'Screenshot', 'Acties'].map(k => (
              <th key={k} className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessies.map(s => <SessionRow key={s.id} session={s} {...acties} />)}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const [pending, setPending] = useState([]);
  const [alle, setAlle] = useState([]);
  const [stats, setStats] = useState(null);
  const [zoek, setZoek] = useState('');
  const [error, setError] = useState('');

  async function laad() {
    const [p, a, s] = await Promise.all([api.adminPending(), api.adminAllSessions(), api.adminStats()]);
    setPending(p);
    setAlle(a);
    setStats(s);
  }

  useEffect(() => {
    if (!user?.is_admin) return;
    laad().catch((err) => setError(err.message));
  }, [user]);

  // Na elke wijziging alles opnieuw ophalen: een sessie kan van "in
  // behandeling" naar "goedgekeurd" springen en de statistieken schuiven mee.
  async function metVerversen(actie) {
    try {
      await actie();
      await laad();
    } catch (err) {
      alert(err.message);
    }
  }

  const handleVerify = (id) => metVerversen(() => api.adminVerify(id, true));
  const handleReject = (id) => metVerversen(() => api.adminVerify(id, false));
  const handleDelete = (id) => metVerversen(() => api.adminDeleteSession(id));
  const handleEdit = (id, form) => metVerversen(() => api.adminEditSession(id, {
    height: parseFloat(form.height),
    airtime: parseFloat(form.airtime),
    distance: parseFloat(form.distance),
    date: form.date,
  }));

  const acties = { onVerify: handleVerify, onReject: handleReject, onEdit: handleEdit, onDelete: handleDelete };

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return alle;
    return alle.filter(s => s.user_name.toLowerCase().includes(q) || (s.user_email || '').toLowerCase().includes(q));
  }, [alle, zoek]);

  if (!user?.is_admin) return <div className="text-center py-16 text-red-400">Beheerderstoegang vereist.</div>;
  if (error) return <div className="text-center py-16 text-red-400">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">Beheerpaneel</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Rijders', value: stats.total_riders },
            { label: 'Geverifieerde sessies', value: stats.total_sessions },
            { label: 'In behandeling', value: stats.pending_sessions },
            { label: 'Beste sprong vandaag', value: stats.today_best ? `${parseFloat(stats.today_best.max_height).toFixed(1)} m` : '—' }
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-sm text-jm-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 md:p-6">
        <h2 className="text-lg font-black text-white mb-5">
          Sessies in behandeling
          <span className="ml-2 text-sm font-semibold text-jm-muted bg-white/5 px-2 py-0.5 rounded-full">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-center py-10 text-jm-muted">Alles bijgewerkt! Geen sessies meer in behandeling.</p>
        ) : (
          <SessieTabel sessies={pending} {...acties} />
        )}
      </div>

      <div className="card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-black text-white">
            Alle sessies
            <span className="ml-2 text-sm font-semibold text-jm-muted bg-white/5 px-2 py-0.5 rounded-full">{alle.length}</span>
          </h2>
          <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op naam of e-mail..."
            className="input text-sm py-2 w-full sm:w-64" />
        </div>
        {gefilterd.length === 0 ? (
          <p className="text-center py-10 text-jm-muted">
            {alle.length === 0 ? 'Nog geen sessies.' : 'Geen sessies gevonden.'}
          </p>
        ) : (
          <SessieTabel sessies={gefilterd} {...acties} />
        )}
      </div>
    </div>
  );
}
