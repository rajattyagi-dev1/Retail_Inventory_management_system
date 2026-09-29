import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Tag } from 'lucide-react';

function CategoryModalDialog({
  onClose,
  onSubmit,
  categoryToEdit = null,
}) {
  const [formData, setFormData] = useState({
    name: categoryToEdit?.name || '',
    description: categoryToEdit?.description || '',
    status: categoryToEdit?.status || 'Active',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Category name is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="form-section-icon" style={{ width: 32, height: 32 }}>
              <Tag size={16} />
            </div>
            <div>
              <h3 className="modal-title">
                {categoryToEdit ? 'Edit Category' : 'Add New Category'}
              </h3>
              <p className="modal-subtitle">
                {categoryToEdit
                  ? `Update taxonomy properties for ${categoryToEdit.name}`
                  : 'Define a new product classification group'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-field full-width">
              <label htmlFor="cat-name" className="form-label required">
                Category Name
              </label>
              <input
                type="text"
                id="cat-name"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. Smart Wearables"
                value={formData.name}
                onChange={handleChange}
                autoFocus
              />
              {errors.name && (
                <span className="form-error-msg">
                  <AlertCircle size={12} /> {errors.name}
                </span>
              )}
            </div>

            <div className="form-field full-width">
              <label htmlFor="cat-desc" className="form-label">
                Description
              </label>
              <textarea
                id="cat-desc"
                name="description"
                rows={3}
                className="form-textarea"
                placeholder="Brief summary of products falling under this category..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="cat-status" className="form-label">
                Category Status
              </label>
              <select
                id="cat-status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-sm btn-primary">
              <CheckCircle2 size={15} />
              <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal dialog for Creating or Editing Product Categories.
 */
export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categoryToEdit = null,
}) {
  if (!isOpen) return null;

  return (
    <CategoryModalDialog
      key={categoryToEdit?.id || 'new-category'}
      onClose={onClose}
      onSubmit={onSubmit}
      categoryToEdit={categoryToEdit}
    />
  );
}
