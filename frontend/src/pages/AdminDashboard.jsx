import { useEffect, useState } from 'react';
import { api } from '../services/api';

function SessionRow({ session, onVerify, onReject, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ height: session.height_m, airtime: session.airtime_s, distance: session.distance_m });
  const [imgOpen, setImgOpen] = useState(false);
  const date = new Date(session.date).toLocaleDateString('nl-NL');

  async function saveEdit() { await onEdit(session.id, form); setEditing(false); }

  const inputCls = 'w-16 bg-jm-base border border-white/10 rounded-lg px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-jm-pink/50';

  return (
    <>
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
        <td className="py-3 px-4 text-sm font-semibold text-white">{session.user_name}</td>
        <td className="py-3 px-4 text-sm text-jm-muted">{date}</td>
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
          {session.screenshot_url && (
            <button onClick={() => setImgOpen(true)} className="text-xs text-jm-pinkText hover:underline">Bekijken</button>
          )}
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1.5 flex-wrap">
            {editing ? (
              <>
                <button onClick={saveEdit} className="text-xs bg-jm-pink hover:bg-jm-pinkLight text-white px-2.5 py-1 rounded-lg transition-colors">Opslaan</button>
                <button onClick={() => setEditing(false)} className="text-xs bg-white/5 hover:bg-white/10 text-jm-muted px-2.5 py-1 rounded-lg border border-white/10 transition-colors">Annuleren</button>
              </>
            ) : (
              <>
                <button onClick={() => onVerify(session.id)} className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors">Goedkeuren</button>
                <button onClick={() => onReject(session.id)} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg transition-colors">Afwijzen</button>
                <button onClick={() => setEditing(true)} className="text-xs bg-white/5 hover:bg-white/10 text-jm-muted border border-white/10 px-2.5 py-1 rounded-lg transition-colors">Bewerken</button>
              </>
            )}
          </div>
        </td>
      </tr>
      {imgOpen && session.screenshot_url && (
        <tr>
          <td colSpan={6} className="p-4">
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

export default function AdminDashboard({ user }) {
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.is_admin) return;
    Promise.all([api.adminPending(), api.adminStats()])
      .then(([p, s]) => { setPending(p); setStats(s); })
      .catch((err) => setError(err.message));
  }, [user]);

  async function handleVerify(id) {
    try {
      await api.adminVerify(id, true);
      setPending(p => p.filter(s => s.id !== id));
    } catch (err) { alert(err.message); }
  }
  async function handleReject(id) {
    try {
      await api.adminVerify(id, false);
      setPending(p => p.filter(s => s.id !== id));
    } catch (err) { alert(err.message); }
  }
  async function handleEdit(id, form) {
    try {
      const { session } = await api.adminEditSession(id, { height: parseFloat(form.height), airtime: parseFloat(form.airtime), distance: parseFloat(form.distance) });
      setPending(p => p.map(s => s.id === id ? { ...s, ...session } : s));
    } catch (err) { alert(err.message); }
  }

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Rijder</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Datum</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">H / V / A</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Pts</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Screenshot</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-jm-muted uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(s => <SessionRow key={s.id} session={s} onVerify={handleVerify} onReject={handleReject} onEdit={handleEdit} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
