const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const stockMovementRoutes = require('./stockMovementRoutes');
const supplierRoutes = require('./supplierRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const orderRoutes = require('./orderRoutes');

// Mount module routes
router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/orders', orderRoutes);

module.exports = router;

