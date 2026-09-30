const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Inventory Routes
 * Protected: Requires authentication.
 * Adjustments restricted to INVENTORY_MANAGER and WAREHOUSE_MANAGER.
 */

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'SALES_MANAGER', 'PROCUREMENT_MANAGER', 'STAFF'),
  inventoryController.getInventoryList
);
router.post(
  '/adjust',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'),
  inventoryController.adjustStock
);
router.get(
  '/warehouse/:warehouseId',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'SALES_MANAGER', 'PROCUREMENT_MANAGER', 'STAFF'),
  inventoryController.getWarehouseInventory
);
router.get(
  '/product/:productId',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'SALES_MANAGER', 'PROCUREMENT_MANAGER', 'STAFF'),
  inventoryController.getProductInventory
);
router.get(
  '/:id',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'SALES_MANAGER', 'PROCUREMENT_MANAGER', 'STAFF'),
  inventoryController.getInventoryById
);

module.exports = router;
