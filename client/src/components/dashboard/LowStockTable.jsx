import React from 'react';
import SectionHeader from '../common/SectionHeader';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { MOCK_LOW_STOCK_PRODUCTS } from '../../utils/mockData';

/**
 * Low stock products monitoring table.
 */
export default function LowStockTable() {
  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      width: '120px',
      render: (row) => <span className="sku-code">{row.sku}</span>,
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span style={{ color: '#475569' }}>{row.category}</span>
      ),
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (row) => (
        <span style={{ color: '#64748b' }}>{row.warehouse}</span>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span 
          className="table-num"
          style={{
            fontWeight: 700,
            color: row.currentStock === 0 ? '#ef4444' : '#d97706',
          }}
        >
          {row.currentStock} units
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ color: '#64748b' }}>
          {row.reorderLevel} units
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 12px 20px' }}>
        <SectionHeader
          title="Low Stock Alert Monitor"
          subtitle="Products at or below configured inventory reorder thresholds"
          badge={`${MOCK_LOW_STOCK_PRODUCTS.length} Critical Items`}
        />
      </div>

      <DataTable
        columns={columns}
        data={MOCK_LOW_STOCK_PRODUCTS}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}
