const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Category Routes
 * Protected: Requires authentication.
 * Category modifications restricted to INVENTORY_MANAGER and ADMIN.
 */

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER', 'STAFF'),
  categoryController.getCategories
);
router.get(
  '/:id',
  authorizeRoles('INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PROCUREMENT_MANAGER', 'SALES_MANAGER', 'STAFF'),
  categoryController.getCategory
);
router.post(
  '/',
  authorizeRoles('INVENTORY_MANAGER'),
  categoryController.createCategory
);
router.put(
  '/:id',
  authorizeRoles('INVENTORY_MANAGER'),
  categoryController.updateCategory
);
router.patch(
  '/:id/status',
  authorizeRoles('INVENTORY_MANAGER'),
  categoryController.updateCategoryStatus
);

module.exports = router;
