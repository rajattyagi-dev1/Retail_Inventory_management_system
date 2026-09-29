import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit3,
  Power,
  Warehouse,
  MapPin,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useWarehouses } from '../../hooks/useWarehouses';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import LoadingState from '../../components/common/LoadingState';
import WarehouseFilters from '../../components/warehouses/WarehouseFilters';

const ITEMS_PER_PAGE = 8;

/**
 * Warehouse List Page (/warehouses).
 * Displays searchable, filterable, and server-paginated warehouse locations directly from MySQL.
 */
export default function WarehouseListPage() {
  const navigate = useNavigate();
  const { 
    warehouses, 
    loading, 
    error, 
    pagination, 
    fetchWarehouses, 
    toggleWarehouseStatus 
  } = useWarehouses();

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query to avoid excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Request warehouses from server when pagination or filters change
  useEffect(() => {
    let sortField = 'createdAt';
    let sortDirection = 'desc';

    switch (sortBy) {
      case 'name-asc':
        sortField = 'name';
        sortDirection = 'asc';
        break;
      case 'name-desc':
        sortField = 'name';
        sortDirection = 'desc';
        break;
      case 'capacity-high':
        sortField = 'capacity';
        sortDirection = 'desc';
        break;
      case 'capacity-low':
        sortField = 'capacity';
        sortDirection = 'asc';
        break;
      case 'newest':
      default:
        sortField = 'createdAt';
        sortDirection = 'desc';
        break;
    }

    fetchWarehouses({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      sortBy: sortField,
      sortOrder: sortDirection,
    });
  }, [currentPage, debouncedSearch, statusFilter, sortBy, fetchWarehouses]);

  // Derive unique states for filter dropdown
  const availableStates = useMemo(() => {
    const states = new Set(warehouses.map((w) => w.state).filter(Boolean));
    return Array.from(states).sort();
  }, [warehouses]);

  // Optional state filter on currently retrieved page
  const displayWarehouses = useMemo(() => {
    if (stateFilter === 'ALL') return warehouses;
    return warehouses.filter((wh) => wh.state === stateFilter);
  }, [warehouses, stateFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setStateFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleStateChange = (val) => {
    setStateFilter(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Table columns definition
  const columns = [
    {
      key: 'name',
      header: 'Warehouse',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="product-table-thumb" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Warehouse size={18} />
          </div>
          <div>
            <Link
              to={`/warehouses/${row.id}`}
              className="product-table-name-link"
              title="View warehouse details"
            >
              {row.name}
            </Link>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
              Staff: {row.staffCount} members
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      width: '130px',
      render: (row) => <span className="sku-code">{row.code}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} style={{ color: '#64748b' }} />
            {row.city || '—'}
          </span>
          <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>
            {row.state ? `${row.state} - ${row.pincode || ''}` : row.pincode || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={12} style={{ color: '#64748b' }} />
            {row.managerName || (row.manager ? row.manager.name : '—')}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            {row.managerPhone || row.managerEmail || (row.manager ? row.manager.email : '—')}
          </span>
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ color: '#64748b' }}>
          {Number(row.capacity).toLocaleString('en-IN')} units
        </span>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          {Number(row.currentStock).toLocaleString('en-IN')} units
        </span>
      ),
    },
    {
      key: 'utilization',
      header: 'Utilization',
      width: '150px',
      render: (row) => {
        const pct = row.capacity > 0 ? Math.round((row.currentStock / row.capacity) * 100) : 0;
        let barColor = '#3b82f6';
        let badgeBg = '#eff6ff';
        let badgeColor = '#1d4ed8';

        if (pct >= 90) {
          barColor = '#ef4444';
          badgeBg = '#fef2f2';
          badgeColor = '#b91c1c';
        } else if (pct >= 75) {
          barColor = '#f59e0b';
          badgeBg = '#fffbeb';
          badgeColor = '#b45309';
        }

        return (
          <div style={{ width: '100%', minWidth: '110px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {pct}%
              </span>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                {Math.max(0, row.capacity - row.currentStock).toLocaleString('en-IN')} free
              </span>
            </div>
            <div className="progress-track" style={{ height: '6px', margin: 0 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(100, pct)}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '140px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Warehouse Details"
            onClick={() => navigate(`/warehouses/${row.id}`)}
          >
            <Eye size={15} />
          </button>

          <button
            type="button"
            className="table-action-icon-btn"
            title="Edit Warehouse"
            onClick={() => navigate(`/warehouses/${row.id}/edit`)}
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            className={`table-action-icon-btn ${row.status === 'ACTIVE' ? 'toggle-active' : 'toggle-inactive'}`}
            title={row.status === 'ACTIVE' ? 'Deactivate Warehouse' : 'Activate Warehouse'}
            onClick={() => toggleWarehouseStatus(row.id)}
          >
            <Power size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Header Area */}
      <div className="module-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="module-title">Warehouses</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {pagination.total} Locations
            </span>
          </div>
          <p className="module-description">
            Manage warehouse locations, capacity, staff and inventory.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/warehouses/new" className="btn-sm btn-primary">
            <Plus size={16} />
            <span>Add Warehouse</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#991b1b',
          fontSize: '13.5px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-sm btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => fetchWarehouses({ page: currentPage, limit: ITEMS_PER_PAGE })}
          >
            <RefreshCw size={13} style={{ marginRight: 4 }} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <WarehouseFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        stateFilter={stateFilter}
        onStateChange={handleStateChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        availableStates={availableStates}
        totalFilteredCount={pagination.total}
        totalCount={pagination.total}
      />

      {/* Warehouses Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && warehouses.length === 0 ? (
          <div style={{ padding: '40px 0' }}>
            <LoadingState message="Loading warehouses from database..." />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={displayWarehouses}
              keyExtractor={(item) => item.id}
              emptyTitle="No warehouses match your search"
              emptyMessage="Try adjusting your search terms or clearing state and status filters."
            />

            {/* Server-side Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={pagination.total}
              pageSize={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </div>
  );
}
