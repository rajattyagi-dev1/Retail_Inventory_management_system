const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Stock Movement Routes
 * Protected: Requires authentication and operational privileges.
 */

router.use(authenticateToken);
router.use(
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'SALES_MANAGER', 'PROCUREMENT_MANAGER', 'STAFF')
);

router.get('/', stockMovementController.getStockMovements);
router.get('/warehouse/:warehouseId', stockMovementController.getWarehouseStockMovements);
router.get('/product/:productId', stockMovementController.getProductStockMovements);
router.get('/:id', stockMovementController.getStockMovementById);

module.exports = router;
