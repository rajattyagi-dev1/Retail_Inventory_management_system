import React from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

/**
 * Filter and search toolbar for Product Catalog.
 */
export default function ProductFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  stockStatusFilter,
  onStockStatusChange,
  sortBy,
  onSortChange,
  onClearFilters,
  categories = [],
  totalFilteredCount,
  totalCount,
}) {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    categoryFilter !== 'All' ||
    statusFilter !== 'All' ||
    stockStatusFilter !== 'All' ||
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
            placeholder="Search by SKU, product name, or brand..."
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
          {/* Category */}
          <div className="filter-select-wrapper">
            <label htmlFor="category-select" className="filter-label">
              Category:
            </label>
            <select
              id="category-select"
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status */}
          <div className="filter-select-wrapper">
            <label htmlFor="stock-select" className="filter-label">
              Stock:
            </label>
            <select
              id="stock-select"
              className="filter-select"
              value={stockStatusFilter}
              onChange={(e) => onStockStatusChange(e.target.value)}
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Status */}
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
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
              <option value="newest">Newest First</option>
              <option value="name-asc">Name (A - Z)</option>
              <option value="name-desc">Name (Z - A)</option>
              <option value="price-low">Selling Price (Low to High)</option>
              <option value="price-high">Selling Price (High to Low)</option>
              <option value="stock-low">Stock (Lowest First)</option>
              <option value="stock-high">Stock (Highest First)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-sm btn-secondary filter-reset-btn"
              onClick={onClearFilters}
              title="Reset all search filters"
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
          Showing <strong>{totalFilteredCount}</strong> of <strong>{totalCount}</strong> products
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
