const service = require('./exercise.service');

async function getAll(req, res, next) {
  try {
    const { data, fromCache } = await service.getAll();
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };
