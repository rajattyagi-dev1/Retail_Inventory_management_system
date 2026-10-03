import React from 'react';
import SectionHeader from '../common/SectionHeader';
import { useOrders } from '../../hooks/useOrders';

/**
 * Order status overview component.
 * Displays progress breakdown for Pending, Processing, Packed, Shipped, and Delivered orders.
 */
export default function OrderStatusOverview({ orderData }) {
  const { orders: hookOrders, loading } = useOrders();
  const orders = orderData?.orders || hookOrders || [];

  const total = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const packedCount = orders.filter((o) => o.status === 'PICKING' || o.status === 'PACKED').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const getPercentage = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

  const breakdown = [
    { label: 'Pending', count: pendingCount, percentage: getPercentage(pendingCount), color: '#f59e0b' },
    { label: 'Processing', count: processingCount, percentage: getPercentage(processingCount), color: '#3b82f6' },
    { label: 'Packed & Staged', count: packedCount, percentage: getPercentage(packedCount), color: '#8b5cf6' },
    { label: 'Shipped', count: shippedCount, percentage: getPercentage(shippedCount), color: '#06b6d4' },
    { label: 'Delivered', count: deliveredCount, percentage: getPercentage(deliveredCount), color: '#10b981' },
  ];

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 0 20px' }}>
        <SectionHeader
          title="Order Fulfillment Pipeline"
          subtitle={`Current active order distribution (${total.toLocaleString()} total orders)`}
        />
      </div>

      <div className="order-overview-body">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading fulfillment telemetry...
          </div>
        ) : total === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No customer orders recorded in pipeline yet.
          </div>
        ) : (
          <>
            {/* Proportional Stacked Bar */}
            <div className="order-stacked-bar">
              {breakdown.map((item) => (
                <div
                  key={item.label}
                  className="order-stacked-segment"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.label}: ${item.count} (${item.percentage}%)`}
                />
              ))}
            </div>

            {/* Status Breakdown Cards */}
            <div className="order-status-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
              {breakdown.map((item) => (
                <div key={item.label} className="order-status-card">
                  <div className="order-status-label-group">
                    <span
                      className="status-color-dot"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                        {item.percentage}% of total
                      </div>
                    </div>
                  </div>

                  <div className="order-status-count" style={{ fontSize: '16px' }}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
