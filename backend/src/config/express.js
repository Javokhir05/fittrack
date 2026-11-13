const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('../middleware/errorHandler');
const { csrfGuard } = require('../middleware/auth');
const healthRouter = require('../modules/health/health.router');
const authRouter = require('../modules/auth/auth.router');
const exerciseRouter = require('../modules/exercises/exercise.router');
const workoutRouter = require('../modules/workouts/workout.router');
const progressRouter = require('../modules/progress/progress.router');
const userRouter = require('../modules/users/user.router');

const app = express();

// Behind a reverse proxy (Railway, nginx) req.ip would otherwise be the proxy's
// address, so every user would share one rate-limit bucket.
// TRUST_PROXY: "true", a hop count like "1", or unset (1 in production, off elsewhere).
function trustProxySetting() {
  const v = process.env.TRUST_PROXY;
  if (v === undefined || v === '') return process.env.NODE_ENV === 'production' ? 1 : false;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return Number.isInteger(Number(v)) ? Number(v) : v;
}
app.set('trust proxy', trustProxySetting());

// Security middleware
app.use(helmet());
// Cookies require an explicit origin (never "*") together with credentials.
// CORS_ORIGIN may hold several comma-separated origins.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Rate limiting
// RATE_LIMIT_MAX overrides the default. Local development is relaxed because every
// request comes from the same address and a single page can make several API calls.
const defaultMax = process.env.NODE_ENV === 'production' ? 300 : 2000;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || defaultMax,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Much stricter limit on credential endpoints to slow down password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  skip: () => process.env.NODE_ENV === 'test',
  message: { status: 'error', message: 'Too many attempts, please try again later' },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// CSRF protection for cookie-authenticated, state-changing requests
app.use('/api/', csrfGuard);

// Routes
app.use('/', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/exercises', exerciseRouter);
app.use('/api/v1/workouts', workoutRouter);
app.use('/api/v1/progress', progressRouter);
app.use('/api/v1/users', userRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.json({
    message: "FitTrack API is running 🚀",
    status: "ok"
  });
});

module.exports = app;