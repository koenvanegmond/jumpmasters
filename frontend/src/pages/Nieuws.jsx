import { useEffect, useState } from 'react';
import { api } from '../services/api';

function NewsPost({ post, isAdmin, onDelete }) {
  const date = new Date(post.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <article className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(232,25,106,0.1)', color: '#E8196A', border: '1px solid rgba(232,25,106,0.2)' }}>
              Nieuws
            </span>
            <span className="text-xs text-jm-muted">{date}</span>
            {post.author_name && (
              <span className="text-xs text-jm-muted">door {post.author_name}</span>
            )}
          </div>
          <h2 className="text-lg font-black text-white mb-2">{post.title}</h2>
          <p className="text-jm-muted text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>
        {isAdmin && (
          <button onClick={() => onDelete(post.id)}
            className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 text-xs border border-red-500/20 rounded-lg px-2.5 py-1.5 hover:bg-red-500/10">
            Verwijderen
          </button>
        )}
      </div>
    </article>
  );
}

export default function Nieuws({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '' });
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.getNews()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePost(e) {
    e.preventDefault();
    setPosting(true);
    try {
      const { news } = await api.createNews(form);
      setPosts(p => [{ ...news, author_name: user.name }, ...p]);
      setForm({ title: '', content: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bericht verwijderen?')) return;
    try {
      await api.deleteNews(id);
      setPosts(p => p.filter(n => n.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Nieuws</h1>
          <p className="text-sm text-jm-muted mt-1">Updates over events en het platform</p>
        </div>
        {user?.is_admin && (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm py-2 px-4">
            {showForm ? 'Annuleren' : '+ Bericht plaatsen'}
          </button>
        )}
      </div>

      {/* Admin post form */}
      {showForm && user?.is_admin && (
        <form onSubmit={handlePost} className="card p-6 mb-6 space-y-4">
          <h2 className="text-base font-bold text-white">Nieuw bericht</h2>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Titel</label>
            <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input" placeholder="Bijv. Competitie 2026 van start!" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Inhoud</label>
            <textarea required rows={5} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              className="input resize-none" placeholder="Schrijf hier je bericht..." />
          </div>
          <button type="submit" disabled={posting} className="btn-primary text-sm justify-center w-full">
            {posting ? 'Plaatsen...' : 'Bericht plaatsen'}
          </button>
        </form>
      )}

      {/* Posts */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-jm-pink border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-jm-muted text-sm">Laden...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-jm-muted">Nog geen nieuwsberichten.</p>
          {user?.is_admin && (
            <p className="text-xs text-jm-muted mt-2">Klik op "+ Bericht plaatsen" om te beginnen.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => (
            <NewsPost key={p.id} post={p} isAdmin={user?.is_admin} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
