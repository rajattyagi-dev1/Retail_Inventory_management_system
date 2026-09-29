import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { MOCK_CURRENT_USER, MOCK_NOTIFICATIONS } from '../../utils/mockData';

const ROUTE_NAME_MAP = {
  '/': 'Dashboard Overview',
  '/dashboard': 'Dashboard Overview',
  '/products': 'Product Catalog',
  '/inventory': 'Inventory Management',
  '/warehouses': 'Warehouse Locations',
  '/suppliers': 'Supplier Directory',
  '/purchase-orders': 'Purchase Orders',
  '/procurement': 'Procurement Hub',
  '/orders': 'Sales Orders',
  '/fulfillment': 'Order Fulfillment',
  '/reports': 'Analytics & Reports',
  '/users': 'User Management',
  '/roles': 'Roles & Permissions',
  '/audit-logs': 'System Audit Logs',
  '/administration': 'Administration',
  '/settings': 'System Settings',
};

/**
 * Reusable enterprise Header component.
 * Includes breadcrumbs, global search, notification dropdown, and profile controls.
 */
export default function Header({ onOpenMobileMenu }) {
  const location = useLocation();
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
  } else {
    pageTitle = ROUTE_NAME_MAP[location.pathname] || 'Console';
    const pathSegment = location.pathname.substring(1).replace('-', ' ');
    const capitalized = pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1);
    breadcrumbTrail.push({ label: capitalized, path: location.pathname });
  }

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

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
            title="Global search placeholder (Phase 2A)"
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
                <span className="nav-badge-pill" style={{ color: '#2563eb', background: '#eff6ff' }}>
                  {unreadCount} new
                </span>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="notification-feed-item">
                    <div
                      className="notification-icon-wrap"
                      style={{
                        backgroundColor:
                          n.type === 'critical' ? '#fef2f2' : n.type === 'success' ? '#ecfdf5' : '#eff6ff',
                        color:
                          n.type === 'critical' ? '#ef4444' : n.type === 'success' ? '#10b981' : '#3b82f6',
                      }}
                    >
                      {n.type === 'critical' ? (
                        <AlertTriangle size={15} />
                      ) : n.type === 'success' ? (
                        <CheckCircle size={15} />
                      ) : (
                        <Info size={15} />
                      )}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title-line">
                        <span className="notification-title">{n.title}</span>
                        <span className="notification-time">{n.time}</span>
                      </div>
                      <p className="notification-message">{n.message}</p>
                    </div>
                  </div>
                ))}
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

              <div className="dropdown-item" role="menuitem" onClick={() => setShowProfileMenu(false)}>
                <User size={15} />
                <span>My Profile</span>
              </div>
              <div className="dropdown-item" role="menuitem" onClick={() => setShowProfileMenu(false)}>
                <Shield size={15} />
                <span>Security & Roles</span>
              </div>
              <div className="dropdown-item" role="menuitem" onClick={() => setShowProfileMenu(false)}>
                <Settings size={15} />
                <span>Preferences</span>
              </div>

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
