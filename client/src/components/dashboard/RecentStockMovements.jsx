import React from 'react';
import SectionHeader from '../common/SectionHeader';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { MOCK_STOCK_MOVEMENTS } from '../../utils/mockData';

/**
 * Recent inventory transactions and stock movements.
 */
export default function RecentStockMovements() {
  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.product}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            Ref: {row.reference}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: 'Warehouse Route',
      render: (row) => <span style={{ color: '#475569' }}>{row.warehouse}</span>,
    },
    {
      key: 'type',
      header: 'Movement Type',
      width: '130px',
      render: (row) => <StatusBadge status={row.type} type="movement" />,
    },
    {
      key: 'quantity',
      header: 'Qty Impact',
      align: 'right',
      width: '120px',
      render: (row) => {
        const isNegative = row.quantity.startsWith('-');
        const isPositive = row.quantity.startsWith('+');
        return (
          <span
            className="table-num"
            style={{
              fontWeight: 600,
              color: isNegative ? '#b91c1c' : isPositive ? '#047857' : '#475569',
            }}
          >
            {row.quantity}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'Timestamp',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>{row.date}</span>
      ),
    },
  ];

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 12px 20px' }}>
        <SectionHeader
          title="Recent Stock Movements"
          subtitle="Audit ledger of inbound, outbound, transfer, and adjustments"
        />
      </div>

      <DataTable
        columns={columns}
        data={MOCK_STOCK_MOVEMENTS}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}
