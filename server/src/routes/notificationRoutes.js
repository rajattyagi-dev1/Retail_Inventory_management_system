const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * Notification Routes
 * Maps alert & notification endpoints.
 */

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.get('/:id', notificationController.getNotification);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
