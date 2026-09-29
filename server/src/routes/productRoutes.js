const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * Product Routes
 * Pure endpoint mapping to controller handlers.
 * No business logic or database queries here.
 */

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/status', productController.updateProductStatus);

module.exports = router;
