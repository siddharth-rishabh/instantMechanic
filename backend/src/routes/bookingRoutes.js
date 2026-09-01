const express = require('express');
const controller = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);
router.route('/').get(controller.listBookings).post(controller.createBooking);
router.route('/:id').get(controller.getBooking).patch(controller.updateBooking).delete(controller.deleteBooking);
module.exports = router;
