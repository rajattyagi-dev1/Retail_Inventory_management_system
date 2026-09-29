import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  Bell,
  Settings,
  UserCheck,
} from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useNotifications } from '../../hooks/useNotifications';
import StatusBadge from '../../components/common/StatusBadge';

export default function AdminDashboardPage() {
  const { users } = useUsers();
  const { auditLogs } = useAuditLogs();
  const { unreadCount } = useNotifications();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const recentLogs = auditLogs.slice(0, 6);
  const recentUsers = users.slice(0, 5);

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="module-title">Administration Console</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              Governance & Security
            </span>
          </div>
          <p className="module-description">
            High-level overview of system users, audit logs, security parameters, and application configuration.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/admin/users/new" className="btn-sm btn-primary">
            <Users size={15} />
            <span>Add User</span>
          </Link>
          <Link to="/admin/audit-logs" className="btn-sm btn-secondary">
            <ClipboardList size={15} />
            <span>View All Logs</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Users</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-card-value">{totalUsers}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Configured operator accounts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Active Accounts</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>{activeUsers}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Permitted for login</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Audit Events</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="stat-card-value">{auditLogs.length}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Recorded compliance actions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Unread Alerts</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Bell size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: unreadCount > 0 ? '#dc2626' : '#059669' }}>
            {unreadCount}
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active attention required</span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="dashboard-grid-2col">
        {/* Recent Audit Activities */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Audit Activity
            </h3>
            <Link to="/admin/audit-logs" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
              View all &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                    {log.description}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: 3 }}>
                    By: <strong>{log.user}</strong> &bull; Module: <code>{log.module}</code>
                  </div>
                </div>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                  {log.timestamp.split(' ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users Roster */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Operators & Staff
            </h3>
            <Link to="/admin/users" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
              Manage users &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {u.role.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={u.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Configuration & Governance Summary */}
      <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} color="#2563eb" />
          <span>System Environment & Governance Parameters</span>
        </h3>

        <div className="details-key-val-grid">
          <div className="details-key-val-item">
            <span className="details-key">Project Identifier</span>
            <span className="details-val">P_022 (Retail Inventory Management System)</span>
          </div>
          <div className="details-key-val-item">
            <span className="details-key">Current Architecture Mode</span>
            <span className="details-val" style={{ color: '#059669', fontWeight: 700 }}>
              Frontend Mock State (Phase 2 Master Build)
            </span>
          </div>
          <div className="details-key-val-item">
            <span className="details-key">Taxation Schedule</span>
            <span className="details-val">India Goods & Services Tax (18% Standard GST)</span>
          </div>
          <div className="details-key-val-item">
            <span className="details-key">Currency & Locale</span>
            <span className="details-val">INR (₹) &bull; en-IN</span>
          </div>
          <div className="details-key-val-item">
            <span className="details-key">Audit Trail Policy</span>
            <span className="details-val">Full Session-Level Event Capture</span>
          </div>
          <div className="details-key-val-item">
            <span className="details-key">Active Regional Warehouses</span>
            <span className="details-val">6 Regional Logistics Nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
