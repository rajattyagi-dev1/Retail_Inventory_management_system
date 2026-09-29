import React, { useState } from 'react';
import {
  Boxes,
  Package,
  AlertTriangle,
  ShoppingCart,
  FileSpreadsheet,
  Building2,
  Calendar,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useInventory } from '../../hooks/useInventory';
import { useOrders } from '../../hooks/useOrders';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import InventoryReport from '../../components/reports/InventoryReport';
import ProcurementReport from '../../components/reports/ProcurementReport';
import OrderReport from '../../components/reports/OrderReport';

export default function ReportsPage() {
  const { products } = useProducts();
  const { inventory } = useInventory();
  const { orders } = useOrders();
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();

  const [activeTab, setActiveTab] = useState('inventory');
  const [dateRange, setDateRange] = useState('30d');
  const warehouseFilter = 'ALL';
  const categoryFilter = 'ALL';

  // Context-derived KPI summary metrics
  const totalProducts = products.length;
  const totalUnits = inventory.reduce((acc, i) => acc + (i.currentStock || 0), 0);
  const lowStockCount = inventory.filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const activePOCount = purchaseOrders.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED').length;
  const totalSuppliers = suppliers.length;

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="module-title">Reports & Analytics</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              Operational Intelligence
            </span>
          </div>
          <p className="module-description">
            Monitor inventory health, supplier procurement pipelines, and order fulfillment performance.
          </p>
        </div>

        {/* Global Controls */}
        <div className="module-actions-group">
          <div className="filter-select-wrapper">
            <label htmlFor="report-range" className="filter-label">
              <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
              Window:
            </label>
            <select
              id="report-range"
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 Executive Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Catalog SKUs</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Package size={16} />
            </div>
          </div>
          <div className="stat-card-value">{totalProducts}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active master items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Inventory Units</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>
            {totalUnits.toLocaleString('en-IN')}
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Total across hubs</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Stock Exceptions</span>
            <div className="stat-card-icon-wrap" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>{lowStockCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Below threshold</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Pending Orders</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>{pendingOrdersCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Awaiting delivery</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Open POs</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>{activePOCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Inbound pipeline</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Vendor Partners</span>
            <div className="stat-card-icon-wrap" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div className="stat-card-value">{totalSuppliers}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active supply sources</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'inventory' ? 700 : 500,
            color: activeTab === 'inventory' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'inventory' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          Inventory & Warehouse Reports
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('procurement')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'procurement' ? 700 : 500,
            color: activeTab === 'procurement' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'procurement' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          Procurement & Supplier Reports
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'orders' ? 700 : 500,
            color: activeTab === 'orders' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'orders' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          Order & Fulfillment Reports
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'inventory' && (
        <InventoryReport
          warehouseFilter={warehouseFilter}
          categoryFilter={categoryFilter}
        />
      )}

      {activeTab === 'procurement' && <ProcurementReport />}

      {activeTab === 'orders' && <OrderReport />}
    </div>
  );
}
