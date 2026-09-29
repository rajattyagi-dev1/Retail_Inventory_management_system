import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Warehouse,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useWarehouses } from '../../hooks/useWarehouses';

const KANBAN_COLUMNS = [
  { key: 'PENDING', label: 'Pending Approval', color: '#f59e0b', nextStatus: 'PROCESSING', nextLabel: 'Process' },
  { key: 'PROCESSING', label: 'Processing', color: '#3b82f6', nextStatus: 'PICKING', nextLabel: 'Pick' },
  { key: 'PICKING', label: 'Picking', color: '#6366f1', nextStatus: 'PACKED', nextLabel: 'Pack' },
  { key: 'PACKED', label: 'Packed & Staged', color: '#8b5cf6', nextStatus: 'SHIPPED', nextLabel: 'Ship' },
  { key: 'SHIPPED', label: 'Shipped (In-Transit)', color: '#10b981', nextStatus: 'DELIVERED', nextLabel: 'Deliver' },
];

export default function FulfillmentPage() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrders();
  const { warehouses } = useWarehouses();

  const [warehouseFilter, setWarehouseFilter] = useState('ALL');

  const filteredOrders = orders.filter((ord) => {
    if (warehouseFilter !== 'ALL' && String(ord.warehouseId) !== String(warehouseFilter) && ord.warehouseName !== warehouseFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <Link to="/orders" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Orders List</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
            <h2 className="module-title">Fulfillment Pipeline Board</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              Kanban Operations
            </span>
          </div>
          <p className="module-description">
            Track and advance customer order fulfillment stages across distribution hubs.
          </p>
        </div>

        <div className="module-actions-group">
          {/* Warehouse Selector */}
          <div className="filter-select-wrapper">
            <label htmlFor="board-wh-filter" className="filter-label">
              Filter Hub:
            </label>
            <select
              id="board-wh-filter"
              className="filter-select"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="ALL">All Regional Hubs</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.name}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))',
          gap: '16px',
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: '20px',
        }}
      >
        {KANBAN_COLUMNS.map((col) => {
          // Orders that match this column's status (also include CONFIRMED in PENDING if any)
          const colOrders = filteredOrders.filter(
            (o) => o.status === col.key || (col.key === 'PENDING' && o.status === 'CONFIRMED')
          );

          return (
            <div
              key={col.key}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '480px',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: col.color,
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                    {col.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '2px 7px',
                    borderRadius: '999px',
                  }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Cards List */}
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1,
                }}
              >
                {colOrders.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '12px',
                    }}
                  >
                    No orders in this stage
                  </div>
                ) : (
                  colOrders.map((ord) => {
                    const itemCount = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

                    return (
                      <div
                        key={ord.id}
                        className="card"
                        style={{
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Link
                            to={`/orders/${ord.id}`}
                            style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb' }}
                          >
                            {ord.orderNumber}
                          </Link>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {ord.orderDate}
                          </span>
                        </div>

                        <div>
                          <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>
                            {ord.customerName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Warehouse size={11} /> {ord.warehouseName}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            paddingTop: '6px',
                            borderTop: '1px solid #f1f5f9',
                          }}
                        >
                          <span style={{ color: '#475569' }}>{itemCount} units</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            ₹{ord.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '6px',
                            gap: '6px',
                          }}
                        >
                          <button
                            type="button"
                            className="btn-sm btn-secondary"
                            style={{ height: '26px', padding: '0 6px', fontSize: '11px' }}
                            onClick={() => navigate(`/orders/${ord.id}`)}
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            className="btn-sm btn-primary"
                            style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                            onClick={() => updateOrderStatus(ord.id, col.nextStatus)}
                          >
                            <span>{col.nextLabel}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
