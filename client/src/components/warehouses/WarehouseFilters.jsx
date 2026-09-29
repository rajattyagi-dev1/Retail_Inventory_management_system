import React from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

/**
 * Filter and search toolbar for Warehouse List.
 */
export default function WarehouseFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  stateFilter,
  onStateChange,
  sortBy,
  onSortChange,
  onClearFilters,
  availableStates = [],
  totalFilteredCount,
  totalCount,
}) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'ALL' ||
    stateFilter !== 'ALL' ||
    sortBy !== 'newest';

  return (
    <div className="filter-toolbar card">
      <div className="filter-row">
        {/* Search Input */}
        <div className="filter-search-box">
          <Search size={16} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by warehouse name, code, city, or manager..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="filter-clear-btn-inline"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="filter-dropdowns-group">
          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="status-select" className="filter-label">
              Status:
            </label>
            <select
              id="status-select"
              className="filter-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* State / Region Filter */}
          <div className="filter-select-wrapper">
            <label htmlFor="state-select" className="filter-label">
              State / Region:
            </label>
            <select
              id="state-select"
              className="filter-select"
              value={stateFilter}
              onChange={(e) => onStateChange(e.target.value)}
            >
              <option value="ALL">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="filter-select-wrapper">
            <label htmlFor="sort-select" className="filter-label">
              <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
              Sort:
            </label>
            <select
              id="sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="newest">Recently Added</option>
              <option value="name-asc">Name (A - Z)</option>
              <option value="name-desc">Name (Z - A)</option>
              <option value="capacity-high">Capacity (High to Low)</option>
              <option value="capacity-low">Capacity (Low to High)</option>
              <option value="stock-high">Current Stock (High to Low)</option>
              <option value="stock-low">Current Stock (Low to High)</option>
              <option value="utilization-high">Utilization (Highest First)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-sm btn-secondary filter-reset-btn"
              onClick={onClearFilters}
              title="Reset all filters"
            >
              <X size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta feedback line */}
      <div className="filter-status-bar">
        <span>
          Showing <strong>{totalFilteredCount}</strong> of <strong>{totalCount}</strong> warehouses
        </span>
        {hasActiveFilters && (
          <span className="filter-active-pill">
            <Filter size={11} /> Filters Active
          </span>
        )}
      </div>
    </div>
  );
}
