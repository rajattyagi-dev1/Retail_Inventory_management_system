const notificationService = require('../services/notificationService');

/**
 * Notification Controller
 * Handles HTTP requests and responses for alerts and notifications.
 */

const ApiError = require('../utils/apiError');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly, type, severity, sortBy, sortOrder } = req.query;
    // Ownership enforcement: non-admins are strictly scoped to their own notifications + global system notifications
    const effectiveUserId =
      req.user?.role === 'ADMIN' ? req.query.userId || null : req.user?.id || null;

    const result = await notificationService.getAllNotifications({
      page,
      limit,
      unreadOnly,
      type,
      severity,
      userId: effectiveUserId,
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

    if (
      req.user &&
      req.user.role !== 'ADMIN' &&
      notification.userId &&
      notification.userId !== req.user.id
    ) {
      throw ApiError.forbidden('Access denied to private notification');
    }

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
    const existing = await notificationService.getNotificationById(id);

    if (
      req.user &&
      req.user.role !== 'ADMIN' &&
      existing.userId &&
      existing.userId !== req.user.id
    ) {
      throw ApiError.forbidden('Access denied to private notification');
    }

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
    const effectiveUserId =
      req.user?.role === 'ADMIN' ? req.body?.userId || null : req.user?.id || null;
    const result = await notificationService.markAllAsRead(effectiveUserId);
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
    const existing = await notificationService.getNotificationById(id);

    if (
      req.user &&
      req.user.role !== 'ADMIN' &&
      existing.userId &&
      existing.userId !== req.user.id
    ) {
      throw ApiError.forbidden('Access denied to private notification');
    }

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
