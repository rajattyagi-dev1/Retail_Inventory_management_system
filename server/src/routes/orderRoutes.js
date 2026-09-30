const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Order Routes
 * Protected: Requires authentication and sales/warehouse fulfillment permissions.
 */

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles('SALES_MANAGER', 'WAREHOUSE_MANAGER'),
  orderController.getOrders
);
router.get(
  '/:id',
  authorizeRoles('SALES_MANAGER', 'WAREHOUSE_MANAGER'),
  orderController.getOrder
);
router.post(
  '/',
  authorizeRoles('SALES_MANAGER'),
  orderController.createOrder
);
router.post(
  '/:id/reserve',
  authorizeRoles('SALES_MANAGER', 'WAREHOUSE_MANAGER'),
  orderController.reserveStock
);
router.post(
  '/:id/cancel',
  authorizeRoles('SALES_MANAGER'),
  orderController.cancelOrder
);
router.patch(
  '/:id/status',
  authorizeRoles('SALES_MANAGER', 'WAREHOUSE_MANAGER'),
  orderController.updateOrderStatus
);

module.exports = router;
