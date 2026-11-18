const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { prisma } = require('../config/database');
const { ACCESS_COOKIE, REFRESH_COOKIE, parseCookies } = require('../config/cookies');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Reads the access token from the httpOnly cookie, falling back to an
 * `Authorization: Bearer` header (handy for API clients and tests).
 */
function extractToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[ACCESS_COOKIE]) return cookies[ACCESS_COOKIE];

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return null;
}

/**
 * CSRF guard for cookie authentication.
 * Browsers cannot add a custom header to a cross-site request without a CORS
 * preflight, and our CORS policy only allows the configured frontend origin.
 * So: any state-changing request that arrives WITH our auth cookies must also
 * carry `X-Requested-With`. Requests without cookies (register, bearer-token
 * API clients) are not CSRF-able and are left alone.
 */
function csrfGuard(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();
  const cookies = parseCookies(req.headers.cookie);
  const hasAuthCookie = Boolean(cookies[ACCESS_COOKIE] || cookies[REFRESH_COOKIE]);
  if (hasAuthCookie && !req.get('X-Requested-With')) {
    return next(new AppError('Missing X-Requested-With header', 403));
  }
  next();
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError('No token provided', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('User not found', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    next();
  };
}

module.exports = { authenticate, requireRole, csrfGuard };