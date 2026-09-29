import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit3,
  Power,
  Warehouse,
  MapPin,
  User,
} from 'lucide-react';
import { useWarehouses } from '../../hooks/useWarehouses';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import WarehouseFilters from '../../components/warehouses/WarehouseFilters';

const ITEMS_PER_PAGE = 8;

/**
 * Warehouse List Page (/warehouses).
 * Displays searchable, filterable, and paginated warehouse locations with live utilization metrics.
 */
export default function WarehouseListPage() {
  const navigate = useNavigate();
  const { warehouses, toggleWarehouseStatus } = useWarehouses();

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Derive unique states for filter dropdown
  const availableStates = useMemo(() => {
    const states = new Set(warehouses.map((w) => w.state).filter(Boolean));
    return Array.from(states).sort();
  }, [warehouses]);

  // Client-side filtering logic
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      // 1. Full text search across name, code, city, and manager
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = wh.name?.toLowerCase().includes(q);
        const matchesCode = wh.code?.toLowerCase().includes(q);
        const matchesCity = wh.city?.toLowerCase().includes(q);
        const matchesManager = wh.managerName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCity && !matchesManager) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL' && wh.status !== statusFilter) {
        return false;
      }

      // 3. State filter
      if (stateFilter !== 'ALL' && wh.state !== stateFilter) {
        return false;
      }

      return true;
    });
  }, [warehouses, searchQuery, statusFilter, stateFilter]);

  // Client-side sorting logic
  const sortedWarehouses = useMemo(() => {
    const list = [...filteredProductsList(filteredWarehouses)];
    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'capacity-high':
        return list.sort((a, b) => b.capacity - a.capacity);
      case 'capacity-low':
        return list.sort((a, b) => a.capacity - b.capacity);
      case 'stock-high':
        return list.sort((a, b) => b.currentStock - a.currentStock);
      case 'stock-low':
        return list.sort((a, b) => a.currentStock - b.currentStock);
      case 'utilization-high':
        return list.sort(
          (a, b) => (b.currentStock / b.capacity) - (a.currentStock / a.capacity)
        );
      case 'newest':
      default:
        return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  }, [filteredWarehouses, sortBy]);

  function filteredProductsList(items) {
    return items;
  }

  // Pagination slice
  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedWarehouses.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedWarehouses, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
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
            {row.city}
          </span>
          <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>
            {row.state} - {row.pincode}
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
            {row.managerName}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            {row.managerPhone}
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
                {(row.capacity - row.currentStock).toLocaleString('en-IN')} free
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
              {warehouses.length} Locations
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
        totalFilteredCount={sortedWarehouses.length}
        totalCount={warehouses.length}
      />

      {/* Warehouses Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedWarehouses}
          keyExtractor={(item) => item.id}
          emptyTitle="No warehouses match your search"
          emptyMessage="Try adjusting your search terms or clearing state and status filters."
        />

        {/* Client-side Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedWarehouses.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
