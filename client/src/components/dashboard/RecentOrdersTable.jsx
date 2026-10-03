import React from 'react';
import SectionHeader from '../common/SectionHeader';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { useOrders } from '../../hooks/useOrders';

/**
 * Recent sales orders table.
 */
export default function RecentOrdersTable() {
  const { orders, loading } = useOrders();

  const displayData = (orders || []).slice(0, 5).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.customerName,
    itemsCount: (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0),
    amount: `₹${(o.totalAmount || 0).toLocaleString('en-IN')}`,
    status: o.status,
    date: o.orderDate,
  }));
  const columns = [
    {
      key: 'orderNumber',
      header: 'Order Number',
      width: '140px',
      render: (row) => (
        <span className="sku-code" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer / Client',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.customer}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            {row.itemsCount} total units
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Order Value',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 600, color: '#0f172a' }}>
          {row.amount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>{row.date}</span>
      ),
    },
  ];

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 12px 20px' }}>
        <SectionHeader
          title="Recent Orders"
          subtitle="Latest retail distribution and client fulfillment requests"
        />
      </div>

      <DataTable
        columns={columns}
        data={displayData}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyTitle="No recent orders"
        emptyMessage="No customer sales orders have been placed yet."
      />
    </div>
  );
}
