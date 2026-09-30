const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Purchase Order Routes
 * Protected: Requires authentication and procurement/warehouse managerial permissions.
 */

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles('PROCUREMENT_MANAGER', 'WAREHOUSE_MANAGER'),
  purchaseOrderController.getPurchaseOrders
);
router.get(
  '/:id',
  authorizeRoles('PROCUREMENT_MANAGER', 'WAREHOUSE_MANAGER'),
  purchaseOrderController.getPurchaseOrder
);
router.post(
  '/',
  authorizeRoles('PROCUREMENT_MANAGER'),
  purchaseOrderController.createPurchaseOrder
);
router.put(
  '/:id',
  authorizeRoles('PROCUREMENT_MANAGER'),
  purchaseOrderController.updatePurchaseOrder
);
router.patch(
  '/:id/status',
  authorizeRoles('PROCUREMENT_MANAGER'),
  purchaseOrderController.updatePurchaseOrderStatus
);
router.patch(
  '/:id/approve',
  authorizeRoles('PROCUREMENT_MANAGER'),
  purchaseOrderController.approvePurchaseOrder
);
router.post(
  '/:id/receive',
  authorizeRoles('PROCUREMENT_MANAGER', 'WAREHOUSE_MANAGER'),
  purchaseOrderController.receiveGoods
);

module.exports = router;
