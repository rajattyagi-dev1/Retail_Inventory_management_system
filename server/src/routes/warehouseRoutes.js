const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

/**
 * Warehouse Routes
 * Pure endpoint mapping to controller handlers.
 * No business logic or database queries here.
 */

router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouse);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.patch('/:id/status', warehouseController.updateWarehouseStatus);

module.exports = router;
