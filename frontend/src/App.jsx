import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileTabBar from './components/MobileTabBar';
import Onboarding, { uitlegAlGezien } from './components/Onboarding';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Nieuws from './pages/Nieuws';
import HoeHetWerkt from './pages/HoeHetWerkt';
import Wind from './pages/Wind';
import Leaderboards from './pages/Leaderboards';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { api } from './services/api';
import { getToken, clearToken, bewaarGebruiker, bewaardeGebruiker } from './services/auth';

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/inloggen" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [toonUitleg, setToonUitleg] = useState(false);

  useEffect(() => {
    if (!getToken()) { setUser(null); return; }

    // Meteen tonen wie je bent volgens de vorige keer, zodat je niet naar een
    // laadscherm kijkt terwijl de server nog wakker wordt.
    const bekend = bewaardeGebruiker();
    if (bekend) setUser(bekend);

    api.me()
      .then(({ user }) => { setUser(user); bewaarGebruiker(user); })
      .catch((err) => {
        // Alleen uitloggen als de server je token echt afkeurt. Bij een
        // server die nog opstart of een haperende verbinding blijf je zitten.
        if (err.status === 401) { clearToken(); setUser(null); return; }
        if (!bekend) setUser(null);
      });
  }, []);

  // Elke wijziging aan de gebruiker ook lokaal bewaren, anders is een nieuwe
  // profielfoto na het herladen weer weg.
  function zetGebruiker(nieuw) {
    setUser(nieuw);
    if (nieuw) bewaarGebruiker(nieuw);
  }

  // De uitleg verschijnt één keer per account, zodra we weten wie er inlogt.
  useEffect(() => {
    if (user?.id && !uitlegAlGezien(user.id)) setToonUitleg(true);
  }, [user?.id]);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-jm-muted">
        Laden...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={() => setUser(null)} />
        {/* pb-24 op mobiel zodat de vaste tabbalk niets afdekt */}
        <main className="flex-1 pb-24 md:pb-0">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/feed" element={<Feed user={user} />} />
            <Route path="/wind" element={<Wind user={user} />} />
            <Route path="/nieuws" element={<Nieuws user={user} />} />
            <Route path="/ranglijst" element={<Leaderboards />} />
            <Route path="/hoe-het-werkt" element={<HoeHetWerkt />} />
            <Route path="/inloggen" element={<Login onLogin={zetGebruiker} />} />
            <Route path="/registreren" element={<Signup onLogin={zetGebruiker} />} />
            <Route path="/rijder/:id" element={<PublicProfile />} />
            <Route path="/uploaden" element={<RequireAuth user={user}><Upload user={user} /></RequireAuth>} />
            <Route path="/profiel" element={<RequireAuth user={user}><Profile user={user} onUserUpdate={zetGebruiker} /></RequireAuth>} />
            <Route path="/beheer" element={<RequireAuth user={user}><AdminDashboard user={user} /></RequireAuth>} />
            {/* Legacy redirects */}
            <Route path="/login" element={<Navigate to="/inloggen" replace />} />
            <Route path="/signup" element={<Navigate to="/registreren" replace />} />
            <Route path="/leaderboards" element={<Navigate to="/ranglijst" replace />} />
            <Route path="/upload" element={<Navigate to="/uploaden" replace />} />
            <Route path="/profile" element={<Navigate to="/profiel" replace />} />
            <Route path="/admin" element={<Navigate to="/beheer" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <MobileTabBar />
        {toonUitleg && user && (
          <Onboarding user={user} onKlaar={() => setToonUitleg(false)} />
        )}
      </div>
    </BrowserRouter>
  );
}
