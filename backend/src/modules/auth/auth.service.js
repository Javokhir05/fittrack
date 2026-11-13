const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');
const { accessTtlMs, refreshTtlMs } = require('../../config/cookies');

// A refresh token that was rotated less than this long ago is treated as a
// harmless race (two tabs refreshing at once) rather than as token theft.
const REUSE_GRACE_MS = 10 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: Math.floor(accessTtlMs() / 1000) }
  );
}

/** Create a new access token + a new stored (hashed) refresh token. */
async function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTtlMs()),
    },
  });
  return { accessToken, refreshToken };
}

async function register({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already in use', 409);

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return user;
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  // Housekeeping: drop this user's expired refresh tokens.
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const session = await issueSession(user);
  return { user: publicUser(user), session };
}

/**
 * Exchange a refresh token for a new session (rotation).
 * Presenting an already-rotated token outside the grace window is treated as
 * theft: every session of that user is revoked.
 */
async function refresh(rawToken) {
  if (!rawToken) throw new AppError('Session expired', 401);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });
  if (!record) throw new AppError('Session expired', 401);

  const now = new Date();

  if (record.revokedAt) {
    // Grace applies ONLY to tokens that were just rotated (not to ones revoked by
    // logout or by a theft response), otherwise a revoked token would stay usable.
    const rotatedRecently =
      record.rotatedAt && now.getTime() - new Date(record.rotatedAt).getTime() < REUSE_GRACE_MS;
    if (!rotatedRecently) {
      await prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new AppError('Session expired', 401);
    }
    // Benign race: fall through and issue a fresh session.
  } else {
    if (new Date(record.expiresAt) <= now) throw new AppError('Session expired', 401);

    // Rotate: revoke the presented token. `revokedAt: null` in the filter keeps
    // this atomic; if a concurrent request won, the result is the same as the
    // grace case above (a fresh session is still issued).
    await prisma.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: now, rotatedAt: now },
    });
  }

  const session = await issueSession(record.user);
  return { user: publicUser(record.user), session };
}

/** Revoke the presented refresh token (idempotent). */
async function logout(rawToken) {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

module.exports = { register, login, refresh, logout, hashToken };