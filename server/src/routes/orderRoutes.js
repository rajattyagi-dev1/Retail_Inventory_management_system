const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * Order Routes
 * Maps endpoints to controller handlers.
 * No business logic or database queries here.
 */

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.post('/:id/reserve', orderController.reserveStock);
router.post('/:id/cancel', orderController.cancelOrder);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
