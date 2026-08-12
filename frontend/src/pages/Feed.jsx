import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import FleetBadge from '../components/FleetBadge';
import { IconHeight, IconAirtime, IconDistance } from '../components/Icons';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dagen geleden`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function FeedPost({ session, user }) {
  const [imgOpen, setImgOpen] = useState(false);
  // Likes komen mee in de feed zelf; hier stond een aparte fetch per post,
  // waardoor twaalf posts twaalf extra verzoeken opleverden voordat je iets zag.
  const [likes, setLikes] = useState(session.likes_count ?? 0);
  const [likedByMe, setLikedByMe] = useState(!!session.liked_by_me);
  const [comments, setComments] = useState([]);
  const [aantalReacties, setAantalReacties] = useState(session.comments_count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  function loadComments() {
    api.getComments(session.id)
      .then(rijen => { setComments(rijen); setAantalReacties(rijen.length); })
      .catch(() => {});
  }

  function toggleComments() {
    if (!showComments) loadComments();
    setShowComments(s => !s);
  }

  async function handleLike() {
    if (!user) return;
    const prev = likedByMe;
    setLikedByMe(!prev);
    setLikes(l => prev ? l - 1 : l + 1);
    try { await api.toggleLike(session.id); }
    catch { setLikedByMe(prev); setLikes(l => prev ? l + 1 : l - 1); }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setPosting(true);
    try {
      const c = await api.postComment(session.id, newComment);
      setComments(prev => [...prev, c]);
      setAantalReacties(n => n + 1);
      setNewComment('');
    } catch (err) { alert(err.message); }
    finally { setPosting(false); }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setAantalReacties(n => Math.max(0, n - 1));
    } catch (err) { alert(err.message); }
  }

  return (
    <article className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/rijder/${session.user_id}`}>
          <Avatar user={{ name: session.user_name, avatar_url: session.avatar_url }} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/rijder/${session.user_id}`} className="font-bold text-white hover:text-jm-pinkText transition-colors text-sm">
            {session.user_name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <FleetBadge fleet={session.fleet} />
            <span className="text-xs text-jm-muted">{timeAgo(session.created_at)}</span>
          </div>
        </div>
        <span className="text-lg font-black text-jm-pinkText flex-shrink-0">
          {parseFloat(session.points).toFixed(2)} pts
        </span>
      </div>

      {/* Media */}
      {session.media_url && (
        <div className="cursor-pointer" onClick={() => setImgOpen(true)}>
          {session.media_type === 'video'
            ? <video src={session.media_url} className="w-full max-h-72 object-cover" controls preload="none" onClick={e => e.stopPropagation()} />
            : <img src={session.media_url} alt="Sessie" className="w-full max-h-72 object-cover" loading="lazy" decoding="async" />}
        </div>
      )}

      {/* Caption */}
      {session.caption && <p className="px-4 pt-3 text-sm text-white/80 italic">"{session.caption}"</p>}
      {session.tagged_names?.length > 0 && (
        <p className="px-4 pt-1 text-xs text-jm-pinkText">🏷 Uitdaging aan: {session.tagged_names.join(', ')}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-3">
        {[
          { icon: <IconHeight className="w-4 h-4" />, value: `${parseFloat(session.height_m).toFixed(1)}m`, label: 'Hoogte', color: 'text-jm-pinkText' },
          { icon: <IconAirtime className="w-4 h-4" />, value: `${parseFloat(session.airtime_s).toFixed(1)}s`, label: 'Airtime', color: 'text-sky-400' },
          { icon: <IconDistance className="w-4 h-4" />, value: `${parseFloat(session.distance_m).toFixed(0)}m`, label: 'Afstand', color: 'text-violet-400' },
        ].map(({ icon, value, label, color }) => (
          <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: 'var(--jm-base)' }}>
            <div className={`flex justify-center mb-0.5 ${color}`}>{icon}</div>
            <div className={`text-sm font-black ${color}`}>{value}</div>
            <div className="text-[11.5px] text-jm-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Like & comment bar */}
      <div className="flex items-center gap-4 px-4 py-3 mt-1 border-t border-white/[0.06]">
        <button onClick={handleLike}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: likedByMe ? 'var(--jm-pink-text)' : 'var(--jm-muted)', cursor: user ? 'pointer' : 'default' }}>
          <svg className="w-5 h-5" fill={likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          {likes > 0 && <span>{likes}</span>}
        </button>
        <button onClick={toggleComments}
          className="flex items-center gap-1.5 text-sm font-semibold text-jm-muted hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          {aantalReacties > 0 ? aantalReacties : (showComments ? 'Verberg' : 'Reacties')}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
          {comments.length === 0 && <p className="text-xs text-jm-muted">Nog geen reacties.</p>}
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar user={{ name: c.name, avatar_url: c.avatar_url }} size="sm" />
              <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'var(--jm-base)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  {user?.id === c.user_id && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-[11.5px] text-red-400 hover:text-red-300">✕</button>
                  )}
                </div>
                <p className="text-sm text-white/80 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {user ? (
            <form onSubmit={handleComment} className="flex gap-2 mt-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Schrijf een reactie..." className="input text-xs py-2 flex-1" />
              <button type="submit" disabled={posting || !newComment.trim()}
                className="btn-primary text-xs py-2 px-3">
                {posting ? '...' : 'Stuur'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-jm-muted">
              <Link to="/inloggen" className="text-jm-pinkText hover:underline">Log in</Link> om te reageren.
            </p>
          )}
        </div>
      )}

      {/* Image lightbox */}
      {imgOpen && session.media_url && session.media_type !== 'video' && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setImgOpen(false)}>
          <img src={session.media_url} alt="Sessie" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </article>
  );
}

export default function Feed({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sessionFeed().then(setSessions).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Feed</h1>
        <p className="text-sm text-jm-muted">Nieuwste sessies</p>
      </div>
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-jm-pink border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-jm-muted text-sm">Laden...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-jm-muted">Nog geen sessies geplaatst.</p>
          <Link to="/uploaden" className="btn-primary mt-4 text-sm">Upload je eerste sessie</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => <FeedPost key={s.id} session={s} user={user} />)}
        </div>
      )}
    </div>
  );
}
