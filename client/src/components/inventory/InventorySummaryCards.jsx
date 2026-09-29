import React from 'react';
import { Package, Boxes, Bookmark, AlertTriangle, AlertCircle } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';

/**
 * Summary KPI cards displaying dynamic totals calculated from InventoryContext.
 */
export default function InventorySummaryCards() {
  const { inventory } = useInventory();

  // Dynamic calculations from current context state
  const totalItems = inventory.length;
  const totalUnits = inventory.reduce((acc, item) => acc + (item.currentStock || 0), 0);
  const totalReserved = inventory.reduce((acc, item) => acc + (item.reservedStock || 0), 0);
  const totalAvailable = inventory.reduce((acc, item) => acc + (item.availableStock || 0), 0);
  const lowStockCount = inventory.filter((item) => item.stockStatus === 'LOW_STOCK').length;
  const outOfStockCount = inventory.filter((item) => item.stockStatus === 'OUT_OF_STOCK').length;

  return (
    <div className="stats-grid" style={{ marginBottom: '24px' }}>
      {/* 1. Total Inventory Items */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-card-label">Total Inventory SKUs</span>
          <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
            <Package size={20} />
          </div>
        </div>
        <div className="stat-card-value">{totalItems}</div>
        <div className="stat-card-bottom">
          <span className="stat-card-subtext">Product-warehouse allocations</span>
        </div>
      </div>

      {/* 2. Total Units in Stock */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-card-label">Total Units on Hand</span>
          <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
            <Boxes size={20} />
          </div>
        </div>
        <div className="stat-card-value" style={{ color: '#047857' }}>
          {totalUnits.toLocaleString('en-IN')}
        </div>
        <div className="stat-card-bottom">
          <span className="stat-card-subtext">
            <strong>{totalAvailable.toLocaleString('en-IN')}</strong> available for orders
          </span>
        </div>
      </div>

      {/* 3. Units Reserved */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-card-label">Units Reserved</span>
          <div className="stat-card-icon-wrap" style={{ color: '#8b5cf6', backgroundColor: '#f5f3ff' }}>
            <Bookmark size={20} />
          </div>
        </div>
        <div className="stat-card-value" style={{ color: '#6d28d9' }}>
          {totalReserved.toLocaleString('en-IN')}
        </div>
        <div className="stat-card-bottom">
          <span className="stat-card-subtext">Locked for open sales orders</span>
        </div>
      </div>

      {/* 4. Low & Out of Stock Alerts */}
      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-card-label">Stock Exceptions</span>
          <div
            className="stat-card-icon-wrap"
            style={{
              color: outOfStockCount > 0 ? '#ef4444' : '#d97706',
              backgroundColor: outOfStockCount > 0 ? '#fef2f2' : '#fffbeb',
            }}
          >
            {outOfStockCount > 0 ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
        </div>
        <div className="stat-card-value" style={{ color: outOfStockCount > 0 ? '#dc2626' : '#d97706' }}>
          {lowStockCount + outOfStockCount}
        </div>
        <div className="stat-card-bottom">
          <span className="stat-card-subtext">
            <strong>{lowStockCount}</strong> Low Stock &bull; <strong>{outOfStockCount}</strong> Out of Stock
          </span>
        </div>
      </div>
    </div>
  );
}
