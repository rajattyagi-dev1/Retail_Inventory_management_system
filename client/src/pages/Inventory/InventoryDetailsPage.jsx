import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Package,
  Warehouse,
  Boxes,
  Bookmark,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import SectionHeader from '../../components/common/SectionHeader';
import StockAdjustmentModal from '../../components/inventory/StockAdjustmentModal';

/**
 * Inventory Details Page (/inventory/:id).
 * Demonstrates composite allocation of one product stored at one warehouse.
 */
export default function InventoryDetailsPage() {
  const { id } = useParams();
  const { getInventoryById, getStockMovements, inventory } = useInventory();
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  const item = getInventoryById(id);

  if (!item) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Inventory Record Not Found"
          message={`No stock record matching identifier "${id}" exists in the current session.`}
          action={
            <Link to="/inventory" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Inventory</span>
            </Link>
          }
        />
      </div>
    );
  }

  const movements = getStockMovements(item.id);

  // Movement history columns
  const movementColumns = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      width: '140px',
      render: (row) => <span style={{ fontSize: '12px', color: '#64748b' }}>{row.timestamp}</span>,
    },
    {
      key: 'type',
      header: 'Movement Type',
      width: '140px',
      render: (row) => <StatusBadge status={row.type} type="movement" />,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      width: '110px',
      render: (row) => {
        const isPos = row.quantity > 0;
        const isNeg = row.quantity < 0;
        return (
          <span
            className="table-num"
            style={{
              fontWeight: 700,
              color: isPos ? '#047857' : isNeg ? '#b91c1c' : '#475569',
              backgroundColor: isPos ? '#ecfdf5' : isNeg ? '#fef2f2' : 'transparent',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {isPos ? `+${row.quantity}` : row.quantity} units
          </span>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference',
      width: '130px',
      render: (row) => (
        <span className="sku-code" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
          {row.reference || '—'}
        </span>
      ),
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      render: (row) => <span style={{ color: '#334155', fontWeight: 500 }}>{row.performedBy}</span>,
    },
    {
      key: 'notes',
      header: 'Operational Notes',
      render: (row) => <span style={{ color: '#64748b', fontSize: '12px' }}>{row.notes || '—'}</span>,
    },
  ];

  return (
    <div className="product-module-page">
      {/* Top Header Bar */}
      <div className="form-header-bar">
        <div>
          <Link to="/inventory" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Inventory</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{item.productName}</h2>
            <StatusBadge status={item.stockStatus} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 6, flexWrap: 'wrap' }}>
            <span className="sku-code">{item.sku}</span>
            <span style={{ color: '#64748b', fontSize: '12.5px' }}>&bull; Stored at:</span>
            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
              {item.warehouseName} ({item.warehouseCode})
            </span>
          </div>
        </div>

        <div className="form-top-actions">
          <button
            type="button"
            className="btn-sm btn-primary"
            onClick={() => setAdjustmentModalOpen(true)}
          >
            <ArrowRightLeft size={15} />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Current On-Hand</span>
            <div className="stat-card-icon-wrap" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
              <Boxes size={20} />
            </div>
          </div>
          <div className="stat-card-value">{item.currentStock} units</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Total physical units inside warehouse</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Reserved Units</span>
            <div className="stat-card-icon-wrap" style={{ color: '#6d28d9', backgroundColor: '#f5f3ff' }}>
              <Bookmark size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#6d28d9' }}>
            {item.reservedStock} units
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Locked for active customer orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Available for Sale</span>
            <div
              className="stat-card-icon-wrap"
              style={{
                color: item.availableStock > 0 ? '#047857' : '#dc2626',
                backgroundColor: item.availableStock > 0 ? '#ecfdf5' : '#fef2f2',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div
            className="stat-card-value"
            style={{ color: item.availableStock > 0 ? '#047857' : '#dc2626' }}
          >
            {item.availableStock} units
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Free stock ready for dispatch</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Reorder Threshold</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>
            {item.reorderLevel} units
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Triggers replenishment notification</span>
          </div>
        </div>
      </div>

      {/* Information Grid: Product, Warehouse, Stock */}
      <div className="product-details-grid">
        {/* Left Column: Product & Warehouse Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Product Information */}
          <div className="card product-details-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Package size={16} color="#2563eb" />
                <span>Product Master Information</span>
              </h3>
              <Link
                to={`/inventory/product/${item.productId}`}
                style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}
              >
                View All Warehouses &rarr;
              </Link>
            </div>

            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Product Name</span>
                <span className="details-val">{item.productName}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">SKU Code</span>
                <span className="details-val">{item.sku}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Merchandise Category</span>
                <span className="details-val">{item.category}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Product Catalog ID</span>
                <span className="details-val"><code>{item.productId}</code></span>
              </div>
            </div>
          </div>

          {/* Warehouse Information */}
          <div className="card product-details-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Warehouse size={16} color="#2563eb" />
                <span>Warehouse Location Details</span>
              </h3>
              <Link
                to={`/inventory/warehouse/${item.warehouseId}`}
                style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}
              >
                View Hub Inventory &rarr;
              </Link>
            </div>

            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Facility Name</span>
                <span className="details-val">{item.warehouseName}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Facility Code</span>
                <span className="details-val">{item.warehouseCode}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Warehouse Entity ID</span>
                <span className="details-val"><code>{item.warehouseId}</code></span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Last Activity</span>
                <span className="details-val">{item.lastMovement || 'Standard Storage'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stock Metrics & Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#2563eb" />
              <span>Stock Status & Allocation Rules</span>
            </h3>

            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Current Stock</span>
                <span className="details-val">{item.currentStock} units</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Reserved Allocation</span>
                <span className="details-val" style={{ color: '#6d28d9' }}>{item.reservedStock} units</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Available For Dispatch</span>
                <span className="details-val" style={{ color: '#047857', fontWeight: 700 }}>
                  {item.availableStock} units
                </span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Reorder Point Threshold</span>
                <span className="details-val">{item.reorderLevel} units</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Calculated Status</span>
                <span className="details-val">
                  <StatusBadge status={item.stockStatus} />
                </span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Last Audit / Updated</span>
                <span className="details-val">{item.lastUpdated}</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '12px',
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              <strong>Allocation Formula:</strong> <code>Available = Current ({item.currentStock}) - Reserved ({item.reservedStock}) = {item.availableStock} units</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement History Table */}
      <div className="card" style={{ marginTop: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px 20px' }}>
          <SectionHeader
            title="Stock Movement History"
            subtitle={`Audit trail of receipts, outbound sales, adjustments and transfers for this SKU at ${item.warehouseName}`}
            badge={`${movements.length} Movements`}
          />
        </div>

        <DataTable
          columns={movementColumns}
          data={movements}
          keyExtractor={(m) => m.id}
          emptyTitle="No stock movements recorded"
          emptyMessage="Adjust stock above to record the first audit movement for this allocation."
        />
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        item={item}
        inventoryList={inventory}
        onClose={() => setAdjustmentModalOpen(false)}
      />
    </div>
  );
}
