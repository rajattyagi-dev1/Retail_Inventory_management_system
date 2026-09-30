const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Supplier Routes
 * Protected: Requires authentication and PROCUREMENT_MANAGER or ADMIN role.
 */

router.use(authenticateToken);
router.use(authorizeRoles('PROCUREMENT_MANAGER'));

// Supplier CRUD & status
router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplier);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.patch('/:id/status', supplierController.updateSupplierStatus);

// Supplier ↔ Product associations
router.get('/:supplierId/products', supplierController.getSupplierProducts);
router.post('/:supplierId/products', supplierController.addSupplierProduct);
router.delete('/:supplierId/products/:productId', supplierController.removeSupplierProduct);

module.exports = router;
