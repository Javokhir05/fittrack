const express = require('express');
const { body } = require('express-validator');
const controller = require('./workout.controller');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty()],
  validate,
  controller.create
);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
