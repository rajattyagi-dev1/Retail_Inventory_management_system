import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  History,
  Bell,
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
      { name: 'Suppliers', path: '/suppliers', icon: Truck, badge: '8' },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: FileSpreadsheet, badge: '12' },
    ],
  },
  {
    title: 'SALES',
    items: [
      { name: 'Orders', path: '/orders', icon: ShoppingCart, badge: '16' },
      { name: 'Fulfillment', path: '/orders/fulfillment', icon: CheckCircle2 },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'ADMINISTRATION',
    roles: ['ADMIN'],
    items: [
      { name: 'Admin Console', path: '/admin', icon: ShieldCheck },
      { name: 'Users', path: '/admin/users', icon: Users, badge: '8' },
      { name: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardList },
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleGroups = NAVIGATION_GROUPS.filter((group) => {
    if (!group.roles) return true;
    return group.roles.includes(user?.role);
  });

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
          {visibleGroups.map((group) => (
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
              <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>Security Role</div>
              <div style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>{user?.role || 'AUTHENTICATED'}</div>
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
