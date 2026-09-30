const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Reporting & Intelligence Routes
 * Protected: Requires authentication and managerial/admin privileges.
 */

router.use(authenticateToken);

router.get(
  '/inventory',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER'),
  reportController.getInventoryReport
);

router.get(
  '/procurement',
  authorizeRoles('PROCUREMENT_MANAGER'),
  reportController.getProcurementReport
);

router.get(
  '/orders',
  authorizeRoles('SALES_MANAGER'),
  reportController.getOrderReport
);

router.get(
  '/dashboard',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER'),
  reportController.getDashboardReport
);

module.exports = router;
