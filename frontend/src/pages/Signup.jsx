import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/auth';

export default function Signup({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Wachtwoord moet minimaal 8 tekens zijn'); return; }
    setLoading(true);
    try {
      const user = await signup(email, password, name);
      onLogin(user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-full.png" alt="JumpMasters" className="h-28 mx-auto mb-5"
            onError={(e) => { e.target.style.display='none'; }} />
          <h1 className="text-2xl font-black text-white">Word lid van JumpMasters</h1>
          <p className="text-jm-muted text-sm mt-1">Maak je account aan</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Volledige naam</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="input" placeholder="Koen van Egmond" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">E-mailadres</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="input" placeholder="jij@voorbeeld.nl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Wachtwoord</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="input" placeholder="Min. 8 tekens" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>
        <p className="text-center text-sm text-jm-muted mt-5">
          Al een account?{' '}
          <Link to="/inloggen" className="text-jm-pink font-semibold hover:underline">Inloggen</Link>
        </p>
      </div>
    </div>
  );
}
