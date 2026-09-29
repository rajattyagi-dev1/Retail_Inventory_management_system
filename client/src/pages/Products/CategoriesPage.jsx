import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Power, ArrowLeft, Tag, Search, X } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import CategoryModal from '../../components/products/CategoryModal';

/**
 * Categories Management Page (/products/categories).
 * Connects to GET, POST, PUT, PATCH /api/categories with real MySQL persistence.
 */
export default function CategoriesPage() {
  const { 
    categories, 
    categoriesLoading, 
    fetchCategories, 
    createCategory, 
    updateCategory, 
    toggleCategoryStatus 
  } = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories({
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== 'All' ? statusFilter.toUpperCase() : undefined,
      limit: 100,
    });
  }, [debouncedSearch, statusFilter, fetchCategories]);

  const handleOpenAddModal = () => {
    setCategoryToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setCategoryToEdit(cat);
    setModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (categoryToEdit) {
      await updateCategory(categoryToEdit.id, formData);
    } else {
      await createCategory(formData);
    }
    // Refresh list to sync counts and ordering
    fetchCategories({
      search: debouncedSearch.trim() || undefined,
      status: statusFilter !== 'All' ? statusFilter.toUpperCase() : undefined,
      limit: 100,
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="category-bullet-icon">
            <Tag size={14} />
          </div>
          <div>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span style={{ color: '#475569', fontSize: '12.5px' }}>
          {row.description || 'No description provided'}
        </span>
      ),
    },
    {
      key: 'productCount',
      header: 'Assigned Products',
      align: 'right',
      width: '160px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 600, color: '#0f172a' }}>
          {row.productCount} {row.productCount === 1 ? 'product' : 'products'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'createdDate',
      header: 'Created Date',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          {row.createdDate || (row.createdAt ? row.createdAt.split('T')[0] : '—')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '130px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="Edit Category"
            onClick={() => handleOpenEditModal(row)}
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            className={`table-action-icon-btn ${row.status === 'Active' ? 'toggle-active' : 'toggle-inactive'}`}
            title={row.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
            onClick={() => toggleCategoryStatus(row.id)}
          >
            <Power size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Module Header */}
      <div className="module-header-container">
        <div>
          <Link to="/products" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
            <h2 className="module-title">Product Categories</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {categories.length} Taxonomies
            </span>
          </div>
          <p className="module-description">
            Organize catalog products into hierarchical business classifications and merchandising categories.
          </p>
        </div>

        <div className="module-actions-group">
          <button
            type="button"
            className="btn-sm btn-primary"
            onClick={handleOpenAddModal}
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar for Categories */}
      <div className="filter-toolbar card" style={{ marginBottom: '16px' }}>
        <div className="filter-row">
          <div className="filter-search-box">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="filter-clear-btn-inline"
                onClick={() => setSearchQuery('')}
                aria-label="Clear category search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-dropdowns-group">
            <div className="filter-select-wrapper">
              <label htmlFor="cat-filter-status" className="filter-label">
                Status:
              </label>
              <select
                id="cat-filter-status"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(Boolean(searchQuery) || statusFilter !== 'All') && (
              <button
                type="button"
                className="btn-sm btn-secondary filter-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {categoriesLoading && categories.length === 0 ? (
          <div style={{ padding: '40px 0' }}>
            <LoadingState message="Loading categories from database..." />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={categories}
            keyExtractor={(item) => item.id}
            emptyTitle="No categories configured"
            emptyMessage="Click 'Add Category' above to create your first product classification."
          />
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
}
