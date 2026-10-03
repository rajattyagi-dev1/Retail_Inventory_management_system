import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NotificationContext } from './notificationContextInstance';
import notificationService from '../services/notificationService';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch live notifications from backend API.
   * Scoped to the currently authenticated session user.
   */
  const fetchNotifications = useCallback(async (params = { limit: 50 }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await notificationService.getNotifications(params);
      setNotifications(result.data);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  /**
   * Mark single notification as read via backend API.
   */
  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
    }
  };

  /**
   * Mark all notifications as read via backend API.
   */
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  /**
   * Delete notification via backend API.
   */
  const removeNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err);
    }
  };

  /**
   * Client-side helper for transient alerts if needed.
   */
  const addNotification = (notif) => {
    const record = {
      ...notif,
      id: `transient-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [record, ...prev]);
    return record;
  };

  // Load live notifications on mount if authenticated
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
