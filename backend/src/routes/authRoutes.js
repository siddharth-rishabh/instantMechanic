const express = require('express');
const { getCurrentUser, login } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
