const express = require('express');
const pool = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create table if not exists (runs once on startup)
pool.query(`
  CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

// GET /api/news — public
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name as author_name
       FROM news n LEFT JOIN users u ON u.id = n.created_by
       ORDER BY n.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// POST /api/news — admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Titel en inhoud zijn verplicht' });
  try {
    const result = await pool.query(
      `INSERT INTO news (title, content, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [title, content, req.user.id]
    );
    res.status(201).json({ news: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// DELETE /api/news/:id — admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
