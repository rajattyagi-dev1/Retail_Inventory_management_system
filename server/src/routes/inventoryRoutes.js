const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

/**
 * Inventory Routes
 * Pure endpoint mapping to controller handlers.
 * No business logic or database queries here.
 */

router.get('/', inventoryController.getInventoryList);
router.post('/adjust', inventoryController.adjustStock);
router.get('/warehouse/:warehouseId', inventoryController.getWarehouseInventory);
router.get('/product/:productId', inventoryController.getProductInventory);
router.get('/:id', inventoryController.getInventoryById);

module.exports = router;
