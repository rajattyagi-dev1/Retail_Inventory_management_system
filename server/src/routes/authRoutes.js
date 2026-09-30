const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Authentication Routes
 * Public: /login, /logout
 * Protected: /me
 */

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
