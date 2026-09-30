const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_TYPES = [
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'PURCHASE_ORDER',
  'ORDER',
  'WAREHOUSE',
  'SYSTEM',
];

const VALID_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL', 'SUCCESS'];

/**
 * Format notification object for JSON response.
 */
const formatNotification = (notif) => {
  if (!notif) return null;
  return {
    id: notif.id,
    userId: notif.userId || null,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    read: Boolean(notif.read),
    severity: notif.severity,
    relatedId: notif.relatedId || null,
    createdAt: notif.createdAt,
    timestamp: notif.createdAt ? notif.createdAt.toISOString() : null,
  };
};

/**
 * Create a new notification.
 */
const createNotification = async ({
  type = 'SYSTEM',
  title,
  message,
  severity = 'INFO',
  relatedId = null,
  userId = null,
}, tx = null) => {
  try {
    const client = tx || prisma;

    const normalizedType = VALID_TYPES.includes(type) ? type : 'SYSTEM';
    const normalizedSeverity = VALID_SEVERITIES.includes(severity) ? severity : 'INFO';

    return await client.notification.create({
      data: {
        type: normalizedType,
        title: String(title || 'Notification').slice(0, 200),
        message: String(message || '').trim(),
        severity: normalizedSeverity,
        relatedId: relatedId ? String(relatedId).slice(0, 255) : null,
        userId: userId || null,
        read: false,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Helper to generate threshold-crossing inventory notifications.
 * Prevents spam: only notifies if stock newly enters LOW_STOCK or OUT_OF_STOCK.
 */
const notifyInventoryThreshold = async (inventoryRecord, prevStock, tx = null) => {
  if (!inventoryRecord) return null;

  const current = Number(inventoryRecord.currentStock) || 0;
  const reorder = Number(inventoryRecord.reorderLevel) || 10;
  const prev = prevStock !== undefined && prevStock !== null ? Number(prevStock) : null;

  const productName = inventoryRecord.product?.name || inventoryRecord.productName || 'Product';
  const warehouseName = inventoryRecord.warehouse?.name || inventoryRecord.warehouseName || 'Warehouse';
  const sku = inventoryRecord.product?.sku || inventoryRecord.sku || '';

  // 1. OUT OF STOCK
  if (current === 0 && (prev === null || prev > 0)) {
    return await createNotification({
      type: 'OUT_OF_STOCK',
      title: `Critical: ${productName} Out of Stock`,
      message: `${productName} (${sku}) at ${warehouseName} has reached 0 units on hand. Immediate replenishment required.`,
      severity: 'CRITICAL',
      relatedId: inventoryRecord.id,
    }, tx);
  }

  // 2. LOW STOCK
  if (current > 0 && current <= reorder && (prev === null || prev > reorder)) {
    return await createNotification({
      type: 'LOW_STOCK',
      title: `Warning: Low Stock on ${productName}`,
      message: `${productName} (${sku}) at ${warehouseName} is down to ${current} units (Reorder threshold: ${reorder}).`,
      severity: 'WARNING',
      relatedId: inventoryRecord.id,
    }, tx);
  }

  return null;
};

/**
 * List notifications with filtering and unread count.
 */
const getAllNotifications = async ({
  page = 1,
  limit = 20,
  unreadOnly = false,
  type,
  severity,
  userId,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (String(unreadOnly) === 'true' || unreadOnly === true) {
    where.read = false;
  }

  if (type && typeof type === 'string' && type.trim().toUpperCase() !== 'ALL') {
    const norm = type.trim().toUpperCase();
    if (!VALID_TYPES.includes(norm)) {
      throw ApiError.badRequest(`Invalid notification type. Allowed values: ${VALID_TYPES.join(', ')}`);
    }
    where.type = norm;
  }

  if (severity && typeof severity === 'string' && severity.trim().toUpperCase() !== 'ALL') {
    const norm = severity.trim().toUpperCase();
    if (!VALID_SEVERITIES.includes(norm)) {
      throw ApiError.badRequest(`Invalid severity. Allowed values: ${VALID_SEVERITIES.join(', ')}`);
    }
    where.severity = norm;
  }

  if (userId && typeof userId === 'string' && userId.trim()) {
    where.OR = [{ userId: userId.trim() }, { userId: null }];
  }

  const cleanSortBy = ['createdAt', 'type', 'severity'].includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, read: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [cleanSortBy]: cleanSortOrder },
    }),
  ]);

  return {
    data: notifications.map(formatNotification),
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/**
 * Get notification by ID.
 */
const getNotificationById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Notification ID is required');
  }

  const notif = await prisma.notification.findUnique({
    where: { id: id.trim() },
  });

  if (!notif) {
    throw ApiError.notFound('Notification not found');
  }

  return formatNotification(notif);
};

/**
 * Mark a single notification as read.
 */
const markAsRead = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Notification ID is required');
  }

  const notif = await prisma.notification.findUnique({
    where: { id: id.trim() },
  });

  if (!notif) {
    throw ApiError.notFound('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id: id.trim() },
    data: { read: true },
  });

  return formatNotification(updated);
};

/**
 * Mark all notifications as read.
 */
const markAllAsRead = async (userId = null) => {
  const where = { read: false };
  if (userId && typeof userId === 'string' && userId.trim()) {
    where.OR = [{ userId: userId.trim() }, { userId: null }];
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { read: true },
  });

  return { updatedCount: result.count, message: 'All notifications marked as read' };
};

/**
 * Delete a notification.
 */
const deleteNotification = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Notification ID is required');
  }

  const notif = await prisma.notification.findUnique({
    where: { id: id.trim() },
  });

  if (!notif) {
    throw ApiError.notFound('Notification not found');
  }

  await prisma.notification.delete({
    where: { id: id.trim() },
  });

  return { message: 'Notification removed successfully' };
};

module.exports = {
  createNotification,
  notifyInventoryThreshold,
  getAllNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatNotification,
};
