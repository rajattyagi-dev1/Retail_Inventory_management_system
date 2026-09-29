import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
  Settings,
  Shield,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { MOCK_CURRENT_USER } from '../../utils/mockData';
import { useNotifications } from '../../hooks/useNotifications';

const ROUTE_NAME_MAP = {
  '/': 'Dashboard Overview',
  '/dashboard': 'Dashboard Overview',
  '/products': 'Product Catalog',
  '/inventory': 'Inventory Management',
  '/warehouses': 'Warehouse Locations',
  '/suppliers': 'Supplier Directory',
  '/purchase-orders': 'Purchase Orders',
  '/orders': 'Sales Orders',
  '/reports': 'Analytics & Reports',
  '/notifications': 'System Notifications',
  '/admin': 'Administration Console',
  '/admin/users': 'User Management',
  '/admin/audit-logs': 'System Audit Logs',
  '/settings': 'System Settings',
};

/**
 * Reusable enterprise Header component.
 * Includes dynamic breadcrumbs, live notification dropdown, and profile controls.
 */
export default function Header({ onOpenMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let pageTitle = ROUTE_NAME_MAP[location.pathname];
  let breadcrumbTrail = [{ label: 'Home', path: '/dashboard' }];

  if (location.pathname === '/' || location.pathname === '/dashboard') {
    pageTitle = 'Dashboard Overview';
    breadcrumbTrail.push({ label: 'Dashboard', path: '/dashboard' });
  } else if (location.pathname === '/products') {
    pageTitle = 'Product Catalog';
    breadcrumbTrail.push({ label: 'Products', path: '/products' });
  } else if (location.pathname === '/products/new') {
    pageTitle = 'Add New Product';
    breadcrumbTrail.push({ label: 'Products', path: '/products' });
    breadcrumbTrail.push({ label: 'New Product', path: '/products/new' });
  } else if (location.pathname === '/products/categories') {
    pageTitle = 'Product Categories';
    breadcrumbTrail.push({ label: 'Products', path: '/products' });
    breadcrumbTrail.push({ label: 'Categories', path: '/products/categories' });
  } else if (location.pathname.startsWith('/products/') && location.pathname.endsWith('/edit')) {
    pageTitle = 'Edit Product';
    breadcrumbTrail.push({ label: 'Products', path: '/products' });
    breadcrumbTrail.push({ label: 'Edit SKU', path: location.pathname });
  } else if (location.pathname.startsWith('/products/')) {
    pageTitle = 'Product Details';
    breadcrumbTrail.push({ label: 'Products', path: '/products' });
    breadcrumbTrail.push({ label: 'Details', path: location.pathname });
  } else if (location.pathname === '/warehouses') {
    pageTitle = 'Warehouse Management';
    breadcrumbTrail.push({ label: 'Warehouses', path: '/warehouses' });
  } else if (location.pathname === '/warehouses/new') {
    pageTitle = 'Add Warehouse';
    breadcrumbTrail.push({ label: 'Warehouses', path: '/warehouses' });
    breadcrumbTrail.push({ label: 'New Facility', path: '/warehouses/new' });
  } else if (location.pathname.startsWith('/warehouses/') && location.pathname.endsWith('/edit')) {
    pageTitle = 'Edit Warehouse';
    breadcrumbTrail.push({ label: 'Warehouses', path: '/warehouses' });
    breadcrumbTrail.push({ label: 'Edit Facility', path: location.pathname });
  } else if (location.pathname.startsWith('/warehouses/')) {
    pageTitle = 'Warehouse Details';
    breadcrumbTrail.push({ label: 'Warehouses', path: '/warehouses' });
    breadcrumbTrail.push({ label: 'Overview', path: location.pathname });
  } else if (location.pathname === '/inventory') {
    pageTitle = 'Inventory Management';
    breadcrumbTrail.push({ label: 'Inventory', path: '/inventory' });
  } else if (location.pathname === '/inventory/movements') {
    pageTitle = 'Stock Movements Ledger';
    breadcrumbTrail.push({ label: 'Inventory', path: '/inventory' });
    breadcrumbTrail.push({ label: 'Stock Movements', path: '/inventory/movements' });
  } else if (location.pathname.startsWith('/inventory/warehouse/')) {
    pageTitle = 'Warehouse Inventory';
    breadcrumbTrail.push({ label: 'Inventory', path: '/inventory' });
    breadcrumbTrail.push({ label: 'Warehouse View', path: location.pathname });
  } else if (location.pathname.startsWith('/inventory/product/')) {
    pageTitle = 'Product Stock Distribution';
    breadcrumbTrail.push({ label: 'Inventory', path: '/inventory' });
    breadcrumbTrail.push({ label: 'Product Stock', path: location.pathname });
  } else if (location.pathname.startsWith('/inventory/')) {
    pageTitle = 'Inventory Allocation Details';
    breadcrumbTrail.push({ label: 'Inventory', path: '/inventory' });
    breadcrumbTrail.push({ label: 'SKU Allocation', path: location.pathname });
  } else if (location.pathname === '/suppliers') {
    pageTitle = 'Supplier Directory';
    breadcrumbTrail.push({ label: 'Procurement', path: '/suppliers' });
    breadcrumbTrail.push({ label: 'Suppliers', path: '/suppliers' });
  } else if (location.pathname === '/suppliers/new') {
    pageTitle = 'Onboard Supplier';
    breadcrumbTrail.push({ label: 'Procurement', path: '/suppliers' });
    breadcrumbTrail.push({ label: 'New Supplier', path: '/suppliers/new' });
  } else if (location.pathname.startsWith('/suppliers/') && location.pathname.endsWith('/edit')) {
    pageTitle = 'Edit Supplier';
    breadcrumbTrail.push({ label: 'Procurement', path: '/suppliers' });
    breadcrumbTrail.push({ label: 'Edit Supplier', path: location.pathname });
  } else if (location.pathname.startsWith('/suppliers/')) {
    pageTitle = 'Supplier Profile';
    breadcrumbTrail.push({ label: 'Procurement', path: '/suppliers' });
    breadcrumbTrail.push({ label: 'Profile', path: location.pathname });
  } else if (location.pathname === '/purchase-orders') {
    pageTitle = 'Purchase Orders';
    breadcrumbTrail.push({ label: 'Procurement', path: '/purchase-orders' });
    breadcrumbTrail.push({ label: 'Purchase Orders', path: '/purchase-orders' });
  } else if (location.pathname === '/purchase-orders/new') {
    pageTitle = 'Create Purchase Order';
    breadcrumbTrail.push({ label: 'Procurement', path: '/purchase-orders' });
    breadcrumbTrail.push({ label: 'Create PO', path: '/purchase-orders/new' });
  } else if (location.pathname.startsWith('/purchase-orders/')) {
    pageTitle = 'Purchase Order Details';
    breadcrumbTrail.push({ label: 'Procurement', path: '/purchase-orders' });
    breadcrumbTrail.push({ label: 'PO Details', path: location.pathname });
  } else if (location.pathname === '/orders') {
    pageTitle = 'Sales Orders';
    breadcrumbTrail.push({ label: 'Sales', path: '/orders' });
    breadcrumbTrail.push({ label: 'Orders', path: '/orders' });
  } else if (location.pathname === '/orders/new') {
    pageTitle = 'Create Sales Order';
    breadcrumbTrail.push({ label: 'Sales', path: '/orders' });
    breadcrumbTrail.push({ label: 'New Order', path: '/orders/new' });
  } else if (location.pathname === '/orders/fulfillment') {
    pageTitle = 'Fulfillment Board';
    breadcrumbTrail.push({ label: 'Sales', path: '/orders' });
    breadcrumbTrail.push({ label: 'Fulfillment Kanban', path: '/orders/fulfillment' });
  } else if (location.pathname.startsWith('/orders/')) {
    pageTitle = 'Customer Order Details';
    breadcrumbTrail.push({ label: 'Sales', path: '/orders' });
    breadcrumbTrail.push({ label: 'Order Details', path: location.pathname });
  } else if (location.pathname === '/reports') {
    pageTitle = 'Reports & Analytics';
    breadcrumbTrail.push({ label: 'Reports', path: '/reports' });
  } else if (location.pathname === '/notifications') {
    pageTitle = 'System Notifications';
    breadcrumbTrail.push({ label: 'System', path: '/notifications' });
  } else if (location.pathname === '/admin') {
    pageTitle = 'Administration Console';
    breadcrumbTrail.push({ label: 'Administration', path: '/admin' });
  } else if (location.pathname === '/admin/users') {
    pageTitle = 'User Management';
    breadcrumbTrail.push({ label: 'Administration', path: '/admin' });
    breadcrumbTrail.push({ label: 'Users', path: '/admin/users' });
  } else if (location.pathname === '/admin/users/new') {
    pageTitle = 'Create User Account';
    breadcrumbTrail.push({ label: 'Administration', path: '/admin' });
    breadcrumbTrail.push({ label: 'New User', path: '/admin/users/new' });
  } else if (location.pathname.startsWith('/admin/users/') && location.pathname.endsWith('/edit')) {
    pageTitle = 'Edit User Account';
    breadcrumbTrail.push({ label: 'Administration', path: '/admin' });
    breadcrumbTrail.push({ label: 'Edit User', path: location.pathname });
  } else if (location.pathname === '/admin/audit-logs') {
    pageTitle = 'System Audit Logs';
    breadcrumbTrail.push({ label: 'Administration', path: '/admin' });
    breadcrumbTrail.push({ label: 'Audit Logs', path: '/admin/audit-logs' });
  } else {
    pageTitle = ROUTE_NAME_MAP[location.pathname] || 'Console';
    const pathSegment = location.pathname.substring(1).replace('-', ' ');
    const capitalized = pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1);
    breadcrumbTrail.push({ label: capitalized, path: location.pathname });
  }

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setShowNotifications(false);
    if (notif.relatedId) {
      navigate(notif.relatedId);
    }
  };

  return (
    <header className="app-header">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation drawer"
        >
          <Menu size={20} />
        </button>

        <div className="header-title-container">
          <div className="header-breadcrumbs">
            {breadcrumbTrail.map((crumb, idx) => (
              <React.Fragment key={crumb.path + idx}>
                {idx > 0 && <span className="breadcrumb-separator">/</span>}
                {idx === breadcrumbTrail.length - 1 ? (
                  <span className="breadcrumb-active">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-root">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
          <h1 className="header-page-title">{pageTitle}</h1>
        </div>
      </div>

      {/* Center: Search UI Placeholder */}
      <div className="header-center">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search products, SKUs, warehouses, orders..."
            readOnly
            title="Global search placeholder (Ctrl K)"
          />
          <kbd className="search-shortcut-badge">Ctrl K</kbd>
        </div>
      </div>

      {/* Right: Notification & User Profile Menu */}
      <div className="header-right">
        {/* Notifications Dropdown */}
        <div className="user-profile-menu" ref={notifRef}>
          <button
            type="button"
            className="header-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge-dot" />}
          </button>

          {showNotifications && (
            <div className="dropdown-menu dropdown-notifications" role="dialog">
              <div className="dropdown-header">
                <span>System Notifications</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </button>
                  )}
                  <span className="nav-badge-pill" style={{ color: '#2563eb', background: '#eff6ff' }}>
                    {unreadCount} unread
                  </span>
                </div>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.slice(0, 6).map((n) => (
                  <div
                    key={n.id}
                    className="notification-feed-item"
                    style={{
                      backgroundColor: n.read ? '#ffffff' : '#f8fafc',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div
                      className="notification-icon-wrap"
                      style={{
                        backgroundColor:
                          n.severity === 'CRITICAL' ? '#fef2f2' : n.severity === 'SUCCESS' ? '#ecfdf5' : n.severity === 'WARNING' ? '#fffbeb' : '#eff6ff',
                        color:
                          n.severity === 'CRITICAL' ? '#ef4444' : n.severity === 'SUCCESS' ? '#10b981' : n.severity === 'WARNING' ? '#d97706' : '#3b82f6',
                      }}
                    >
                      {n.severity === 'CRITICAL' ? (
                        <AlertCircle size={15} />
                      ) : n.severity === 'WARNING' ? (
                        <AlertTriangle size={15} />
                      ) : n.severity === 'SUCCESS' ? (
                        <CheckCircle size={15} />
                      ) : (
                        <Info size={15} />
                      )}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title-line">
                        <span className="notification-title" style={{ fontWeight: n.read ? 600 : 700 }}>
                          {n.title}
                        </span>
                        <span className="notification-time">{n.timestamp}</span>
                      </div>
                      <p className="notification-message">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <Link
                  to="/notifications"
                  style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
                  onClick={() => setShowNotifications(false)}
                >
                  View All Notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Area */}
        <div className="user-profile-menu" ref={profileRef}>
          <button
            type="button"
            className="user-profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
          >
            <div className="user-avatar" aria-hidden="true">AM</div>
            <div className="user-details">
              <span className="user-name">{MOCK_CURRENT_USER.name}</span>
              <span className="user-role-label">{MOCK_CURRENT_USER.role}</span>
            </div>
            <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: 4 }} />
          </button>

          {showProfileMenu && (
            <div className="dropdown-menu" role="menu">
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{MOCK_CURRENT_USER.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{MOCK_CURRENT_USER.email}</div>
              </div>

              <Link
                to="/admin/users"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setShowProfileMenu(false)}
              >
                <User size={15} />
                <span>My Profile</span>
              </Link>
              <Link
                to="/admin"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setShowProfileMenu(false)}
              >
                <Shield size={15} />
                <span>Admin Console</span>
              </Link>
              <Link
                to="/admin/audit-logs"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setShowProfileMenu(false)}
              >
                <Settings size={15} />
                <span>Audit Logs</span>
              </Link>

              <div className="dropdown-divider" />

              <div
                className="dropdown-item danger"
                role="menuitem"
                onClick={() => {
                  setShowProfileMenu(false);
                  alert('Session management and authentication will be introduced in subsequent phases.');
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
