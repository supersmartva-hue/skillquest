/**
 * SkillQuest Backend — Express App Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const skillRoutes       = require('./routes/skills');
const lessonRoutes      = require('./routes/lessons');
const progressRoutes    = require('./routes/progress');
const leaderboardRoutes = require('./routes/leaderboard');
const achievementRoutes = require('./routes/achievements');
const challengeRoutes   = require('./routes/challenges');
const stripeRoutes      = require('./routes/stripe');
const generateRoutes    = require('./routes/generate');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    // In development allow any localhost port
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return cb(null, true);
    }
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── General rate limit (500 req / 15 min per IP) ────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/skills',      skillRoutes);
app.use('/api/lessons',     lessonRoutes);
app.use('/api/progress',    progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements',achievementRoutes);
app.use('/api/challenges',  challengeRoutes);
app.use('/api/stripe',      stripeRoutes);
app.use('/api/generate',    generateRoutes);

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.originalUrl} not found` }));

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'P2002') return res.status(409).json({ error: 'A record with this value already exists.' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found.' });
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Skip listen() on Vercel — the serverless runtime calls the handler directly
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SkillQuest API running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
