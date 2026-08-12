import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import FleetBadge from '../components/FleetBadge';

const LAT = 52.2373;
const LON = 4.4342;

const STATUS_OPTIONS = [
  { key: 'going',     label: 'Ik ga!',       emoji: '🏄',  color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)' },
  { key: 'maybe',     label: 'Twijfel',      emoji: '🤔',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  { key: 'not_going', label: 'Niet vandaag', emoji: '😴',  color: '#8BA3C7', bg: 'rgba(139,163,199,0.08)', border: 'rgba(139,163,199,0.25)' },
];

function WindForecast() {
  const wfUrl = 'https://www.windfinder.com/widget/forecast/noordwijk';
  const windyUrl = `https://embed.windy.com/embed2.html?lat=${LAT}&lon=${LON}&zoom=11&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=true&metricWind=kt&metricTemp=%C2%B0C`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-jm-muted mb-1.5">Windfinder · Superforecast</p>
        <iframe src={wfUrl} title="Windfinder" width="100%" height="360"
          frameBorder="0" style={{ display: 'block', borderRadius: '10px', background: '#0F1E35' }} />
      </div>
      <div>
        <p className="text-xs text-jm-muted mb-1.5">Windy · ECMWF model</p>
        <iframe src={windyUrl} title="Windy" width="100%" height="360"
          frameBorder="0" style={{ display: 'block', borderRadius: '10px' }} />
      </div>
    </div>
  );
}

export default function Wind({ user }) {
  const [going, setGoing] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.goingToday().then(rows => {
      setGoing(rows);
      if (user) {
        const mine = rows.find(r => r.user_id === user.id);
        setMyStatus(mine ? mine.status : null);
      }
    }).catch(() => {});
  }, [user]);

  async function handleStatus(status) {
    if (!user || saving) return;
    setSaving(true);
    try {
      if (myStatus === status) {
        await api.removeGoing();
        setMyStatus(null);
        setGoing(g => g.filter(r => r.user_id !== user.id));
      } else {
        await api.setGoing(status);
        setMyStatus(status);
        setGoing(g => [
          ...g.filter(r => r.user_id !== user.id),
          { user_id: user.id, name: user.name, avatar_url: user.avatar_url, fleet: user.fleet, status }
        ]);
      }
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  const goingGroups = {
    going:     going.filter(r => r.status === 'going'),
    maybe:     going.filter(r => r.status === 'maybe'),
    not_going: going.filter(r => r.status === 'not_going'),
  };

  const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">The Line-up</h1>
          <p className="text-sm text-jm-muted capitalize">{today} · Skuytevaert</p>
        </div>
        <a href="https://www.windfinder.com/weatherforecast/noordwijk" target="_blank" rel="noopener noreferrer"
          className="text-xs text-jm-pinkText hover:underline">Windfinder →</a>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* LEFT: Wind forecast embed */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-jm-muted uppercase tracking-wider mb-3">Windverwachting vandaag</p>
          <WindForecast />
        </div>

        {/* RIGHT: Wie gaat er */}
        <div className="card p-5 space-y-4">
          <p className="text-xs font-semibold text-jm-muted uppercase tracking-wider">Wie gaat er vandaag?</p>

          {user ? (
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map(opt => {
                const isActive = myStatus === opt.key;
                return (
                  <button key={opt.key} type="button" onClick={() => handleStatus(opt.key)}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? opt.bg : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${isActive ? opt.border : 'rgba(255,255,255,0.08)'}`,
                      color: isActive ? opt.color : '#8BA3C7',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {isActive && <span style={{ fontSize: '11px', opacity: 0.8 }}>✓ Geselecteerd</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(232,25,106,0.06)', border: '1px solid rgba(232,25,106,0.15)' }}>
              <Link to="/inloggen" className="text-jm-pinkText font-bold hover:underline">Log in</Link>
              <span className="text-jm-muted"> om te laten weten of je gaat.</span>
            </div>
          )}

          <div className="border-t border-white/[0.07]" />

          {going.length === 0 ? (
            <p className="text-center text-sm text-jm-muted py-4">Nog niemand ingevuld vandaag.</p>
          ) : (
            <div className="space-y-4">
              {STATUS_OPTIONS.map(opt => {
                const group = goingGroups[opt.key];
                if (!group.length) return null;
                return (
                  <div key={opt.key}>
                    <p className="text-xs font-bold mb-2" style={{ color: opt.color }}>
                      {opt.label} · {group.length} {group.length === 1 ? "rijder" : "rijders"}
                    </p>
                    <div className="space-y-2">
                      {group.map(r => (
                        <div key={r.user_id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                          style={{ background: opt.bg, border: `1px solid ${opt.border}` }}>
                          <Avatar user={{ name: r.name, avatar_url: r.avatar_url }} size="sm" />
                          <span className="font-bold text-white text-sm flex-1">{r.name}</span>
                          <FleetBadge fleet={r.fleet} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
