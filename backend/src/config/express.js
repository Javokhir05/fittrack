const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('../middleware/errorHandler');
const healthRouter = require('../modules/health/health.router');
const authRouter = require('../modules/auth/auth.router');
const exerciseRouter = require('../modules/exercises/exercise.router');
const workoutRouter = require('../modules/workouts/workout.router');
const progressRouter = require('../modules/progress/progress.router');
const userRouter = require('../modules/users/user.router');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

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

module.exports = app;
