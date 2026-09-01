const express = require('express');
const controller = require('../controllers/serviceController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);
router.route('/').get(controller.listServices).post(controller.createService);
router.route('/:id').get(controller.getService).patch(controller.updateService).delete(controller.deleteService);
module.exports = router;
