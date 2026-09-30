const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Product Routes
 * Protected: Requires authentication.
 * Catalog modifications restricted to INVENTORY_MANAGER and ADMIN.
 */

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER', 'STAFF'),
  productController.getProducts
);
router.get(
  '/:id',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER', 'STAFF'),
  productController.getProduct
);
router.post(
  '/',
  authorizeRoles('INVENTORY_MANAGER'),
  productController.createProduct
);
router.put(
  '/:id',
  authorizeRoles('INVENTORY_MANAGER'),
  productController.updateProduct
);
router.patch(
  '/:id/status',
  authorizeRoles('INVENTORY_MANAGER'),
  productController.updateProductStatus
);

module.exports = router;
