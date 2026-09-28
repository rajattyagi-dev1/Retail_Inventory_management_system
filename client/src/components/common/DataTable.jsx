import React from 'react';
import EmptyState from './EmptyState';

/**
 * Reusable DataTable component for enterprise tabular views.
 * 
 * @param {Array} columns - Array of column objects: { key, header, render, align, width }
 * @param {Array} data - Array of row data items
 * @param {Function} keyExtractor - Function returning unique key for each row
 * @param {string} emptyTitle - Optional title for empty table
 * @param {string} emptyMessage - Optional message for empty table
 */
export default function DataTable({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  emptyTitle = 'No records found',
  emptyMessage = 'There is currently no data to display for this view.',
  className = '',
}) {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className={`table-responsive-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.header}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={keyExtractor(row, index)}>
              {columns.map((col) => (
                <td
                  key={col.key || col.header}
                  style={{
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.render ? col.render(row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
