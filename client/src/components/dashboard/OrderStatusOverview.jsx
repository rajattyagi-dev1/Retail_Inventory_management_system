import React from 'react';
import SectionHeader from '../common/SectionHeader';
import { MOCK_ORDER_STATUS } from '../../utils/mockData';

/**
 * Order status overview component.
 * Displays progress breakdown for Pending, Processing, Shipped, and Delivered orders.
 */
export default function OrderStatusOverview() {
  const { total, breakdown } = MOCK_ORDER_STATUS;

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 0 20px' }}>
        <SectionHeader
          title="Order Fulfillment Pipeline"
          subtitle={`Current active order distribution (${total.toLocaleString()} total orders)`}
        />
      </div>

      <div className="order-overview-body">
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

        {/* 4 Status Breakdown Cards */}
        <div className="order-status-grid">
          {breakdown.map((item) => (
            <div key={item.label} className="order-status-card">
              <div className="order-status-label-group">
                <span
                  className="status-color-dot"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {item.percentage}% of total
                  </div>
                </div>
              </div>

              <div className="order-status-count">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
