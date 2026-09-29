const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementController');

/**
 * Stock Movement Routes
 * Pure endpoint mapping to controller handlers.
 * No business logic or database queries here.
 */

router.get('/', stockMovementController.getStockMovements);
router.get('/warehouse/:warehouseId', stockMovementController.getWarehouseStockMovements);
router.get('/product/:productId', stockMovementController.getProductStockMovements);
router.get('/:id', stockMovementController.getStockMovementById);

module.exports = router;
