const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

/**
 * Category Routes
 * Exclusively maps HTTP endpoints to controller handlers.
 * No business logic or queries here.
 */

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.patch('/:id/status', categoryController.updateCategoryStatus);

module.exports = router;
