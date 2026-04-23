const service = require('./progress.service');

async function getAll(req, res, next) {
  try {
    const data = await service.getMyProgress(req.user.id);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await service.create(req.user.id, req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(Number(req.params.id), req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { getAll, create, remove };
