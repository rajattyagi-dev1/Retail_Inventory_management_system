import React from 'react';

/**
 * Reusable StatusBadge component for enterprise inventory and order states.
 * 
 * Supported statuses:
 * - Inventory: 'In Stock', 'Low Stock', 'Out of Stock'
 * - Orders: 'Pending', 'Processing', 'Shipped', 'Delivered'
 * - Movements: 'Inbound', 'Outbound', 'Transfer', 'Adjustment'
 */
export default function StatusBadge({ status, type = 'status', className = '' }) {
  if (!status) return null;

  // Handle stock movements
  if (type === 'movement') {
    const movementClass = status.toLowerCase().replace(/[\s_]+/g, '-');
    const displayLabel = status.includes('_')
      ? status
          .toLowerCase()
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    return (
      <span className={`movement-badge ${movementClass} ${className}`}>
        {displayLabel}
      </span>
    );
  }

  // Handle standard status badges
  const normalizedStatus = status.toLowerCase().replace(/[\s_]+/g, '-');
  const displayLabel = status.includes('_')
    ? status
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : status;

  return (
    <span className={`status-badge ${normalizedStatus} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
