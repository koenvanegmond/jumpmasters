const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create tables
pool.query(`
  CREATE TABLE IF NOT EXISTS likes (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (session_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
`).catch(console.error);

// POST /api/social/like/:sessionId — toggle like
router.post('/like/:sessionId', authenticate, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const existing = await pool.query(
      'SELECT 1 FROM likes WHERE session_id=$1 AND user_id=$2', [sessionId, req.user.id]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE session_id=$1 AND user_id=$2', [sessionId, req.user.id]);
      res.json({ liked: false });
    } else {
      await pool.query('INSERT INTO likes (session_id, user_id) VALUES ($1,$2)', [sessionId, req.user.id]);
      // Notify session owner
      const session = await pool.query('SELECT user_id FROM sessions WHERE id=$1', [sessionId]);
      if (session.rows.length && session.rows[0].user_id !== req.user.id) {
        await pool.query(
          `INSERT INTO notifications (user_id, from_user_id, type, session_id, message) VALUES ($1,$2,'like',$3,$4)`,
          [session.rows[0].user_id, req.user.id, sessionId, `${req.user.name} heeft je sessie geliket`]
        );
      }
      res.json({ liked: true });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

// GET /api/social/likes/:sessionId — count + did I like?
router.get('/likes/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const count = await pool.query('SELECT COUNT(*) FROM likes WHERE session_id=$1', [sessionId]);
    let liked_by_me = false;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const r = await pool.query('SELECT 1 FROM likes WHERE session_id=$1 AND user_id=$2', [sessionId, decoded.userId]);
        liked_by_me = r.rows.length > 0;
      } catch {}
    }
    res.json({ count: parseInt(count.rows[0].count), liked_by_me });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

// GET /api/social/comments/:sessionId
router.get('/comments/:sessionId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id as user_id, u.name, u.avatar_url
       FROM comments c JOIN users u ON u.id=c.user_id
       WHERE c.session_id=$1 ORDER BY c.created_at ASC`,
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

// POST /api/social/comment/:sessionId
router.post('/comment/:sessionId', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Reactie mag niet leeg zijn' });
  try {
    const result = await pool.query(
      'INSERT INTO comments (session_id, user_id, content) VALUES ($1,$2,$3) RETURNING *',
      [req.params.sessionId, req.user.id, content.trim()]
    );
    // Notify session owner
    const session = await pool.query('SELECT user_id FROM sessions WHERE id=$1', [req.params.sessionId]);
    if (session.rows.length && session.rows[0].user_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (user_id, from_user_id, type, session_id, message) VALUES ($1,$2,'comment',$3,$4)`,
        [session.rows[0].user_id, req.user.id, req.params.sessionId, `${req.user.name} reageerde: "${content.trim().slice(0,40)}"`]
      );
    }
    res.status(201).json({ ...result.rows[0], name: req.user.name, avatar_url: req.user.avatar_url });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

// DELETE /api/social/comment/:commentId
router.delete('/comment/:commentId', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id=$1 AND user_id=$2', [req.params.commentId, req.user.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

// GET /api/social/notifications — my notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name as from_name, u.avatar_url as from_avatar
       FROM notifications n JOIN users u ON u.id=n.from_user_id
       WHERE n.user_id=$1 ORDER BY n.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    const unread = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read=false', [req.user.id]);
    res.json({ notifications: result.rows, unread: parseInt(unread.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

// PATCH /api/social/notifications/read
router.patch('/notifications/read', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfout' }); }
});

module.exports = router;
