const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const service = require('./user.service');

const router = express.Router();

router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = await service.updateRole(Number(req.params.id), req.body.role);
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
});

module.exports = router;
