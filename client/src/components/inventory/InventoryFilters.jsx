import React from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

/**
 * Filter and search toolbar for Inventory Management.
 */
export default function InventoryFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  warehouseFilter,
  onWarehouseChange,
  categoryFilter,
  onCategoryChange,
  availabilityFilter,
  onAvailabilityChange,
  sortBy,
  onSortChange,
  onClearFilters,
  warehouses = [],
  categories = [],
  totalFilteredCount,
  totalCount,
}) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'ALL' ||
    warehouseFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    availabilityFilter !== 'ALL' ||
    sortBy !== 'product-asc';

  return (
    <div className="filter-toolbar card">
      <div className="filter-row">
        {/* Search Input */}
        <div className="filter-search-box">
          <Search size={16} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by product, SKU, warehouse name or code..."
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

        {/* Filter Dropdowns Group */}
        <div className="filter-dropdowns-group">
          {/* Stock Status */}
          <div className="filter-select-wrapper">
            <label htmlFor="inv-status-select" className="filter-label">
              Status:
            </label>
            <select
              id="inv-status-select"
              className="filter-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Warehouse */}
          <div className="filter-select-wrapper">
            <label htmlFor="inv-wh-select" className="filter-label">
              Warehouse:
            </label>
            <select
              id="inv-wh-select"
              className="filter-select"
              value={warehouseFilter}
              onChange={(e) => onWarehouseChange(e.target.value)}
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id || wh.code} value={wh.name}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="filter-select-wrapper">
            <label htmlFor="inv-cat-select" className="filter-label">
              Category:
            </label>
            <select
              id="inv-cat-select"
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.name || c} value={c.name || c}>
                  {c.name || c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div className="filter-select-wrapper">
            <label htmlFor="inv-avail-select" className="filter-label">
              Availability:
            </label>
            <select
              id="inv-avail-select"
              className="filter-select"
              value={availabilityFilter}
              onChange={(e) => onAvailabilityChange(e.target.value)}
            >
              <option value="ALL">All Stock Levels</option>
              <option value="HAS_STOCK">In-Stock Only (&gt;0)</option>
              <option value="NO_STOCK">Zero Stock (=0)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="filter-select-wrapper">
            <label htmlFor="inv-sort-select" className="filter-label">
              <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
              Sort:
            </label>
            <select
              id="inv-sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="product-asc">Product Name (A - Z)</option>
              <option value="product-desc">Product Name (Z - A)</option>
              <option value="stock-high">Current Stock (High to Low)</option>
              <option value="stock-low">Current Stock (Low to High)</option>
              <option value="avail-high">Available Stock (High to Low)</option>
              <option value="avail-low">Available Stock (Low to High)</option>
              <option value="warehouse-asc">Warehouse Name</option>
              <option value="recent">Last Updated</option>
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

      {/* Status Bar */}
      <div className="filter-status-bar">
        <span>
          Showing <strong>{totalFilteredCount}</strong> of <strong>{totalCount}</strong> inventory records
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
