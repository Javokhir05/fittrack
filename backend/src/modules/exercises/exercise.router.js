const express = require('express');
const { body } = require('express-validator');
const controller = require('./exercise.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

const exerciseValidation = [
  body('name').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('muscleGroup').trim().notEmpty(),
];

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, requireRole('ADMIN'), exerciseValidation, validate, controller.create);
router.put('/:id', authenticate, requireRole('ADMIN'), exerciseValidation, validate, controller.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), controller.remove);

module.exports = router;
