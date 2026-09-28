import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Reusable EmptyState component for empty lists, search results, or tables.
 */
export default function EmptyState({
  title = 'No data available',
  message = 'No records match the current filters or selection.',
  icon: Icon = Inbox,
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={44} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
