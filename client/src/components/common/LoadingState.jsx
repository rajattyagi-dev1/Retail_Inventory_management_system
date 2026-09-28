import React from 'react';

/**
 * Reusable LoadingState component with enterprise loading spinner.
 */
export default function LoadingState({
  message = 'Loading inventory data...',
  className = '',
}) {
  return (
    <div className={`loading-state ${className}`}>
      <div className="loading-spinner" aria-hidden="true" />
      <span className="loading-text">{message}</span>
    </div>
  );
}
