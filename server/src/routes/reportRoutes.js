const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

/**
 * Reporting & Intelligence Routes
 */

router.get('/inventory', reportController.getInventoryReport);
router.get('/procurement', reportController.getProcurementReport);
router.get('/orders', reportController.getOrderReport);
router.get('/dashboard', reportController.getDashboardReport);

module.exports = router;
