import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Info,
  AlertCircle,
  FileSpreadsheet,
  ShoppingCart,
  Warehouse,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const TYPE_ICONS = {
  LOW_STOCK: AlertTriangle,
  OUT_OF_STOCK: AlertCircle,
  PURCHASE_ORDER: FileSpreadsheet,
  ORDER: ShoppingCart,
  WAREHOUSE: Warehouse,
  SYSTEM: Info,
};

const SEVERITY_COLORS = {
  INFO: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  WARNING: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  CRITICAL: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  SUCCESS: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
};

export default function NotificationPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread' && n.read) return false;
      if (severityFilter !== 'ALL' && n.severity !== severityFilter) return false;
      if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, activeTab, severityFilter, typeFilter]);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.relatedId) {
      navigate(notif.relatedId);
    }
  };

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="module-title">System Notifications</h2>
            {unreadCount > 0 && (
              <span className="nav-badge-pill" style={{ background: '#fef2f2', color: '#dc2626' }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="module-description">
            Audit alerts, inventory thresholds, supplier purchase orders, and sales dispatch updates.
          </p>
        </div>

        <div className="module-actions-group">
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={markAllAsRead}
            >
              <Check size={14} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="card filter-toolbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Read / Unread Toggle */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'all' ? 700 : 500,
                backgroundColor: activeTab === 'all' ? '#ffffff' : 'transparent',
                color: activeTab === 'all' ? '#0f172a' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeTab === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'unread' ? 700 : 500,
                backgroundColor: activeTab === 'unread' ? '#ffffff' : 'transparent',
                color: activeTab === 'unread' ? '#0f172a' : '#64748b',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeTab === 'unread' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Severity & Type Selectors */}
          <div className="filter-dropdowns-group">
            <div className="filter-select-wrapper">
              <label htmlFor="notif-sev-select" className="filter-label">
                Severity:
              </label>
              <select
                id="notif-sev-select"
                className="filter-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="notif-type-select" className="filter-label">
                Type:
              </label>
              <select
                id="notif-type-select"
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="PURCHASE_ORDER">Purchase Orders</option>
                <option value="ORDER">Customer Orders</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Feed List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: 0 }}>
              No notifications to display
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: 4 }}>
              You're all caught up! No alerts match your current filter settings.
            </p>
          </div>
        ) : (
          <div className="notification-feed">
            {filteredNotifications.map((n) => {
              const IconComponent = TYPE_ICONS[n.type] || Info;
              const sev = SEVERITY_COLORS[n.severity] || SEVERITY_COLORS.INFO;

              return (
                <div
                  key={n.id}
                  className="notification-feed-item"
                  style={{
                    backgroundColor: n.read ? '#ffffff' : '#f8fafc',
                    borderLeft: n.read ? '3px solid transparent' : `3px solid ${sev.text}`,
                    cursor: n.relatedId ? 'pointer' : 'default',
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div
                    className="notification-icon-wrap"
                    style={{
                      backgroundColor: sev.bg,
                      color: sev.text,
                      border: `1px solid ${sev.border}`,
                    }}
                  >
                    <IconComponent size={16} />
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-line">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="notification-title" style={{ fontWeight: n.read ? 600 : 700 }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#2563eb',
                            }}
                          />
                        )}
                      </div>
                      <span className="notification-time">{n.timestamp}</span>
                    </div>

                    <p className="notification-message" style={{ margin: '4px 0 6px 0' }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: sev.bg,
                          color: sev.text,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        {n.severity}
                      </span>
                      {n.relatedId && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          View Details <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    {!n.read && (
                      <button
                        type="button"
                        className="table-action-icon-btn"
                        title="Mark as read"
                        onClick={() => markAsRead(n.id)}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="table-action-icon-btn toggle-active"
                      title="Dismiss notification"
                      onClick={() => removeNotification(n.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
