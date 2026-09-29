import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Edit3, 
  Power, 
  Layers, 
  Package,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import LoadingState from '../../components/common/LoadingState';
import ProductFilters from '../../components/products/ProductFilters';

const ITEMS_PER_PAGE = 8;

/**
 * Product List Page (/products).
 * Displays searchable, filterable, and paginated product catalog connected to Express + MySQL.
 */
export default function ProductListPage() {
  const navigate = useNavigate();
  const { 
    products, 
    categories, 
    loading, 
    error, 
    pagination, 
    fetchProducts, 
    toggleProductStatus 
  } = useProducts();

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input to avoid overwhelming API on fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Request products from backend whenever filters, search, sort, or page change
  useEffect(() => {
    let categoryId = undefined;
    if (categoryFilter !== 'All') {
      const match = categories.find((c) => c.name === categoryFilter || c.id === categoryFilter);
      if (match) {
        categoryId = match.id;
      }
    }

    let status = undefined;
    if (statusFilter !== 'All') {
      status = statusFilter.toUpperCase();
    }

    let sortField = 'createdAt';
    let sortOrder = 'desc';
    switch (sortBy) {
      case 'name-asc':
        sortField = 'name';
        sortOrder = 'asc';
        break;
      case 'name-desc':
        sortField = 'name';
        sortOrder = 'desc';
        break;
      case 'price-low':
        sortField = 'sellingPrice';
        sortOrder = 'asc';
        break;
      case 'price-high':
        sortField = 'sellingPrice';
        sortOrder = 'desc';
        break;
      case 'newest':
      default:
        sortField = 'createdAt';
        sortOrder = 'desc';
        break;
    }

    fetchProducts({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch.trim() || undefined,
      categoryId,
      status,
      sortBy: sortField,
      sortOrder,
    });
  }, [currentPage, debouncedSearch, categoryFilter, statusFilter, sortBy, categories, fetchProducts]);

  // Optional stock status filter on currently retrieved page
  const displayProducts = useMemo(() => {
    if (stockStatusFilter === 'All') return products;
    return products.filter((p) => p.stockStatus === stockStatusFilter);
  }, [products, stockStatusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCategoryFilter('All');
    setStatusFilter('All');
    setStockStatusFilter('All');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleStockStatusChange = (val) => {
    setStockStatusFilter(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Table columns definition
  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      width: '130px',
      render: (row) => (
        <span className="sku-code">{row.sku}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="product-table-thumb">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.name} className="product-table-thumb-img" />
            ) : (
              <Package size={18} color="#64748b" />
            )}
          </div>
          <div>
            <Link
              to={`/products/${row.id}`}
              className="product-table-name-link"
              title="View product details"
            >
              {row.name}
            </Link>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
              Unit: {row.unit}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span style={{ color: '#475569', fontWeight: 500 }}>
          {row.category || (row.categoryObj ? row.categoryObj.name : '—')}
        </span>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (row) => (
        <span style={{ color: '#64748b' }}>{row.brand || '—'}</span>
      ),
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="table-num" style={{ color: '#64748b' }}>
          ₹{Number(row.costPrice).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{Number(row.sellingPrice).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      width: '130px',
      render: (row) => (
        <div>
          <StatusBadge status={row.stockStatus} />
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: 2 }}>
            {row.currentStock} units
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '160px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Details"
            onClick={() => navigate(`/products/${row.id}`)}
          >
            <Eye size={15} />
          </button>

          <button
            type="button"
            className="table-action-icon-btn"
            title="Edit Product"
            onClick={() => navigate(`/products/${row.id}/edit`)}
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            className={`table-action-icon-btn ${row.status === 'Active' ? 'toggle-active' : 'toggle-inactive'}`}
            title={row.status === 'Active' ? 'Deactivate Product' : 'Activate Product'}
            onClick={() => toggleProductStatus(row.id)}
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
            <h2 className="module-title">Product Catalog</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {pagination.total} SKUs
            </span>
          </div>
          <p className="module-description">
            Manage merchandise items, pricing rules, inventory thresholds, and warehouse assignments.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/products/categories" className="btn-sm btn-secondary">
            <Layers size={15} />
            <span>Manage Categories</span>
          </Link>

          <Link to="/products/new" className="btn-sm btn-primary">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Error alert if any */}
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
            onClick={() => fetchProducts({ page: currentPage, limit: ITEMS_PER_PAGE })}
          >
            <RefreshCw size={13} style={{ marginRight: 4 }} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        stockStatusFilter={stockStatusFilter}
        onStockStatusChange={handleStockStatusChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        categories={categories}
        totalFilteredCount={pagination.total}
        totalCount={pagination.total}
      />

      {/* Products Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && products.length === 0 ? (
          <div style={{ padding: '40px 0' }}>
            <LoadingState message="Loading catalog products from database..." />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={displayProducts}
              keyExtractor={(item) => item.id}
              emptyTitle="No products match your criteria"
              emptyMessage="Try adjusting your search terms or clearing active filters."
            />

            {/* Server-driven Pagination */}
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
