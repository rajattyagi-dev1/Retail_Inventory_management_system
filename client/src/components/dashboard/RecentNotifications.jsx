import React from 'react';
import { AlertTriangle, CheckCircle, Info, BellRing } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * System alert and notification stream widget.
 */
export default function RecentNotifications() {
  const { notifications, unreadCount, loading } = useNotifications();

  const displayList = (notifications || []).slice(0, 5).map((n) => ({
    id: n.id,
    type: n.severity === 'CRITICAL' ? 'critical' : n.severity === 'WARNING' ? 'warning' : n.severity === 'SUCCESS' ? 'success' : 'info',
    title: n.title,
    message: n.message,
    time: n.timestamp || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
    unread: !n.read,
  }));

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 12px 20px' }}>
        <SectionHeader
          title="Recent System Notifications"
          subtitle="Real-time automated alerts from warehouse IoT, orders, and audits"
          badge={`${unreadCount} New`}
        />
      </div>

      <div className="notification-feed">
        {loading ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading notification feed...
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No recent alerts or notifications.
          </div>
        ) : (
          displayList.map((item) => {
          let iconColor = '#2563eb';
          let bgColor = '#eff6ff';
          let IconComp = Info;

          if (item.type === 'critical') {
            iconColor = '#ef4444';
            bgColor = '#fef2f2';
            IconComp = AlertTriangle;
          } else if (item.type === 'success') {
            iconColor = '#10b981';
            bgColor = '#ecfdf5';
            IconComp = CheckCircle;
          } else if (item.type === 'warning') {
            iconColor = '#f59e0b';
            bgColor = '#fffbeb';
            IconComp = BellRing;
          }

          return (
            <div
              key={item.id}
              className="notification-feed-item"
              style={{
                backgroundColor: item.unread ? 'rgba(239, 246, 255, 0.4)' : undefined,
              }}
            >
              <div
                className="notification-icon-wrap"
                style={{ backgroundColor: bgColor, color: iconColor }}
                aria-hidden="true"
              >
                <IconComp size={16} />
              </div>

              <div className="notification-content">
                <div className="notification-title-line">
                  <span className="notification-title">{item.title}</span>
                  <span className="notification-time">{item.time}</span>
                </div>
                <p className="notification-message">{item.message}</p>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
