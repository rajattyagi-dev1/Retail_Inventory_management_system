import React from 'react';

/**
 * Reusable SectionHeader component for card titles, section labels, and action slots.
 */
export default function SectionHeader({
  title,
  subtitle,
  actions,
  badge,
  className = '',
}) {
  return (
    <div className={`section-header ${className}`}>
      <div className="section-title-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 className="section-title">{title}</h2>
          {badge && <span className="nav-badge-pill" style={{ color: '#475569', background: '#f1f5f9' }}>{badge}</span>}
        </div>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="section-actions">{actions}</div>}
    </div>
  );
}
