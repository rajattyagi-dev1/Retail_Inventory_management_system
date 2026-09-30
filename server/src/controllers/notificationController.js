const notificationService = require('../services/notificationService');

/**
 * Notification Controller
 * Handles HTTP requests and responses for alerts and notifications.
 */

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly, type, severity, userId, sortBy, sortOrder } = req.query;
    const result = await notificationService.getAllNotifications({
      page,
      limit,
      unreadOnly,
      type,
      severity,
      userId,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({
      success: true,
      data: result.data,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.getNotificationById(id);
    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    return next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.body || {};
    const result = await notificationService.markAllAsRead(userId);
    return res.status(200).json({
      success: true,
      message: result.message,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await notificationService.deleteNotification(id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
