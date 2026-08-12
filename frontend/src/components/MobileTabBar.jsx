import { NavLink } from 'react-router-dom';

function IconHome({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.955-8.955a1.125 1.125 0 0 1 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </svg>
  );
}

function IconFeed({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function IconRank({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconWind({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25h11.25a2.625 2.625 0 1 0-2.625-2.625M3 12h15.75a2.625 2.625 0 1 1-2.625 2.625M3 15.75h8.25a2.25 2.25 0 1 1-2.25 2.25" />
    </svg>
  );
}

const TABS = [
  { to: '/',          label: 'Home',     Icon: IconHome },
  { to: '/feed',      label: 'Feed',     Icon: IconFeed },
  { to: '/ranglijst', label: 'Ranglijst', Icon: IconRank },
  { to: '/wind',      label: 'Wind',     Icon: IconWind },
];

function Tab({ to, label, Icon, badge }) {
  return (
    <NavLink to={to} end={to === '/'}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-1 py-2 text-[11.5px] font-semibold transition-colors ${
          isActive ? 'text-jm-pinkText' : 'text-jm-muted'
        }`}>
      <span className="relative">
        <Icon className="w-5 h-5" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full
                           text-[10px] font-black flex items-center justify-center"
                style={{ background: 'var(--jm-pink)', color: '#fff' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {label}
    </NavLink>
  );
}

/**
 * Vaste balk onderaan op mobiel. Uploaden staat bewust in het midden als
 * grote knop — het is de belangrijkste actie van de hele site en zat
 * voorheen drie tikken diep in het hamburgermenu.
 */
export default function MobileTabBar({ nieuwInFeed = 0 }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.07]
                    bg-jm-card/95 backdrop-blur-md"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 items-end px-1">
        <Tab {...TABS[0]} />
        <Tab {...TABS[1]} badge={nieuwInFeed} />

        <NavLink to="/uploaden"
          className="flex flex-col items-center gap-1 text-[11.5px] font-bold text-jm-pinkText"
          aria-label="Sessie uploaden">
          <span className="w-12 h-12 -mt-5 rounded-full flex items-center justify-center text-white
                           shadow-lg shadow-jm-pink/30"
                style={{ background: 'linear-gradient(to right, var(--jm-pink), var(--jm-pink-light))' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <span className="pb-2">Upload</span>
        </NavLink>

        <Tab {...TABS[2]} />
        <Tab {...TABS[3]} />
      </div>
    </nav>
  );
}
