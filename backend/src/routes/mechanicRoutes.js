const express = require('express');
const controller = require('../controllers/mechanicController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.listMechanics);
router.get('/:id', controller.getMechanic);
router.patch('/:id', controller.updateMechanic);
module.exports = router;
