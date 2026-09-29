const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const warehouseRoutes = require('./warehouseRoutes');

// Mount module routes
router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/warehouses', warehouseRoutes);

module.exports = router;
