import React, { useState, useMemo } from 'react';
import { NotificationContext } from './notificationContextInstance';
import { INITIAL_NOTIFICATIONS } from '../utils/notificationMockData';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
  };

  const addNotification = (notif) => {
    const nextId = `notif-${Date.now()}`;
    const newRecord = {
      ...notif,
      id: nextId,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const value = {
    notifications,
    unreadCount,
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
