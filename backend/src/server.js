require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const goingRoutes = require('./routes/going');
const socialRoutes = require('./routes/social');
const pushRoutes = require('./routes/push');

const app = express();

// Render zet de app achter een proxy; zonder dit denkt Express dat elk
// verzoek over http binnenkomt en bouwt hij verkeerde absolute URL's.
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Development: allow any localhost
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    // Production: allow configured origin(s)
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim());
    if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '25mb' }));

// Rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many upload requests, please try again later' }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/going', goingRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/push', pushRoutes);

// Apply rate limiting to upload endpoint
app.use('/api/sessions/upload', uploadLimiter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Bestand te groot' });
  }
  // Zonder deze regel kwam een te groot formulierveld eruit als een kale
  // "Internal server error", waar niemand iets mee kan.
  if (err.code === 'LIMIT_FIELD_VALUE') {
    return res.status(413).json({ error: 'Je screenshot is te groot om op te slaan' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`JumpMasters backend running on port ${PORT}`);
});
