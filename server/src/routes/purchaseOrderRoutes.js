const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');

/**
 * Purchase Order Routes
 * Maps endpoints to controller handlers.
 * No business logic or database queries here.
 */

router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrder);
router.post('/', purchaseOrderController.createPurchaseOrder);
router.put('/:id', purchaseOrderController.updatePurchaseOrder);
router.patch('/:id/status', purchaseOrderController.updatePurchaseOrderStatus);
router.patch('/:id/approve', purchaseOrderController.approvePurchaseOrder);
router.post('/:id/receive', purchaseOrderController.receiveGoods);

module.exports = router;
