import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useWarehouses } from '../../hooks/useWarehouses';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 10;

const MOVEMENT_TYPES = [
  'RECEIPT',
  'SALE',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RETURN',
];

/**
 * Stock Movements Ledger Page (/inventory/movements).
 * Complete audit trail of inventory receipts, dispatches, adjustments, and transfers.
 */
export default function StockMovementPage() {
  const { stockMovements } = useInventory();
  const { warehouses } = useWarehouses();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Client-side filtering
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((mov) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProduct = mov.productName?.toLowerCase().includes(q);
        const matchesSku = mov.sku?.toLowerCase().includes(q);
        const matchesRef = mov.reference?.toLowerCase().includes(q);
        const matchesUser = mov.performedBy?.toLowerCase().includes(q);
        const matchesWh = mov.warehouseName?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesSku && !matchesRef && !matchesUser && !matchesWh) {
          return false;
        }
      }

      // 2. Type filter
      if (typeFilter !== 'ALL' && mov.type !== typeFilter) {
        return false;
      }

      // 3. Warehouse filter
      if (warehouseFilter !== 'ALL' && mov.warehouseName !== warehouseFilter) {
        return false;
      }

      return true;
    });
  }, [stockMovements, searchQuery, typeFilter, warehouseFilter]);

  // Client-side sorting
  const sortedMovements = useMemo(() => {
    const list = [...filteredMovements];
    switch (sortBy) {
      case 'qty-high':
        return list.sort((a, b) => b.quantity - a.quantity);
      case 'qty-low':
        return list.sort((a, b) => a.quantity - b.quantity);
      case 'product-asc':
        return list.sort((a, b) => a.productName.localeCompare(b.productName));
      case 'newest':
      default:
        return list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    }
  }, [filteredMovements, sortBy]);

  // Pagination slice
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedMovements.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedMovements, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setWarehouseFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Table columns definition
  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '140px',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748b' }}>{row.timestamp}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.productName}</span>
          <span className="sku-code" style={{ display: 'inline-block', marginLeft: 6 }}>
            {row.sku}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#334155' }}>{row.warehouseName}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            {row.warehouseCode}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Movement Type',
      width: '140px',
      render: (row) => <StatusBadge status={row.type} type="movement" />,
    },
    {
      key: 'quantity',
      header: 'Quantity Impact',
      align: 'right',
      width: '130px',
      render: (row) => {
        const isPos = row.quantity > 0;
        const isNeg = row.quantity < 0;
        return (
          <span
            className="table-num"
            style={{
              fontWeight: 700,
              color: isPos ? '#047857' : isNeg ? '#b91c1c' : '#475569',
              backgroundColor: isPos ? '#ecfdf5' : isNeg ? '#fef2f2' : 'transparent',
              padding: '2px 8px',
              borderRadius: '4px',
              border: `1px solid ${isPos ? '#a7f3d0' : isNeg ? '#fecaca' : 'transparent'}`,
            }}
          >
            {isPos ? `+${row.quantity}` : row.quantity} units
          </span>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference',
      width: '130px',
      render: (row) => (
        <span className="sku-code" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
          {row.reference || '—'}
        </span>
      ),
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      width: '140px',
      render: (row) => (
        <span style={{ color: '#334155', fontWeight: 500 }}>{row.performedBy}</span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes / Reason',
      render: (row) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>{row.notes || '—'}</span>
      ),
    },
  ];

  const hasActiveFilters =
    Boolean(searchQuery) ||
    typeFilter !== 'ALL' ||
    warehouseFilter !== 'ALL' ||
    sortBy !== 'newest';

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <Link to="/inventory" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Inventory</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
            <h2 className="module-title">Stock Movements</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {stockMovements.length} Logged Entries
            </span>
          </div>
          <p className="module-description">
            Track inventory receipts, sales, transfers, returns and adjustments across national fulfillment nodes.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/inventory" className="btn-sm btn-secondary">
            <span>Inventory Master</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar card">
        <div className="filter-row">
          {/* Search Box */}
          <div className="filter-search-box">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search by product, SKU, reference or person..."
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

          {/* Filter Dropdowns */}
          <div className="filter-dropdowns-group">
            {/* Movement Type Filter */}
            <div className="filter-select-wrapper">
              <label htmlFor="mov-type-select" className="filter-label">
                Type:
              </label>
              <select
                id="mov-type-select"
                className="filter-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Types</option>
                {MOVEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <div className="filter-select-wrapper">
              <label htmlFor="mov-wh-select" className="filter-label">
                Warehouse:
              </label>
              <select
                id="mov-wh-select"
                className="filter-select"
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="filter-select-wrapper">
              <label htmlFor="mov-sort-select" className="filter-label">
                <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                Sort:
              </label>
              <select
                id="mov-sort-select"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Latest First</option>
                <option value="qty-high">Quantity (Highest First)</option>
                <option value="qty-low">Quantity (Lowest First)</option>
                <option value="product-asc">Product Name (A - Z)</option>
              </select>
            </div>

            {/* Clear Filters */}
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

        {/* Filter Summary Status */}
        <div className="filter-status-bar">
          <span>
            Showing <strong>{sortedMovements.length}</strong> of <strong>{stockMovements.length}</strong> movement records
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              <Filter size={11} /> Filters Active
            </span>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedMovements}
          keyExtractor={(m) => m.id}
          emptyTitle="No stock movements match your criteria"
          emptyMessage="Try adjusting your filter options or clearing search terms."
        />

        {/* Client-side Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedMovements.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
