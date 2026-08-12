import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import FleetBadge from '../components/FleetBadge';
import Avatar from '../components/Avatar';
import Podium from '../components/Podium';
import { INTRO_KORT } from '../content';
import { IconRiders, IconSessions, IconHeight, IconUpload, IconAirtime, IconDistance } from '../components/Icons';

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-jm-pinkText flex-shrink-0"
           style={{ background: 'rgba(232,25,106,0.1)', border: '1px solid rgba(232,25,106,0.2)' }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value ?? '—'}</div>
        <div className="text-xs text-jm-muted mt-0.5">{label}</div>
        {sub && <div className="text-[11.5px] text-jm-muted/60 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// Simple kitesurfer kite SVG decoration
function KiteDecoration() {
  return (
    <svg className="absolute right-0 top-0 h-full opacity-[0.07] pointer-events-none select-none" viewBox="0 0 300 300" fill="none">
      {/* Kite shape */}
      <path d="M150 20 L280 150 L150 240 L20 150 Z" fill="white" />
      {/* Kite cross */}
      <line x1="150" y1="20" x2="150" y2="240" stroke="white" strokeWidth="2"/>
      <line x1="20" y1="150" x2="280" y2="150" stroke="white" strokeWidth="2"/>
      {/* Kite lines going down */}
      <path d="M150 240 Q140 265 130 280 M150 240 Q160 265 170 280" stroke="white" strokeWidth="1.5" fill="none"/>
      {/* Waves */}
      <path d="M0 270 Q30 255 60 270 Q90 285 120 270 Q150 255 180 270 Q210 285 240 270 Q270 255 300 270" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M0 285 Q30 270 60 285 Q90 300 120 285 Q150 270 180 285 Q210 300 240 285 Q270 270 300 285" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export default function Home({ user }) {
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);

  useEffect(() => {
    api.leaderboardOverall().then((data) => {
      setStats({
        riders: data.length,
        sessions: data.reduce((s, e) => s + e.sessions_count, 0),
        topHeight: data.length ? Math.max(...data.map(e => parseFloat(e.max_height) || 0)) : 0,
      });
      setTop(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    // Op mobiel staat de ranglijst vóór de statistieken: dat is waarvoor
    // mensen de site openen. Op desktop blijft de vertrouwde volgorde.
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 flex flex-col">
      {/* Hero — alleen op desktop. Op mobiel dupliceert dit de tabbalk
          (uploaden en ranglijst staan daar al) en duwt het de ranglijst
          onder de vouw. */}
      <div className="order-1 hidden md:block relative card overflow-hidden p-8 md:p-12 mb-8 text-center">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(135deg, rgba(232,25,106,0.12) 0%, transparent 60%)' }} />
        <KiteDecoration />
        <div className="relative z-10">
          <img src="/logo-full.png" alt="JumpMasters" className="h-28 md:h-36 mx-auto mb-6"
            onError={(e) => { e.target.style.display='none'; }} />
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
            Het kitesurf seizoen<br />is begonnen!
          </h1>
          <p className="text-jm-muted text-lg max-w-xl mx-auto mb-8">
            {INTRO_KORT}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={user ? "/uploaden" : "/registreren"} className="btn-primary text-base justify-center">
              <IconUpload className="w-5 h-5" />
              {user ? 'Sessie uploaden' : 'Doe mee'}
            </Link>
            <Link to="/ranglijst" className="btn-secondary text-base justify-center">
              Bekijk ranglijst
            </Link>
          </div>
        </div>
      </div>

      {/* Op mobiel is de hero weg, maar de introtekst hoort er wel te staan —
          dezelfde tekst als op desktop, uit content.js. */}
      <div className="order-1 md:hidden card p-4 mb-4">
        <div className="flex items-center gap-3">
          <img src="/logo-full.png" alt="" className="h-11 w-auto flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }} />
          <p className="text-sm text-jm-muted leading-relaxed">{INTRO_KORT}</p>
        </div>
        {!user && (
          <Link to="/registreren"
            className="mt-3 pt-3 border-t border-white/[0.07] flex items-center justify-between text-sm font-bold text-jm-pinkText">
            Doe mee met de competitie
            <span className="text-lg">→</span>
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="order-3 md:order-2 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatCard icon={<IconRiders className="w-5 h-5" />} label="Deelnemers" value={stats?.riders} />
        <StatCard icon={<IconSessions className="w-5 h-5" />} label="Totaal Sessies" value={stats?.sessions} />
        <StatCard icon={<IconHeight className="w-5 h-5" />} label="Hoogste Jump" value={stats?.topHeight ? `${parseFloat(stats.topHeight).toFixed(1)} m` : null} />
      </div>

      {/* Top riders */}
      <div className="order-2 md:order-3 card p-5 md:p-6 mb-4 md:mb-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">Top rijders 2026</h2>
          <img src="/logo-text.png" alt="" className="h-5 opacity-30"
            onError={(e) => e.target.style.display='none'} />
        </div>
        {top.length === 0 ? (
          <p className="text-jm-muted text-sm text-center py-8">Nog geen sessies. Wees de eerste!</p>
        ) : (
          <>
          <Podium entries={top} />
          <div className={`space-y-2 ${top.length > 3 ? 'mt-5 pt-4 border-t border-white/[0.07]' : ''}`}>
            {top.slice(3).map((entry) => (
              <Link to={`/rijder/${entry.user_id}`} key={entry.user_id}
                className="flex items-center gap-3 rounded-xl px-3 py-3 -mx-3 transition-colors group"
                style={{ ':hover': { background: 'rgba(255,255,255,0.04)' } }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className="w-7 text-center font-black text-jm-muted text-sm flex-shrink-0">
                  #{entry.rank}
                </span>
                <Avatar user={{ name: entry.name, avatar_url: entry.avatar_url }} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white group-hover:text-jm-pinkText transition-colors truncate">
                    {entry.name}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-jm-pinkText flex items-center gap-1">
                      <IconHeight className="w-3 h-3" />
                      {entry.max_height > 0 ? `${parseFloat(entry.max_height).toFixed(1)}m` : '—'}
                    </span>
                    <span className="text-xs text-sky-400 flex items-center gap-1">
                      <IconAirtime className="w-3 h-3" />
                      {entry.max_airtime > 0 ? `${parseFloat(entry.max_airtime).toFixed(1)}s` : '—'}
                    </span>
                    <span className="text-xs text-violet-400 flex items-center gap-1">
                      <IconDistance className="w-3 h-3" />
                      {entry.max_distance > 0 ? `${parseFloat(entry.max_distance).toFixed(0)}m` : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <FleetBadge fleet={entry.fleet} />
                  <div className="text-right">
                    <div className="font-black text-jm-pinkText text-base leading-tight">{parseFloat(entry.total_points).toFixed(2)}</div>
                    <div className="text-[11.5px] text-jm-muted">punten</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </>
        )}
        <div className="mt-4 pt-4 border-t border-white/[0.07] flex items-center justify-between">
          <Link to="/ranglijst" className="text-sm text-jm-pinkText font-semibold hover:underline">
            Volledige ranglijst →
          </Link>
          <Link to="/feed" className="text-sm text-jm-muted hover:text-white transition-colors">
            Bekijk feed →
          </Link>
        </div>
      </div>
    </div>
  );
}
