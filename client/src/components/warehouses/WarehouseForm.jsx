import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Warehouse,
  MapPin,
  User,
  Boxes,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/**
 * Reusable WarehouseForm component for Add and Edit Warehouse flows.
 * 
 * @param {object} initialData - Pre-populated warehouse data (for Edit mode)
 * @param {boolean} isEditMode - True if editing an existing warehouse
 * @param {function} onSubmit - Submit handler passing validated form data
 */
export default function WarehouseForm({
  initialData = {},
  isEditMode = false,
  onSubmit,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    code: initialData.code || '',
    status: initialData.status || 'ACTIVE',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || 'Delhi',
    pincode: initialData.pincode || '',
    managerName: initialData.managerName || '',
    managerEmail: initialData.managerEmail || '',
    managerPhone: initialData.managerPhone || '',
    capacity: initialData.capacity !== undefined ? String(initialData.capacity) : '',
    currentStock: initialData.currentStock !== undefined ? String(initialData.currentStock) : '0',
    staffCount: initialData.staffCount !== undefined ? String(initialData.staffCount) : '10',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Warehouse name is required.';
    }

    if (!formData.code.trim()) {
      errs.code = 'Warehouse code is required.';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.code.trim())) {
      errs.code = 'Warehouse code should only contain letters, numbers, and hyphens.';
    }

    if (!formData.address.trim()) {
      errs.address = 'Street address is required.';
    }

    if (!formData.city.trim()) {
      errs.city = 'City is required.';
    }

    if (!formData.state.trim()) {
      errs.state = 'State selection is required.';
    }

    const pincodeTrimmed = formData.pincode.trim();
    if (!pincodeTrimmed) {
      errs.pincode = 'Pincode is required.';
    } else if (!/^[1-9][0-9]{5}$/.test(pincodeTrimmed)) {
      errs.pincode = 'Enter a valid Indian 6-digit postal pincode (e.g. 110020).';
    }

    if (!formData.managerName.trim()) {
      errs.managerName = 'Manager name is required.';
    }

    const emailTrimmed = formData.managerEmail.trim();
    if (!emailTrimmed) {
      errs.managerEmail = 'Manager email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.managerEmail = 'Enter a valid email address.';
    }

    if (!formData.managerPhone.trim()) {
      errs.managerPhone = 'Manager phone number is required.';
    }

    const capNum = parseInt(formData.capacity, 10);
    if (formData.capacity === '' || isNaN(capNum) || capNum <= 0) {
      errs.capacity = 'Storage capacity must be an integer greater than 0.';
    }

    const stockNum = parseInt(formData.currentStock, 10);
    if (formData.currentStock === '' || isNaN(stockNum) || stockNum < 0) {
      errs.currentStock = 'Current stock cannot be negative.';
    } else if (capNum > 0 && stockNum > capNum) {
      errs.currentStock = 'Current stock cannot exceed total storage capacity.';
    }

    const staffNum = parseInt(formData.staffCount, 10);
    if (formData.staffCount === '' || isNaN(staffNum) || staffNum < 0) {
      errs.staffCount = 'Staff count cannot be negative.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    onSubmit(formData);
  };

  const returnPath = isEditMode ? `/warehouses/${initialData.id}` : '/warehouses';

  return (
    <form onSubmit={handleSubmit} className="product-form-container" noValidate>
      {/* Header Navigation */}
      <div className="form-header-bar">
        <div>
          <Link to={returnPath} className="form-back-link">
            <ArrowLeft size={16} />
            <span>{isEditMode ? 'Back to Warehouse Details' : 'Back to Warehouses'}</span>
          </Link>
          <h2 className="form-page-title">
            {isEditMode ? `Edit Warehouse: ${initialData.name}` : 'Register New Warehouse'}
          </h2>
          <p className="form-page-subtitle">
            {isEditMode
              ? 'Update facility location, operational capacity, staff count, and manager contact.'
              : 'Add a new regional distribution hub or fulfillment center to the inventory network.'}
          </p>
        </div>

        <div className="form-top-actions">
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={() => navigate(returnPath)}
          >
            Cancel
          </button>
          <button type="submit" className="btn-sm btn-primary">
            <CheckCircle2 size={15} />
            <span>{isEditMode ? 'Save Changes' : 'Create Warehouse'}</span>
          </button>
        </div>
      </div>

      {/* SECTION A — BASIC INFORMATION */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <Warehouse size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section A — Basic Information</h3>
            <p className="form-section-desc">Warehouse naming, system identifier, and operational status</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Warehouse Name */}
          <div className="form-field full-width">
            <label htmlFor="name" className="form-label required">
              Warehouse Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Delhi Central Hub"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.name}
              </span>
            )}
          </div>

          {/* Warehouse Code */}
          <div className="form-field">
            <label htmlFor="code" className="form-label required">
              Warehouse Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              className={`form-input ${errors.code ? 'error' : ''} ${isEditMode ? 'readonly-input' : ''}`}
              placeholder="e.g. WH-DEL-001"
              value={formData.code}
              onChange={handleChange}
              readOnly={isEditMode}
            />
            {isEditMode ? (
              <span className="form-helper-text">
                Warehouse code is immutable after facility registration.
              </span>
            ) : (
              <span className="form-helper-text">
                Unique identifier for tracking regional dispatches.
              </span>
            )}
            {errors.code && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.code}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="form-field">
            <label htmlFor="status" className="form-label required">
              Operational Status
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="ACTIVE">ACTIVE (Operational)</option>
              <option value="INACTIVE">INACTIVE (Temporarily Closed / Maintenance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION B — LOCATION */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section B — Location & Postal Details</h3>
            <p className="form-section-desc">Physical facility address, regional jurisdiction, and postal code</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Street Address */}
          <div className="form-field full-width">
            <label htmlFor="address" className="form-label required">
              Facility Address / Street
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className={`form-input ${errors.address ? 'error' : ''}`}
              placeholder="e.g. Plot 42, Phase III, Okhla Industrial Area"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.address}
              </span>
            )}
          </div>

          {/* City */}
          <div className="form-field">
            <label htmlFor="city" className="form-label required">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              className={`form-input ${errors.city ? 'error' : ''}`}
              placeholder="e.g. New Delhi, Mumbai, Bengaluru"
              value={formData.city}
              onChange={handleChange}
            />
            {errors.city && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.city}
              </span>
            )}
          </div>

          {/* State */}
          <div className="form-field">
            <label htmlFor="state" className="form-label required">
              State
            </label>
            <select
              id="state"
              name="state"
              className={`form-select ${errors.state ? 'error' : ''}`}
              value={formData.state}
              onChange={handleChange}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.state}
              </span>
            )}
          </div>

          {/* Pincode */}
          <div className="form-field">
            <label htmlFor="pincode" className="form-label required">
              Postal Pincode (6 Digits)
            </label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              maxLength={6}
              className={`form-input ${errors.pincode ? 'error' : ''}`}
              placeholder="e.g. 110020"
              value={formData.pincode}
              onChange={handleChange}
            />
            {errors.pincode && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.pincode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION C — MANAGER INFORMATION */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <User size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section C — Warehouse Manager Contact</h3>
            <p className="form-section-desc">Designated site supervisor and escalation communication channels</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Manager Name */}
          <div className="form-field">
            <label htmlFor="managerName" className="form-label required">
              Manager Full Name
            </label>
            <input
              type="text"
              id="managerName"
              name="managerName"
              className={`form-input ${errors.managerName ? 'error' : ''}`}
              placeholder="e.g. Amit Sharma"
              value={formData.managerName}
              onChange={handleChange}
            />
            {errors.managerName && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.managerName}
              </span>
            )}
          </div>

          {/* Manager Email */}
          <div className="form-field">
            <label htmlFor="managerEmail" className="form-label required">
              Manager Official Email
            </label>
            <input
              type="email"
              id="managerEmail"
              name="managerEmail"
              className={`form-input ${errors.managerEmail ? 'error' : ''}`}
              placeholder="e.g. amit.sharma@retailims.in"
              value={formData.managerEmail}
              onChange={handleChange}
            />
            {errors.managerEmail && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.managerEmail}
              </span>
            )}
          </div>

          {/* Manager Phone */}
          <div className="form-field">
            <label htmlFor="managerPhone" className="form-label required">
              Contact Phone Number
            </label>
            <input
              type="text"
              id="managerPhone"
              name="managerPhone"
              className={`form-input ${errors.managerPhone ? 'error' : ''}`}
              placeholder="e.g. +91 98112 34567"
              value={formData.managerPhone}
              onChange={handleChange}
            />
            {errors.managerPhone && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.managerPhone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION D & E — CAPACITY & STAFF */}
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <Boxes size={18} />
          </div>
          <div>
            <h3 className="form-section-title">Section D & E — Storage Capacity & Workforce</h3>
            <p className="form-section-desc">Inventory volumetric limits and on-site staff headcount</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Storage Capacity */}
          <div className="form-field">
            <label htmlFor="capacity" className="form-label required">
              Storage Capacity (Units)
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              min="1"
              className={`form-input ${errors.capacity ? 'error' : ''}`}
              placeholder="e.g. 50000"
              value={formData.capacity}
              onChange={handleChange}
            />
            {errors.capacity && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.capacity}
              </span>
            )}
          </div>

          {/* Current Stock */}
          <div className="form-field">
            <label htmlFor="currentStock" className="form-label required">
              Initial / Current Stock (Units)
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
            />
            {errors.currentStock && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.currentStock}
              </span>
            )}
          </div>

          {/* Staff Count */}
          <div className="form-field">
            <label htmlFor="staffCount" className="form-label required">
              On-Site Staff Count
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                id="staffCount"
                name="staffCount"
                min="0"
                className={`form-input ${errors.staffCount ? 'error' : ''}`}
                placeholder="e.g. 35"
                value={formData.staffCount}
                onChange={handleChange}
              />
            </div>
            {errors.staffCount && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {errors.staffCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Bottom Actions */}
      <div className="form-bottom-actions">
        <button
          type="button"
          className="btn-sm btn-secondary"
          onClick={() => navigate(returnPath)}
        >
          Cancel
        </button>
        <button type="submit" className="btn-sm btn-primary">
          <CheckCircle2 size={16} />
          <span>{isEditMode ? 'Update Warehouse' : 'Create Warehouse'}</span>
        </button>
      </div>
    </form>
  );
}
