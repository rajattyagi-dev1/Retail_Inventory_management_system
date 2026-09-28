import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Construction, LayoutDashboard, Layers } from 'lucide-react';

/**
 * Reusable Placeholder Page for modules scheduled in upcoming development sprints.
 */
export default function PlaceholderPage({ title, moduleCode }) {
  const location = useLocation();

  const formattedName = title || location.pathname.substring(1).replace('-', ' ');
  const displayName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);

  return (
    <div className="placeholder-page">
      <div className="placeholder-badge">
        <Construction size={14} />
        <span>Module Scheduled for Next Phase</span>
      </div>

      <h2 className="placeholder-title">{displayName} Module</h2>
      <p className="placeholder-desc">
        The application shell and layout for <strong>{displayName}</strong> is prepared. Full data tables,
        CRUD operations, business workflows, and backend API integration will be implemented in subsequent phases.
      </p>

      <div className="placeholder-details-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600 }}>
          <Layers size={16} color="#2563eb" />
          <span>Architecture & Route Metadata:</span>
        </div>
        <div><strong>Current Route:</strong> <code>{location.pathname}</code></div>
        <div><strong>Status:</strong> Scaffolding Active (Frontend Shell Phase 2A)</div>
        <div><strong>Backend API:</strong> Not connected (Mock phase active)</div>
        {moduleCode && <div><strong>Module Identifier:</strong> <code>{moduleCode}</code></div>}
      </div>

      <div className="placeholder-actions">
        <Link to="/dashboard" className="btn-sm btn-primary">
          <LayoutDashboard size={15} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
