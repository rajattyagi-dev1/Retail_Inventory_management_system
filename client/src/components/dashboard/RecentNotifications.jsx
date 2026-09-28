import React from 'react';
import { AlertTriangle, CheckCircle, Info, BellRing } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { MOCK_NOTIFICATIONS } from '../../utils/mockData';

/**
 * System alert and notification stream widget.
 */
export default function RecentNotifications() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

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
        {MOCK_NOTIFICATIONS.map((item) => {
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
        })}
      </div>
    </div>
  );
}
