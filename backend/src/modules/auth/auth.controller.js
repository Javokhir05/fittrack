const authService = require('./auth.service');
const { REFRESH_COOKIE, parseCookies, setAuthCookies, clearAuthCookies } = require('../../config/cookies');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, session } = await authService.login(req.body);
    setAuthCookies(res, session);
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const { user, session } = await authService.refresh(cookies[REFRESH_COOKIE]);
    setAuthCookies(res, session);
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    if (err.statusCode === 401) clearAuthCookies(res);
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    await authService.logout(cookies[REFRESH_COOKIE]);
    clearAuthCookies(res);
    res.json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  const { password, ...user } = req.user;
  res.json({ status: 'success', data: { user } });
}

module.exports = { register, login, refresh, logout, me };