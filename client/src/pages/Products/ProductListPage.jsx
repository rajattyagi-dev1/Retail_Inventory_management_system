import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Edit3, 
  Power, 
  Layers, 
  Package,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import ProductFilters from '../../components/products/ProductFilters';

const ITEMS_PER_PAGE = 8;

/**
 * Product List Page (/products).
 * Displays searchable, filterable, and paginated product catalog with instant state actions.
 */
export default function ProductListPage() {
  const navigate = useNavigate();
  const { products, categories, toggleProductStatus } = useProducts();

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Client-side filtering logic
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Text search across SKU, Name, and Brand
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSku = prod.sku?.toLowerCase().includes(q);
        const matchesName = prod.name?.toLowerCase().includes(q);
        const matchesBrand = prod.brand?.toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesBrand) return false;
      }

      // 2. Category filter
      if (categoryFilter !== 'All' && prod.category !== categoryFilter) {
        return false;
      }

      // 3. Status filter (Active / Inactive)
      if (statusFilter !== 'All' && prod.status !== statusFilter) {
        return false;
      }

      // 4. Stock status filter
      if (stockStatusFilter !== 'All' && prod.stockStatus !== stockStatusFilter) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, stockStatusFilter]);

  // Client-side sorting logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-low':
        return list.sort((a, b) => a.sellingPrice - b.sellingPrice);
      case 'price-high':
        return list.sort((a, b) => b.sellingPrice - a.sellingPrice);
      case 'stock-low':
        return list.sort((a, b) => a.currentStock - b.currentStock);
      case 'stock-high':
        return list.sort((a, b) => b.currentStock - a.currentStock);
      case 'newest':
      default:
        // By created date descending or id
        return list.sort((a, b) => (b.createdDate || '').localeCompare(a.createdDate || ''));
    }
  }, [filteredProducts, sortBy]);

  // Pagination slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
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
        <span style={{ color: '#475569', fontWeight: 500 }}>{row.category}</span>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (row) => (
        <span style={{ color: '#64748b' }}>{row.brand}</span>
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
              {products.length} SKUs
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
        totalFilteredCount={sortedProducts.length}
        totalCount={products.length}
      />

      {/* Products Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedProducts}
          keyExtractor={(item) => item.id}
          emptyTitle="No products match your criteria"
          emptyMessage="Try adjusting your search terms or clearing active filters."
        />

        {/* Client-side Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedProducts.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
