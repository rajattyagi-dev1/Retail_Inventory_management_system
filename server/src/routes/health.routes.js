const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify backend service status
 * @access  Public
 */
router.get('/', healthController.checkHealth);

module.exports = router;
