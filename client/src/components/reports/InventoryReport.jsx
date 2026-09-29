import React from 'react';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useInventory } from '../../hooks/useInventory';
import { useProducts } from '../../hooks/useProducts';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';

export default function InventoryReport({ warehouseFilter, categoryFilter }) {
  const { warehouses } = useWarehouses();
  const { inventory } = useInventory();
  const { categories } = useProducts();

  // 1. Warehouse breakdown
  const warehouseStats = warehouses
    .filter((w) => warehouseFilter === 'ALL' || w.name === warehouseFilter || w.id === warehouseFilter)
    .map((wh) => {
      const items = inventory.filter(
        (i) => String(i.warehouseId) === String(wh.id) || i.warehouseName === wh.name
      );
      const totalUnits = items.reduce((acc, i) => acc + (i.currentStock || 0), 0);
      const lowStock = items.filter((i) => i.stockStatus === 'LOW_STOCK').length;
      const outOfStock = items.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;
      const utilization = wh.capacity > 0 ? Math.round((totalUnits / wh.capacity) * 100) : 0;

      return {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        skus: items.length,
        units: totalUnits,
        capacity: wh.capacity,
        lowStock,
        outOfStock,
        utilization,
      };
    });

  // 2. Category breakdown
  const categoryStats = categories
    .filter((c) => categoryFilter === 'ALL' || c.name === categoryFilter)
    .map((cat) => {
      const catItems = inventory.filter((i) => i.category === cat.name);
      const totalUnits = catItems.reduce((acc, i) => acc + (i.currentStock || 0), 0);
      const lowStock = catItems.filter((i) => i.stockStatus === 'LOW_STOCK').length;
      const distinctSkus = new Set(catItems.map((i) => i.sku)).size;

      return {
        id: cat.id,
        name: cat.name,
        skus: distinctSkus,
        units: totalUnits,
        lowStock,
      };
    });

  // 3. Low stock & Out of stock exception list
  const exceptionItems = inventory.filter(
    (i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK'
  );

  const whColumns = [
    {
      key: 'name',
      header: 'Warehouse Facility',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
          <span className="sku-code" style={{ fontSize: '10.5px', display: 'block' }}>{row.code}</span>
        </div>
      ),
    },
    {
      key: 'skus',
      header: 'SKUs Stocked',
      align: 'right',
      render: (row) => <span className="table-num">{row.skus}</span>,
    },
    {
      key: 'units',
      header: 'Physical Units',
      align: 'right',
      render: (row) => <span className="table-num" style={{ fontWeight: 700 }}>{row.units.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'lowStock',
      header: 'Low Stock',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ color: row.lowStock > 0 ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
          {row.lowStock}
        </span>
      ),
    },
    {
      key: 'outOfStock',
      header: 'Out of Stock',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ color: row.outOfStock > 0 ? '#dc2626' : '#94a3b8', fontWeight: 700 }}>
          {row.outOfStock}
        </span>
      ),
    },
    {
      key: 'utilization',
      header: 'Capacity Utilization',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{row.utilization}%</span>
          <div className="progress-track" style={{ width: '60px', height: '6px', margin: 0 }}>
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(100, row.utilization)}%`,
                backgroundColor: row.utilization > 85 ? '#ef4444' : row.utilization > 70 ? '#f59e0b' : '#3b82f6',
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  const catColumns = [
    {
      key: 'name',
      header: 'Category Segment',
      render: (row) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>,
    },
    {
      key: 'skus',
      header: 'Distinct SKUs',
      align: 'right',
      render: (row) => <span className="table-num">{row.skus}</span>,
    },
    {
      key: 'units',
      header: 'Total Units on Hand',
      align: 'right',
      render: (row) => <span className="table-num" style={{ fontWeight: 700 }}>{row.units.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'lowStock',
      header: 'Low Stock SKUs',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ color: row.lowStock > 0 ? '#d97706' : '#059669', fontWeight: 600 }}>
          {row.lowStock}
        </span>
      ),
    },
  ];

  const excColumns = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.productName}</span>
          <span className="sku-code" style={{ fontSize: '10.5px', display: 'block' }}>{row.sku}</span>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse Node',
      render: (row) => <span style={{ color: '#475569' }}>{row.warehouseName}</span>,
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: row.currentStock === 0 ? '#dc2626' : '#d97706' }}>
          {row.currentStock}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder At',
      align: 'right',
      render: (row) => <span className="table-num">{row.reorderLevel}</span>,
    },
    {
      key: 'stockStatus',
      header: 'Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Warehouse Distribution */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Inventory Distribution by Warehouse
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            Unit volume, SKU counts, and capacity utilization across storage facilities.
          </p>
        </div>
        <DataTable
          columns={whColumns}
          data={warehouseStats}
          keyExtractor={(w) => w.id}
          emptyTitle="No warehouse data"
        />
      </div>

      {/* 2. Category Distribution */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Inventory Volume by Merchandise Category
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            Stock distribution breakdown across product segments.
          </p>
        </div>
        <DataTable
          columns={catColumns}
          data={categoryStats}
          keyExtractor={(c) => c.id}
          emptyTitle="No category data"
        />
      </div>

      {/* 3. Stock Exceptions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Critical Inventory Exceptions (Low & Out of Stock)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Allocations requiring immediate supplier procurement or inter-hub transfer.
            </p>
          </div>
          <span className="nav-badge-pill" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {exceptionItems.length} Exceptions
          </span>
        </div>
        <DataTable
          columns={excColumns}
          data={exceptionItems}
          keyExtractor={(e) => e.id}
          emptyTitle="No stock exceptions"
          emptyMessage="All SKU inventory allocations are currently above reorder levels."
        />
      </div>
    </div>
  );
}
