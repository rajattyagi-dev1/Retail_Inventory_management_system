import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Power,
  Warehouse,
  MapPin,
  User,
  Boxes,
  Users,
  Layers,
  Phone,
  Mail,
  PieChart,
} from 'lucide-react';
import { useWarehouses } from '../../hooks/useWarehouses';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import SectionHeader from '../../components/common/SectionHeader';
import { MOCK_WAREHOUSE_INVENTORY_ITEMS } from '../../utils/warehouseMockData';

/**
 * Warehouse Details Page (/warehouses/:id).
 * Displays facility telemetry, capacity utilization, manager directory, and mock inventory allocation.
 */
export default function WarehouseDetailsPage() {
  const { id } = useParams();
  const { getWarehouseById, toggleWarehouseStatus } = useWarehouses();

  const warehouse = getWarehouseById(id);

  if (!warehouse) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Warehouse Not Found"
          message={`No warehouse matching identifier "${id}" exists in the current system records.`}
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

  // Key KPI metrics
  const capacity = warehouse.capacity || 0;
  const currentStock = warehouse.currentStock || 0;
  const availableCapacity = Math.max(0, capacity - currentStock);
  const utilizationPct = capacity > 0 ? ((currentStock / capacity) * 100).toFixed(1) : 0;

  // Mock inventory table columns
  const inventoryColumns = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.productName}</span>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      width: '140px',
      render: (row) => <span className="sku-code">{row.sku}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span style={{ color: '#475569' }}>{row.category}</span>,
    },
    {
      key: 'stock',
      header: 'On-Hand Stock',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: row.stock === 0 ? '#ef4444' : '#0f172a' }}>
          {row.stock} units
        </span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
  ];

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="form-header-bar">
        <div>
          <Link to="/warehouses" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Warehouses</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{warehouse.name}</h2>
            <StatusBadge status={warehouse.status} />
          </div>
          <span className="sku-code" style={{ marginTop: 6, display: 'inline-block' }}>
            {warehouse.code}
          </span>
        </div>

        <div className="form-top-actions">
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={() => toggleWarehouseStatus(warehouse.id)}
            title="Toggle between ACTIVE and INACTIVE state"
          >
            <Power size={14} />
            <span>{warehouse.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
          </button>

          <Link to={`/warehouses/${warehouse.id}/edit`} className="btn-sm btn-primary">
            <Edit3 size={15} />
            <span>Edit Warehouse</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Storage Capacity</span>
            <div className="stat-card-icon-wrap">
              <Boxes size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {capacity.toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Configured maximum volumetric limit</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Current Stock Stored</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <Warehouse size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>
            {currentStock.toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active physical inventory on shelves</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Available Free Space</span>
            <div className="stat-card-icon-wrap" style={{ color: '#0284c7', backgroundColor: '#f0f9ff' }}>
              <Layers size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {availableCapacity.toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Remaining inbound buffer space</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Capacity Utilization</span>
            <div className="stat-card-icon-wrap" style={{ color: utilizationPct >= 80 ? '#d97706' : '#2563eb' }}>
              <PieChart size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {utilizationPct}%
          </div>
          <div className="stat-card-bottom">
            <div className="progress-track" style={{ width: '100%', height: '6px', margin: 0 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(100, utilizationPct)}%`,
                  backgroundColor: utilizationPct >= 90 ? '#ef4444' : utilizationPct >= 75 ? '#f59e0b' : '#3b82f6',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Information Layout */}
      <div className="product-details-grid">
        {/* Left Column: Warehouse Info & Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Facility Details */}
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Warehouse size={16} color="#2563eb" />
              <span>Facility Profile</span>
            </h3>

            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Facility Name</span>
                <span className="details-val">{warehouse.name}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Warehouse Code</span>
                <span className="details-val">{warehouse.code}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Operational Status</span>
                <span className="details-val">
                  <StatusBadge status={warehouse.status} />
                </span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Commissioned Date</span>
                <span className="details-val">{warehouse.createdAt || '2025-11-01'}</span>
              </div>
            </div>
          </div>

          {/* Location & Jurisdiction */}
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color="#2563eb" />
              <span>Location & Postal Address</span>
            </h3>

            <div className="details-key-val-grid">
              <div className="details-key-val-item full-width" style={{ gridColumn: '1 / -1' }}>
                <span className="details-key">Street Address</span>
                <span className="details-val">{warehouse.address}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">City / District</span>
                <span className="details-val">{warehouse.city}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">State Jurisdiction</span>
                <span className="details-val">{warehouse.state}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Postal Pincode</span>
                <span className="details-val">{warehouse.pincode}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Region</span>
                <span className="details-val">India (National Logistics Grid)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Manager & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Manager & Staff Contact */}
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} color="#2563eb" />
              <span>Site Management & Staffing</span>
            </h3>

            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Station Manager</span>
                <span className="details-val">{warehouse.managerName}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Workforce Headcount</span>
                <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="#64748b" />
                  {warehouse.staffCount} staff members
                </span>
              </div>
              <div className="details-key-val-item full-width" style={{ gridColumn: '1 / -1' }}>
                <span className="details-key">Official Email</span>
                <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} color="#64748b" />
                  <a href={`mailto:${warehouse.managerEmail}`} style={{ color: '#2563eb' }}>
                    {warehouse.managerEmail}
                  </a>
                </span>
              </div>
              <div className="details-key-val-item full-width" style={{ gridColumn: '1 / -1' }}>
                <span className="details-key">Primary Phone</span>
                <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} color="#64748b" />
                  {warehouse.managerPhone}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Boxes size={16} color="#2563eb" />
              <span>Operations & Thresholds</span>
            </h3>

            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Storage Capacity</span>
                <span className="details-val">{capacity.toLocaleString('en-IN')} units</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Occupied Units</span>
                <span className="details-val">{currentStock.toLocaleString('en-IN')} units</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Free Volume</span>
                <span className="details-val">{availableCapacity.toLocaleString('en-IN')} units</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Occupancy Ratio</span>
                <span className="details-val">{utilizationPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Section: Inventory Overview */}
      <div className="card" style={{ marginTop: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px 20px' }}>
          <SectionHeader
            title="Inventory Overview"
            subtitle="Current SKU on-hand levels stored inside this regional fulfillment facility"
            badge="Mock Demonstration"
          />
          {/* Architectural Note */}
          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '14px',
            }}
          >
            <strong>Architectural Note:</strong> This inventory data is <em>MOCK ONLY</em> for UI demonstration. In upcoming sprints, this section will be populated dynamically from: <code>Warehouse &rarr; Inventory &rarr; Product</code> relationships.
          </div>
        </div>

        <DataTable
          columns={inventoryColumns}
          data={MOCK_WAREHOUSE_INVENTORY_ITEMS}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}
