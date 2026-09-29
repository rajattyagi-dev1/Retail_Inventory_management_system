import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  Boxes,
  Warehouse,
  Truck,
  FileSpreadsheet,
  ShoppingCart,
  CheckCircle2,
  BarChart3,
  Users,
  ShieldCheck,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  History,
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CATALOG',
    items: [
      { name: 'Products', path: '/products', icon: Package, badge: '12' },
      { name: 'Categories', path: '/products/categories', icon: Tag, badge: '4' },
    ],
  },
  {
    title: 'INVENTORY',
    items: [
      { name: 'Inventory', path: '/inventory', icon: Boxes, badge: '22' },
      { name: 'Warehouses', path: '/warehouses', icon: Warehouse, badge: '6' },
      { name: 'Stock Movements', path: '/inventory/movements', icon: History },
    ],
  },
  {
    title: 'PROCUREMENT',
    items: [
      { name: 'Suppliers', path: '/suppliers', icon: Truck },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'SALES',
    items: [
      { name: 'Orders', path: '/orders', icon: ShoppingCart, badge: '42' },
      { name: 'Fulfillment', path: '/fulfillment', icon: CheckCircle2 },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Roles', path: '/roles', icon: ShieldCheck },
      { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

/**
 * Reusable enterprise Sidebar component.
 * Supports collapsed state, active link styling, grouped categories, and mobile drawer.
 */
export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const handleLogout = () => {
    alert('Authentication & session management will be implemented in subsequent phases.');
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile} 
          aria-hidden="true" 
        />
      )}

      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="brand-icon-box">
              <Database size={18} />
            </div>
            {!isCollapsed && (
              <div className="brand-info">
                <span className="brand-title">RetailIMS</span>
                <span className="brand-badge">P_022 • Enterprise</span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="sidebar-nav-container">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title} className="nav-group">
              {!isCollapsed && (
                <div className="nav-group-title">{group.title}</div>
              )}
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <IconComponent className="nav-icon" />
                    {!isCollapsed && <span>{item.name}</span>}
                    {!isCollapsed && item.badge && (
                      <span className="nav-badge-pill">{item.badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-system-info">
              <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>System Status</div>
              <div>Mode: Frontend Shell (Phase 2A)</div>
            </div>
          )}

          <button 
            type="button" 
            className="sidebar-logout-btn" 
            onClick={handleLogout}
            title="Sign out of console"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
