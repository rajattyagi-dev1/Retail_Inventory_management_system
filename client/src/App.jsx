import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import PlaceholderPage from './pages/Placeholder/PlaceholderPage';
import { ProductProvider } from './context/ProductContext';
import { WarehouseProvider } from './context/WarehouseContext';
import ProductListPage from './pages/Products/ProductListPage';
import AddProductPage from './pages/Products/AddProductPage';
import ProductDetailsPage from './pages/Products/ProductDetailsPage';
import EditProductPage from './pages/Products/EditProductPage';
import CategoriesPage from './pages/Products/CategoriesPage';
import WarehouseListPage from './pages/Warehouses/WarehouseListPage';
import AddWarehousePage from './pages/Warehouses/AddWarehousePage';
import WarehouseDetailsPage from './pages/Warehouses/WarehouseDetailsPage';
import EditWarehousePage from './pages/Warehouses/EditWarehousePage';

/**
 * Main Application Router & Shell Component.
 * Establishes client-side routing for the Retail Inventory Management System (P_022).
 */
export default function App() {
  return (
    <ProductProvider>
      <WarehouseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              {/* Default Route redirects to /dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Product Catalog Module (Phase 2B) */}
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/new" element={<AddProductPage />} />
              <Route path="products/categories" element={<CategoriesPage />} />
              <Route path="products/:id" element={<ProductDetailsPage />} />
              <Route path="products/:id/edit" element={<EditProductPage />} />

              {/* Warehouse Management Module (Phase 2C) */}
              <Route path="warehouses" element={<WarehouseListPage />} />
              <Route path="warehouses/new" element={<AddWarehousePage />} />
              <Route path="warehouses/:id" element={<WarehouseDetailsPage />} />
              <Route path="warehouses/:id/edit" element={<EditWarehousePage />} />

              {/* Inventory Management Module */}
              <Route 
                path="inventory" 
                element={<PlaceholderPage title="Stock Inventory" moduleCode="MOD-INVENTORY-02" />} 
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
      </WarehouseProvider>
    </ProductProvider>
  );
}
