const express = require('express');
const { getCustomer, listCustomers } = require('../controllers/customerController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);
router.get('/', listCustomers);
router.get('/:id', getCustomer);
module.exports = router;
