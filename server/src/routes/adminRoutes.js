const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

/**
 * Admin Console Routes
 * Provides administration dashboard metrics and summary feeds.
 */

router.get('/dashboard', reportController.getDashboardReport);

module.exports = router;
