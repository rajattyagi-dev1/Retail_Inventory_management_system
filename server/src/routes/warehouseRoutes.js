const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Warehouse Routes
 * Protected: Requires authentication.
 * Facility modifications restricted to WAREHOUSE_MANAGER and ADMIN.
 */

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER', 'STAFF'),
  warehouseController.getWarehouses
);
router.get(
  '/:id',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER', 'STAFF'),
  warehouseController.getWarehouse
);
router.post(
  '/',
  authorizeRoles('WAREHOUSE_MANAGER'),
  warehouseController.createWarehouse
);
router.put(
  '/:id',
  authorizeRoles('WAREHOUSE_MANAGER'),
  warehouseController.updateWarehouse
);
router.patch(
  '/:id/status',
  authorizeRoles('WAREHOUSE_MANAGER'),
  warehouseController.updateWarehouseStatus
);

module.exports = router;
