import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import PlaceholderPage from './pages/Placeholder/PlaceholderPage';

/**
 * Main Application Router & Shell Component.
 * Establishes client-side routing for the Retail Inventory Management System (P_022).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* Default Route redirects to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Catalog Modules */}
          <Route 
            path="products" 
            element={<PlaceholderPage title="Product Catalog" moduleCode="MOD-CATALOG-01" />} 
          />

          {/* Inventory & Warehouse Modules */}
          <Route 
            path="inventory" 
            element={<PlaceholderPage title="Stock Inventory" moduleCode="MOD-INVENTORY-02" />} 
          />
          <Route 
            path="warehouses" 
            element={<PlaceholderPage title="Warehouses & Hubs" moduleCode="MOD-WAREHOUSE-03" />} 
          />

          {/* Procurement Modules */}
          <Route 
            path="suppliers" 
            element={<PlaceholderPage title="Suppliers Directory" moduleCode="MOD-SUPPLIER-04" />} 
          />
          <Route 
            path="purchase-orders" 
            element={<PlaceholderPage title="Purchase Orders" moduleCode="MOD-PROCUREMENT-05" />} 
          />
          <Route 
            path="procurement" 
            element={<PlaceholderPage title="Procurement Hub" moduleCode="MOD-PROCUREMENT-05" />} 
          />

          {/* Sales & Fulfillment Modules */}
          <Route 
            path="orders" 
            element={<PlaceholderPage title="Sales Orders" moduleCode="MOD-SALES-06" />} 
          />
          <Route 
            path="fulfillment" 
            element={<PlaceholderPage title="Order Fulfillment" moduleCode="MOD-FULFILLMENT-07" />} 
          />

          {/* Analytics Modules */}
          <Route 
            path="reports" 
            element={<PlaceholderPage title="Analytics & Reports" moduleCode="MOD-REPORTS-08" />} 
          />

          {/* Administration Modules */}
          <Route 
            path="users" 
            element={<PlaceholderPage title="User Accounts" moduleCode="MOD-ADMIN-USERS" />} 
          />
          <Route 
            path="roles" 
            element={<PlaceholderPage title="Roles & Permissions" moduleCode="MOD-ADMIN-ROLES" />} 
          />
          <Route 
            path="audit-logs" 
            element={<PlaceholderPage title="Audit Logs" moduleCode="MOD-ADMIN-AUDIT" />} 
          />
          <Route 
            path="administration" 
            element={<PlaceholderPage title="Administration Console" moduleCode="MOD-ADMIN-MAIN" />} 
          />

          {/* System Settings */}
          <Route 
            path="settings" 
            element={<PlaceholderPage title="System Settings" moduleCode="MOD-SYSTEM-CONFIG" />} 
          />

          {/* Fallback 404 handler */}
          <Route 
            path="*" 
            element={<PlaceholderPage title="Page Not Found" moduleCode="ERR-404" />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
