export const FLEET_STYLES = {
  Bronze:   { cls: 'bg-amber-900/50 text-amber-400 border border-amber-700/50',  hex: '#CD7F32' },
  Silver:   { cls: 'bg-slate-700/50  text-slate-300 border border-slate-500/50',  hex: '#94A3B8' },
  Gold:     { cls: 'bg-yellow-900/50 text-yellow-400 border border-yellow-600/50', hex: '#F59E0B' },
  Platinum: { cls: 'bg-sky-900/50    text-sky-300   border border-sky-600/50',    hex: '#CBD5E1' },
};

export default function FleetBadge({ fleet, size = 'sm' }) {
  const s = FLEET_STYLES[fleet] || FLEET_STYLES.Bronze;
  const sz = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sz} ${s.cls}`}>
      {fleet}
    </span>
  );
}
