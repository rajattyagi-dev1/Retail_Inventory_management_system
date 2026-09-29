const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify backend service and database connectivity
 * @access  Public
 */
router.get('/', healthController.getHealth);

module.exports = router;
