import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Power, ArrowLeft, Tag } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import CategoryModal from '../../components/products/CategoryModal';

/**
 * Categories Management Page (/products/categories).
 */
export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, toggleCategoryStatus } = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  const handleOpenAddModal = () => {
    setCategoryToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setCategoryToEdit(cat);
    setModalOpen(true);
  };

  const handleModalSubmit = (formData) => {
    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, formData);
    } else {
      addCategory(formData);
    }
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
        <span style={{ color: '#64748b', fontSize: '12px' }}>{row.createdDate || '—'}</span>
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

      {/* Categories Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={categories}
          keyExtractor={(item) => item.id}
          emptyTitle="No categories configured"
          emptyMessage="Click 'Add Category' above to create your first product classification."
        />
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
