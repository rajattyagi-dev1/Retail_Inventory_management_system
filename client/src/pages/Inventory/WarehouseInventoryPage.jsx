import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Package,
  Boxes,
  AlertTriangle,
  PieChart,
  Eye,
  Edit,
} from 'lucide-react';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useInventory } from '../../hooks/useInventory';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import StockAdjustmentModal from '../../components/inventory/StockAdjustmentModal';

/**
 * Warehouse Inventory Page (/inventory/warehouse/:warehouseId).
 * Focuses on all products stored within a single warehouse location.
 */
export default function WarehouseInventoryPage() {
  const { warehouseId } = useParams();
  const navigate = useNavigate();
  const { getWarehouseById } = useWarehouses();
  const { getWarehouseInventory, inventory } = useInventory();

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const warehouse = getWarehouseById(warehouseId);
  const warehouseItems = getWarehouseInventory(warehouseId);

  if (!warehouse) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Warehouse Not Found"
          message={`No warehouse matching ID "${warehouseId}" was found in active records.`}
          action={
            <Link to="/warehouses" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Warehouses</span>
            </Link>
          }
        />
      </div>
    );
  }

  // Summary calculations for this warehouse
  const totalSKUs = warehouseItems.length;
  const totalUnits = warehouseItems.reduce((acc, i) => acc + (i.currentStock || 0), 0);
  const lowStockCount = warehouseItems.filter((i) => i.stockStatus === 'LOW_STOCK').length;
  const outOfStockCount = warehouseItems.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;
  const utilizationPct =
    warehouse.capacity > 0 ? Math.round((totalUnits / warehouse.capacity) * 100) : 0;

  const handleOpenAdjustment = (item) => {
    setSelectedItem(item);
    setAdjustmentModalOpen(true);
  };

  const columns = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <Link
            to={`/inventory/${row.id}`}
            className="product-table-name-link"
            title="View inventory allocation details"
          >
            {row.productName}
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
            Category: {row.category}
          </span>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      width: '130px',
      render: (row) => <span className="sku-code">{row.sku}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span style={{ color: '#475569' }}>{row.category}</span>,
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          {row.currentStock}
        </span>
      ),
    },
    {
      key: 'reservedStock',
      header: 'Reserved',
      align: 'right',
      width: '95px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 600,
            color: row.reservedStock > 0 ? '#6d28d9' : '#94a3b8',
          }}
        >
          {row.reservedStock}
        </span>
      ),
    },
    {
      key: 'availableStock',
      header: 'Available',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 700,
            color: row.availableStock === 0 ? '#dc2626' : '#047857',
            backgroundColor: row.availableStock === 0 ? '#fef2f2' : '#ecfdf5',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          {row.availableStock}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder At',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="table-num" style={{ color: '#64748b' }}>
          {row.reorderLevel}
        </span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Details"
            onClick={() => navigate(`/inventory/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="table-action-icon-btn"
            title="Adjust Stock"
            onClick={() => handleOpenAdjustment(row)}
          >
            <Edit size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Top Header */}
      <div className="form-header-bar">
        <div>
          <Link to="/warehouses" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Warehouses</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{warehouse.name} — Inventory Ledger</h2>
            <StatusBadge status={warehouse.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6, color: '#64748b', fontSize: '12.5px' }}>
            <span className="sku-code">{warehouse.code}</span>
            <span>&bull;</span>
            <MapPin size={13} />
            <span>{warehouse.city}, {warehouse.state}</span>
          </div>
        </div>

        <div className="form-top-actions">
          <Link to={`/warehouses/${warehouse.id}`} className="btn-sm btn-secondary">
            <Warehouse size={15} />
            <span>Facility Overview</span>
          </Link>
          <Link to="/inventory" className="btn-sm btn-primary">
            <span>Global Inventory</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Managed SKUs</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="stat-card-value">{totalSKUs}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Distinct catalog products in facility</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Physical Units Stored</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <Boxes size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>
            {totalUnits.toLocaleString('en-IN')}
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Limit: {warehouse.capacity.toLocaleString('en-IN')} units</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Exceptions</span>
            <div
              className="stat-card-icon-wrap"
              style={{
                color: outOfStockCount > 0 ? '#ef4444' : '#d97706',
                backgroundColor: outOfStockCount > 0 ? '#fef2f2' : '#fffbeb',
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: outOfStockCount > 0 ? '#dc2626' : '#d97706' }}>
            {lowStockCount + outOfStockCount}
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">
              {lowStockCount} Low &bull; {outOfStockCount} Out of stock
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Facility Utilization</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <PieChart size={20} />
            </div>
          </div>
          <div className="stat-card-value">{utilizationPct}%</div>
          <div className="stat-card-bottom">
            <div className="progress-track" style={{ width: '100%', height: '6px', margin: 0 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(100, utilizationPct)}%`,
                  backgroundColor: utilizationPct >= 80 ? '#f59e0b' : '#3b82f6',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Products Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={warehouseItems}
          keyExtractor={(item) => item.id}
          emptyTitle="No inventory in this warehouse"
          emptyMessage="No catalog items are currently assigned or stocked in this facility."
        />
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        item={selectedItem}
        inventoryList={inventory}
        onClose={() => setAdjustmentModalOpen(false)}
      />
    </div>
  );
}
