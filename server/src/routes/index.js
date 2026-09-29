const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const stockMovementRoutes = require('./stockMovementRoutes');

// Mount module routes
router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/stock-movements', stockMovementRoutes);

module.exports = router;

