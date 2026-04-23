const authService = require('./auth.service');

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
    const result = await authService.login(req.body);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  const { password, ...user } = req.user;
  res.json({ status: 'success', data: { user } });
}

module.exports = { register, login, me };
