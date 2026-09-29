import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import PlaceholderPage from './pages/Placeholder/PlaceholderPage';

// Context Providers
import { ProductProvider } from './context/ProductContext';
import { WarehouseProvider } from './context/WarehouseContext';
import { InventoryProvider } from './context/InventoryContext';
import { SupplierProvider } from './context/SupplierContext';
import { PurchaseOrderProvider } from './context/PurchaseOrderContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import { UserProvider } from './context/UserContext';
import { AuditLogProvider } from './context/AuditLogContext';

// Product Catalog Pages (Phase 2B)
import ProductListPage from './pages/Products/ProductListPage';
import AddProductPage from './pages/Products/AddProductPage';
import ProductDetailsPage from './pages/Products/ProductDetailsPage';
import EditProductPage from './pages/Products/EditProductPage';
import CategoriesPage from './pages/Products/CategoriesPage';

// Warehouse Management Pages (Phase 2C)
import WarehouseListPage from './pages/Warehouses/WarehouseListPage';
import AddWarehousePage from './pages/Warehouses/AddWarehousePage';
import WarehouseDetailsPage from './pages/Warehouses/WarehouseDetailsPage';
import EditWarehousePage from './pages/Warehouses/EditWarehousePage';

// Inventory Management Pages (Phase 2D)
import InventoryListPage from './pages/Inventory/InventoryListPage';
import InventoryDetailsPage from './pages/Inventory/InventoryDetailsPage';
import StockMovementPage from './pages/Inventory/StockMovementPage';
import WarehouseInventoryPage from './pages/Inventory/WarehouseInventoryPage';
import ProductInventoryPage from './pages/Inventory/ProductInventoryPage';

// Supplier & Procurement Pages (Phase 2E)
import SupplierListPage from './pages/Suppliers/SupplierListPage';
import AddSupplierPage from './pages/Suppliers/AddSupplierPage';
import SupplierDetailsPage from './pages/Suppliers/SupplierDetailsPage';
import EditSupplierPage from './pages/Suppliers/EditSupplierPage';
import PurchaseOrderListPage from './pages/PurchaseOrders/PurchaseOrderListPage';
import CreatePurchaseOrderPage from './pages/PurchaseOrders/CreatePurchaseOrderPage';
import PurchaseOrderDetailsPage from './pages/PurchaseOrders/PurchaseOrderDetailsPage';

// Customer Orders & Fulfillment Pages (Phase 2F)
import OrderListPage from './pages/Orders/OrderListPage';
import CreateOrderPage from './pages/Orders/CreateOrderPage';
import OrderDetailsPage from './pages/Orders/OrderDetailsPage';
import FulfillmentPage from './pages/Orders/FulfillmentPage';

// Reports & Notifications Pages (Phase 2G)
import ReportsPage from './pages/Reports/ReportsPage';
import NotificationPage from './pages/Notifications/NotificationPage';

// Administration & Audit Pages (Phase 2H)
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import UserManagementPage from './pages/Admin/UserManagementPage';
import AddUserPage from './pages/Admin/AddUserPage';
import EditUserPage from './pages/Admin/EditUserPage';
import AuditLogPage from './pages/Admin/AuditLogPage';

/**
 * Main Application Router & Shell Component.
 * Retail Inventory Management System (Project ID: P_022).
 */
export default function App() {
  return (
    <ProductProvider>
      <WarehouseProvider>
        <InventoryProvider>
          <SupplierProvider>
            <PurchaseOrderProvider>
              <OrderProvider>
                <NotificationProvider>
                  <UserProvider>
                    <AuditLogProvider>
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

                            {/* Inventory Management Module (Phase 2D) */}
                            <Route path="inventory" element={<InventoryListPage />} />
                            <Route path="inventory/movements" element={<StockMovementPage />} />
                            <Route path="inventory/warehouse/:warehouseId" element={<WarehouseInventoryPage />} />
                            <Route path="inventory/product/:productId" element={<ProductInventoryPage />} />
                            <Route path="inventory/:id" element={<InventoryDetailsPage />} />

                            {/* Supplier & Procurement Module (Phase 2E) */}
                            <Route path="suppliers" element={<SupplierListPage />} />
                            <Route path="suppliers/new" element={<AddSupplierPage />} />
                            <Route path="suppliers/:id" element={<SupplierDetailsPage />} />
                            <Route path="suppliers/:id/edit" element={<EditSupplierPage />} />
                            <Route path="purchase-orders" element={<PurchaseOrderListPage />} />
                            <Route path="purchase-orders/new" element={<CreatePurchaseOrderPage />} />
                            <Route path="purchase-orders/:id" element={<PurchaseOrderDetailsPage />} />
                            <Route path="procurement" element={<Navigate to="/purchase-orders" replace />} />

                            {/* Sales Orders & Fulfillment Module (Phase 2F) */}
                            <Route path="orders" element={<OrderListPage />} />
                            <Route path="orders/new" element={<CreateOrderPage />} />
                            <Route path="orders/fulfillment" element={<FulfillmentPage />} />
                            <Route path="orders/:id" element={<OrderDetailsPage />} />
                            <Route path="fulfillment" element={<Navigate to="/orders/fulfillment" replace />} />

                            {/* Reports & Analytics Module (Phase 2G) */}
                            <Route path="reports" element={<ReportsPage />} />

                            {/* Notifications Module (Phase 2G) */}
                            <Route path="notifications" element={<NotificationPage />} />

                            {/* Administration & Audit Module (Phase 2H) */}
                            <Route path="admin" element={<AdminDashboardPage />} />
                            <Route path="admin/users" element={<UserManagementPage />} />
                            <Route path="admin/users/new" element={<AddUserPage />} />
                            <Route path="admin/users/:id/edit" element={<EditUserPage />} />
                            <Route path="admin/audit-logs" element={<AuditLogPage />} />

                            {/* Navigation aliases for backwards compatibility */}
                            <Route path="users" element={<Navigate to="/admin/users" replace />} />
                            <Route path="audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />
                            <Route path="administration" element={<Navigate to="/admin" replace />} />

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
                    </AuditLogProvider>
                  </UserProvider>
                </NotificationProvider>
              </OrderProvider>
            </PurchaseOrderProvider>
          </SupplierProvider>
        </InventoryProvider>
      </WarehouseProvider>
    </ProductProvider>
  );
}
