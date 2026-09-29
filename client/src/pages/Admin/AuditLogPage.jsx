import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 10;

const MODULE_OPTIONS = [
  'PRODUCT',
  'WAREHOUSE',
  'INVENTORY',
  'SUPPLIER',
  'PURCHASE_ORDER',
  'ORDER',
  'USER',
  'SYSTEM',
];

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
  'STOCK_ADJUSTMENT',
  'APPROVAL',
  'LOGIN',
];

export default function AuditLogPage() {
  const { auditLogs } = useAuditLogs();

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesUser = log.user?.toLowerCase().includes(q);
        const matchesEntity = log.entity?.toLowerCase().includes(q);
        const matchesDesc = log.description?.toLowerCase().includes(q);
        if (!matchesUser && !matchesEntity && !matchesDesc) return false;
      }

      if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;

      return true;
    });
  }, [auditLogs, searchQuery, moduleFilter, actionFilter, severityFilter]);

  const sortedLogs = useMemo(() => {
    const list = [...filteredLogs];
    switch (sortBy) {
      case 'oldest':
        return list.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
      case 'newest':
      default:
        return list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    }
  }, [filteredLogs, sortBy]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedLogs, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setModuleFilter('ALL');
    setActionFilter('ALL');
    setSeverityFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    moduleFilter !== 'ALL' ||
    actionFilter !== 'ALL' ||
    severityFilter !== 'ALL' ||
    sortBy !== 'newest';

  const columns = [
    {
      key: 'timestamp',
      header: 'Event Timestamp',
      width: '160px',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          {row.timestamp}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Operator',
      width: '140px',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
          {row.user}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '130px',
      render: (row) => (
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor:
              row.action === 'CREATE' ? '#ecfdf5' :
              row.action === 'APPROVAL' ? '#eff6ff' :
              row.action === 'STOCK_ADJUSTMENT' ? '#fffbeb' :
              row.action === 'STATUS_CHANGE' ? '#faf5ff' : '#f1f5f9',
            color:
              row.action === 'CREATE' ? '#047857' :
              row.action === 'APPROVAL' ? '#1d4ed8' :
              row.action === 'STOCK_ADJUSTMENT' ? '#b45309' :
              row.action === 'STATUS_CHANGE' ? '#6b21a8' : '#475569',
          }}
        >
          {row.action.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Module Scope',
      width: '130px',
      render: (row) => (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
          {row.module.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      width: '140px',
      render: (row) => (
        <div>
          <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '12px' }}>{row.entity}</span>
          <span className="sku-code" style={{ fontSize: '10px', display: 'block' }}>{row.entityId}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Audit Description',
      render: (row) => (
        <span style={{ color: '#334155', fontSize: '12.5px', lineHeight: 1.4 }}>
          {row.description}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '4px',
            backgroundColor:
              row.severity === 'WARNING' ? '#fffbeb' :
              row.severity === 'SUCCESS' ? '#ecfdf5' : '#eff6ff',
            color:
              row.severity === 'WARNING' ? '#d97706' :
              row.severity === 'SUCCESS' ? '#059669' : '#2563eb',
            border: `1px solid ${
              row.severity === 'WARNING' ? '#fde68a' :
              row.severity === 'SUCCESS' ? '#a7f3d0' : '#bfdbfe'
            }`,
          }}
        >
          {row.severity}
        </span>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="module-title">Audit Logs</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {auditLogs.length} Events
            </span>
          </div>
          <p className="module-description">
            Track operational activities, user authentication, inventory adjustments, and status progressions.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/admin" className="btn-sm btn-secondary">
            <span>Admin Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar card">
        <div className="filter-row">
          <div className="filter-search-box">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search by operator, entity, or audit description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="filter-clear-btn-inline"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-dropdowns-group">
            <div className="filter-select-wrapper">
              <label htmlFor="aud-module-select" className="filter-label">
                Module:
              </label>
              <select
                id="aud-module-select"
                className="filter-select"
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Modules</option>
                {MODULE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="aud-action-select" className="filter-label">
                Action:
              </label>
              <select
                id="aud-action-select"
                className="filter-select"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="aud-sev-select" className="filter-label">
                Severity:
              </label>
              <select
                id="aud-sev-select"
                className="filter-select"
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="SUCCESS">Success</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="aud-sort-select" className="filter-label">
                <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                Sort:
              </label>
              <select
                id="aud-sort-select"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Latest Events</option>
                <option value="oldest">Earliest Events</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-sm btn-secondary filter-reset-btn"
                onClick={handleClearFilters}
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="filter-status-bar">
          <span>
            Showing <strong>{sortedLogs.length}</strong> of <strong>{auditLogs.length}</strong> compliance events
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              <Filter size={11} /> Filters Active
            </span>
          )}
        </div>
      </div>

      {/* Logs Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedLogs}
          keyExtractor={(l) => l.id}
          emptyTitle="No audit events found"
          emptyMessage="No events match your search query and filters."
        />

        <Pagination
          currentPage={currentPage}
          totalItems={sortedLogs.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
