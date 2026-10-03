import api from './api';

/**
 * Normalizes backend notification object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeNotification(raw) {
  if (!raw) return null;

  let timeString = 'Just now';
  if (raw.createdAt) {
    try {
      const d = new Date(raw.createdAt);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) timeString = 'Just now';
      else if (diffMins < 60) timeString = `${diffMins} min ago`;
      else if (diffHours < 24) timeString = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else if (diffDays < 7) timeString = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else timeString = d.toLocaleDateString();
    } catch {
      timeString = String(raw.createdAt).split('T')[0];
    }
  }

  return {
    id: raw.id,
    type: raw.type || 'SYSTEM',
    title: raw.title || 'Notification',
    message: raw.message || '',
    read: Boolean(raw.read),
    severity: raw.severity || 'INFO',
    relatedId: raw.relatedId || null,
    createdAt: raw.createdAt || '',
    timestamp: timeString,
  };
}

/**
 * Fetch notifications for current authenticated user from GET /api/notifications.
 */
export async function getNotifications(params = {}) {
  const response = await api.get('/notifications', params);
  return {
    data: (response.data || []).map(normalizeNotification),
    unreadCount: response.unreadCount ?? (response.data || []).filter((n) => !n.read).length,
    pagination: response.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single notification by ID from GET /api/notifications/:id.
 */
export async function getNotificationById(id) {
  const response = await api.get(`/notifications/${id}`);
  return normalizeNotification(response.data);
}

/**
 * Mark a single notification as read via PATCH /api/notifications/:id/read.
 */
export async function markAsRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return normalizeNotification(response.data);
}

/**
 * Mark all notifications as read for current user via PATCH /api/notifications/read-all.
 */
export async function markAllAsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.message;
}

/**
 * Delete a notification via DELETE /api/notifications/:id.
 */
export async function deleteNotification(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.message;
}

export default {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  normalizeNotification,
};
