import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  IndianRupee, 
  Boxes, 
  UploadCloud, 
  AlertCircle, 
  Image as ImageIcon,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react';

const UNIT_OPTIONS = [
  'Pieces',
  'Boxes',
  'Sets',
  'Packs',
  'Kg',
  'Units',
  'Pairs',
];

/**
 * Reusable ProductForm component for Add and Edit Product flows.
 * 
 * @param {object} initialData - Pre-populated product data (for Edit mode)
 * @param {boolean} isEditMode - True if editing an existing product
 * @param {array} categories - List of available category objects from backend
 * @param {function} onSubmit - Submit handler passing validated form data
 * @param {boolean} isSubmitting - Whether save action is in flight
 * @param {string} apiError - Server-side error message if submission failed
 */
export default function ProductForm({
  initialData = {},
  isEditMode = false,
  categories = [],
  onSubmit,
  isSubmitting = false,
  apiError = null,
}) {
  const navigate = useNavigate();

  const getInitialCategoryId = () => {
    if (initialData.categoryId) return initialData.categoryId;
    if (initialData.category) {
      const match = categories.find((c) => c.name === initialData.category);
      if (match) return match.id;
    }
    return categories[0]?.id || '';
  };

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    sku: initialData.sku || '',
    categoryId: getInitialCategoryId(),
    category: initialData.category || '',
    brand: initialData.brand || '',
    description: initialData.description || '',
    costPrice: initialData.costPrice !== undefined ? String(initialData.costPrice) : '',
    sellingPrice: initialData.sellingPrice !== undefined ? String(initialData.sellingPrice) : '',
    unit: initialData.unit || 'Pieces',
    reorderLevel: initialData.reorderLevel !== undefined ? String(initialData.reorderLevel) : '10',
    currentStock: initialData.currentStock !== undefined ? String(initialData.currentStock) : '0',
    status: initialData.status === 'Inactive' || initialData.status === 'INACTIVE' ? 'Inactive' : 'Active',
    imageUrl: initialData.imageUrl || '',
  });

  const [errors, setErrors] = useState({});
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(initialData.imageUrl || '');

  const effectiveCategoryId = formData.categoryId ||
    initialData.categoryId ||
    (categories.find((c) => c.name === initialData.category)?.id) ||
    (categories[0]?.id || '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'categoryId') {
        const cat = categories.find((c) => c.id === value);
        updated.category = cat ? cat.name : '';
      }
      return updated;
    });

    // Clear specific error on edit
    if (errors[name] || (name === 'categoryId' && errors.category)) {
      setErrors((prev) => ({ ...prev, [name]: null, category: null, categoryId: null }));
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setFormData((prev) => ({ ...prev, imageUrl: objectUrl }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Product name is required.';
    }

    if (!formData.sku.trim()) {
      errs.sku = 'SKU is required.';
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.sku.trim())) {
      errs.sku = 'SKU should only contain letters, numbers, hyphens, and underscores.';
    }

    const activeCatId = formData.categoryId || effectiveCategoryId;
    if (!activeCatId) {
      errs.categoryId = 'Category selection is required.';
    }

    if (!formData.brand.trim()) {
      errs.brand = 'Brand name is required.';
    }

    const costNum = parseFloat(formData.costPrice);
    if (formData.costPrice === '' || isNaN(costNum) || costNum < 0) {
      errs.costPrice = 'Enter a valid non-negative cost price (₹).';
    }

    const sellNum = parseFloat(formData.sellingPrice);
    if (formData.sellingPrice === '' || isNaN(sellNum) || sellNum < 0) {
      errs.sellingPrice = 'Enter a valid non-negative selling price (₹).';
    }

    const reorderNum = parseInt(formData.reorderLevel, 10);
    if (formData.reorderLevel === '' || isNaN(reorderNum) || reorderNum < 0) {
      errs.reorderLevel = 'Enter a valid non-negative reorder threshold.';
    }

    const stockNum = parseInt(formData.currentStock, 10);
    if (formData.currentStock === '' || isNaN(stockNum) || stockNum < 0) {
      errs.currentStock = 'Enter a valid non-negative stock quantity.';
    }

    if (!formData.unit) {
      errs.unit = 'Unit of measurement is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    const activeCatId = formData.categoryId || effectiveCategoryId;
    const catObj = categories.find((c) => c.id === activeCatId);
    const submissionPayload = {
      ...formData,
      categoryId: activeCatId,
      category: catObj ? catObj.name : formData.category,
    };

    setLocalSubmitting(true);
    try {
      await onSubmit(submissionPayload);
    } catch {
      // Handled by parent or toast
    } finally {
      setLocalSubmitting(false);
    }
  };

  const isBusy = isSubmitting || localSubmitting;

  // Calculations for live margin preview
  const cost = parseFloat(formData.costPrice) || 0;
  const selling = parseFloat(formData.sellingPrice) || 0;
  const profitMargin = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : 0;
  const profitAmount = (selling - cost).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="product-form-container" noValidate>
      {/* Top Banner Navigation */}
      <div className="form-header-bar">
        <div>
          <Link to="/products" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
          <h2 className="form-page-title">
            {isEditMode ? `Edit Product: ${initialData.name || initialData.sku}` : 'Add New Product'}
          </h2>
          <p className="form-page-subtitle">
            {isEditMode
              ? 'Update catalog metadata, pricing parameters, and inventory thresholds.'
              : 'Register a new SKU into the enterprise retail inventory catalog.'}
          </p>
        </div>

        <div className="form-top-actions">
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={() => navigate('/products')}
            disabled={isBusy}
          >
            Cancel
          </button>
          <button type="submit" className="btn-sm btn-primary" disabled={isBusy}>
            <CheckCircle2 size={15} />
            <span>{isBusy ? 'Saving...' : (isEditMode ? 'Update Product' : 'Save Product')}</span>
          </button>
        </div>
      </div>

      {/* Global Server Error Banner */}
      {apiError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#991b1b',
          fontSize: '13.5px',
          marginBottom: '16px',
        }}>
          <AlertCircle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      {/* SECTION 1 — BASIC INFORMATION */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <Package size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section 1 — Basic Information</h3>
            <p className="form-section-desc">Catalog identification, brand ownership, and categorization</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Product Name */}
          <div className="form-field full-width">
            <label htmlFor="name" className="form-label required">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Apple iPhone 15 (128 GB) - Black"
              value={formData.name}
              onChange={handleChange}
              disabled={isBusy}
            />
            {errors.name && <span className="form-error-msg"><AlertCircle size={12} /> {errors.name}</span>}
          </div>

          {/* SKU */}
          <div className="form-field">
            <label htmlFor="sku" className="form-label required">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              className={`form-input ${errors.sku ? 'error' : ''} ${isEditMode ? 'readonly-input' : ''}`}
              placeholder="e.g. SKU-APL-IP15"
              value={formData.sku}
              onChange={handleChange}
              readOnly={isEditMode}
              disabled={isBusy}
            />
            {isEditMode && (
              <span className="form-helper-text">SKU cannot be modified once registered in catalog.</span>
            )}
            {errors.sku && <span className="form-error-msg"><AlertCircle size={12} /> {errors.sku}</span>}
          </div>

          {/* Category */}
          <div className="form-field">
            <label htmlFor="categoryId" className="form-label required">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className={`form-select ${errors.categoryId ? 'error' : ''}`}
              value={effectiveCategoryId}
              onChange={handleChange}
              disabled={isBusy}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <span className="form-error-msg"><AlertCircle size={12} /> {errors.categoryId}</span>}
          </div>

          {/* Brand */}
          <div className="form-field">
            <label htmlFor="brand" className="form-label required">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              className={`form-input ${errors.brand ? 'error' : ''}`}
              placeholder="e.g. Apple, Samsung, Dell, boAt"
              value={formData.brand}
              onChange={handleChange}
              disabled={isBusy}
            />
            {errors.brand && <span className="form-error-msg"><AlertCircle size={12} /> {errors.brand}</span>}
          </div>

          {/* Status */}
          <div className="form-field">
            <label htmlFor="status" className="form-label">
              Catalog Status
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
              disabled={isBusy}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-field full-width">
            <label htmlFor="description" className="form-label">
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="form-textarea"
              placeholder="Enter product specifications, technical details, box contents..."
              value={formData.description}
              onChange={handleChange}
              disabled={isBusy}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 — PRICING */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <IndianRupee size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section 2 — Pricing & Valuation</h3>
            <p className="form-section-desc">Procurement cost price and retail selling price in INR (₹)</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Cost Price */}
          <div className="form-field">
            <label htmlFor="costPrice" className="form-label required">
              Cost Price (₹)
            </label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                step="0.01"
                min="0"
                className={`form-input with-prefix ${errors.costPrice ? 'error' : ''}`}
                placeholder="0.00"
                value={formData.costPrice}
                onChange={handleChange}
                disabled={isBusy}
              />
            </div>
            {errors.costPrice && <span className="form-error-msg"><AlertCircle size={12} /> {errors.costPrice}</span>}
          </div>

          {/* Selling Price */}
          <div className="form-field">
            <label htmlFor="sellingPrice" className="form-label required">
              Selling Price (₹)
            </label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                step="0.01"
                min="0"
                className={`form-input with-prefix ${errors.sellingPrice ? 'error' : ''}`}
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={handleChange}
                disabled={isBusy}
              />
            </div>
            {errors.sellingPrice && <span className="form-error-msg"><AlertCircle size={12} /> {errors.sellingPrice}</span>}
          </div>

          {/* Profit Margin Preview Card */}
          <div className="form-field full-width">
            <div className="profit-preview-banner">
              <div className="profit-metric">
                <span className="profit-metric-label">Estimated Gross Margin:</span>
                <span 
                  className="profit-metric-val"
                  style={{ color: Number(profitAmount) >= 0 ? '#047857' : '#b91c1c' }}
                >
                  {profitMargin}% (₹{Number(profitAmount).toLocaleString('en-IN')})
                </span>
              </div>
              <span className="form-helper-text">
                {Number(profitAmount) >= 0 
                  ? 'Healthy retail markup configured.' 
                  : 'Warning: Selling price is less than procurement cost price.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — INVENTORY SETTINGS */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <Boxes size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section 3 — Inventory Settings</h3>
            <p className="form-section-desc">Stock keeping metrics, reorder trigger levels, and initial units</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Unit of Measurement */}
          <div className="form-field">
            <label htmlFor="unit" className="form-label required">
              Unit of Measurement
            </label>
            <select
              id="unit"
              name="unit"
              className={`form-select ${errors.unit ? 'error' : ''}`}
              value={formData.unit}
              onChange={handleChange}
              disabled={isBusy}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {errors.unit && <span className="form-error-msg"><AlertCircle size={12} /> {errors.unit}</span>}
          </div>

          {/* Reorder Level */}
          <div className="form-field">
            <label htmlFor="reorderLevel" className="form-label required">
              Reorder Level Threshold
            </label>
            <input
              type="number"
              id="reorderLevel"
              name="reorderLevel"
              min="0"
              className={`form-input ${errors.reorderLevel ? 'error' : ''}`}
              placeholder="e.g. 15"
              value={formData.reorderLevel}
              onChange={handleChange}
              disabled={isBusy}
            />
            <span className="form-helper-text">
              Triggers "Low Stock" alerts when inventory drops below this count.
            </span>
            {errors.reorderLevel && <span className="form-error-msg"><AlertCircle size={12} /> {errors.reorderLevel}</span>}
          </div>

          {/* Current Stock */}
          <div className="form-field">
            <label htmlFor="currentStock" className="form-label required">
              Current Available Stock
            </label>
            <input
              type="number"
              id="currentStock"
              name="currentStock"
              min="0"
              className={`form-input ${errors.currentStock ? 'error' : ''}`}
              placeholder="0"
              value={formData.currentStock}
              onChange={handleChange}
              disabled={isBusy}
            />
            {errors.currentStock && <span className="form-error-msg"><AlertCircle size={12} /> {errors.currentStock}</span>}
          </div>
        </div>
      </div>

      {/* SECTION 4 — PRODUCT IMAGE */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <ImageIcon size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section 4 — Product Image</h3>
            <p className="form-section-desc">Visual merchandise banner (Frontend preview only - no backend file upload)</p>
          </div>
        </div>

        <div className="image-upload-zone-wrapper">
          {imagePreview ? (
            <div className="image-preview-card">
              <img src={imagePreview} alt="Product preview" className="uploaded-preview-img" />
              <div className="image-preview-actions">
                <button
                  type="button"
                  className="btn-sm btn-secondary"
                  onClick={handleRemoveImage}
                  disabled={isBusy}
                >
                  <X size={14} /> Remove Image
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="image-file-input" className="image-dropzone">
              <UploadCloud size={36} className="image-dropzone-icon" />
              <div className="image-dropzone-title">Upload Product Image</div>
              <p className="image-dropzone-subtitle">
                Select PNG, JPG, or WEBP from your local machine.
              </p>
              <div className="image-dropzone-pill">Frontend Session Preview Only</div>
              <input
                id="image-file-input"
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={handleImageFileChange}
                disabled={isBusy}
              />
            </label>
          )}
        </div>
      </div>

      {/* Form Bottom Action Buttons */}
      <div className="form-bottom-actions">
        <button
          type="button"
          className="btn-sm btn-secondary"
          onClick={() => navigate('/products')}
          disabled={isBusy}
        >
          Cancel
        </button>
        <button type="submit" className="btn-sm btn-primary" disabled={isBusy}>
          <CheckCircle2 size={16} />
          <span>{isBusy ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Product')}</span>
        </button>
      </div>
    </form>
  );
}
