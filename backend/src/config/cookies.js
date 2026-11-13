/**
 * Cookie helpers for cookie-based authentication.
 *
 * - access_token  : short-lived JWT, sent on every API request
 * - refresh_token : long-lived opaque token, only sent to /api/v1/auth/*
 *
 * Both are httpOnly, so JavaScript on the page can never read them (TD-02).
 *
 * Deployment note
 * ---------------
 * Same-origin deployments (Docker + nginx, local Vite proxy) work with the
 * default COOKIE_SAMESITE=strict.
 * If the frontend and API live on DIFFERENT domains (e.g. two separate Railway
 * services), set COOKIE_SAMESITE=none; cookies are then always marked Secure and
 * CSRF protection relies on the X-Requested-With check + the CORS allow-list.
 */

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function accessTtlMs() {
  return positiveNumber(process.env.ACCESS_TOKEN_TTL_MINUTES, 15) * 60 * 1000;
}

function refreshTtlMs() {
  return positiveNumber(process.env.REFRESH_TOKEN_TTL_DAYS, 30) * 24 * 60 * 60 * 1000;
}

function sameSite() {
  const v = String(process.env.COOKIE_SAMESITE || 'strict').toLowerCase();
  return ['strict', 'lax', 'none'].includes(v) ? v : 'strict';
}

function isSecure() {
  if (sameSite() === 'none') return true; // browsers reject SameSite=None without Secure
  const v = process.env.COOKIE_SECURE;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function baseOptions() {
  return { httpOnly: true, secure: isSecure(), sameSite: sameSite() };
}

/** Parse a Cookie request header into a plain object. */
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key || key in out) continue;
    let val = part.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions(),
    path: '/',
    maxAge: accessTtlMs(),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: refreshTtlMs(),
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: REFRESH_COOKIE_PATH });
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  accessTtlMs,
  refreshTtlMs,
  parseCookies,
  setAuthCookies,
  clearAuthCookies,
};