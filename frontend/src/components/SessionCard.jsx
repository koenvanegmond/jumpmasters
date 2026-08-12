import { Link } from 'react-router-dom';
import { IconHeight, IconAirtime, IconDistance } from './Icons';

export default function SessionCard({ session }) {
  const date = new Date(session.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  const height   = parseFloat(session.height_m   ?? session.height).toFixed(1);
  const airtime  = parseFloat(session.airtime_s  ?? session.airtime).toFixed(1);
  const distance = parseFloat(session.distance_m ?? session.distance).toFixed(0);

  return (
    <div className="card overflow-hidden hover:border-white/15 transition-colors">
      {session.media_url && (
        session.media_type === 'video'
          ? <video src={session.media_url} className="w-full max-h-48 object-cover" controls preload="none" />
          : <img src={session.media_url} alt="Sessie" className="w-full max-h-48 object-cover" loading="lazy" decoding="async" />
      )}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-jm-muted">{date}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            session.verified
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {session.verified ? 'Geverifieerd' : 'In behandeling'}
          </span>
        </div>

        {session.caption && <p className="text-sm text-jm-muted mb-3 italic">"{session.caption}"</p>}
        {session.tagged_names?.length > 0 && (
          <p className="text-xs text-jm-pinkText mb-3">
            <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            {session.tagged_names.join(', ')}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <IconHeight className="w-4 h-4" />, value: height, label: 'Hoogte', unit: 'm', color: 'text-jm-pinkText' },
            { icon: <IconAirtime className="w-4 h-4" />, value: airtime, label: 'Airtime', unit: 's', color: 'text-sky-400' },
            { icon: <IconDistance className="w-4 h-4" />, value: distance, label: 'Afstand', unit: 'm', color: 'text-violet-400' },
          ].map(({ icon, value, label, unit, color }) => (
            <div key={label} className="bg-jm-base rounded-xl p-3 text-center">
              <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
              <div className={`text-lg font-black ${color}`}>{value}</div>
              <div className="text-[11.5px] text-jm-muted mt-0.5">{label} ({unit})</div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-center justify-between">
          <span className="text-xs text-jm-muted">Score</span>
          <span className="text-base font-black text-jm-pinkText">{parseFloat(session.points).toFixed(2)} pts</span>
        </div>
      </div>
    </div>
  );
}
