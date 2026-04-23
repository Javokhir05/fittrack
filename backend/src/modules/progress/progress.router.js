const express = require('express');
const controller = require('./progress.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, controller.create);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
