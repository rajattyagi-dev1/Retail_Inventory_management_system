import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { useSuppliers } from '../../hooks/useSuppliers';
import EmptyState from '../../components/common/EmptyState';

const CATEGORY_OPTIONS = ['Electronics', 'Accessories', 'Clothing', 'Home Appliances', 'General Merchandise'];
const PAYMENT_TERM_OPTIONS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance', 'COD'];

export default function EditSupplierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSupplierById, updateSupplier } = useSuppliers();

  const supplier = getSupplierById(id);

  const [formData, setFormData] = useState(() => ({
    name: supplier?.name || '',
    supplierCode: supplier?.supplierCode || '',
    companyName: supplier?.companyName || '',
    category: supplier?.category || CATEGORY_OPTIONS[0],
    status: supplier?.status || 'ACTIVE',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    state: supplier?.state || '',
    pincode: supplier?.pincode || '',
    gstNumber: supplier?.gstNumber || '',
    paymentTerms: supplier?.paymentTerms || 'Net 30',
  }));

  const [errors, setErrors] = useState({});

  if (!supplier) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Supplier Not Found"
          message={`No supplier matching identifier "${id}" exists in the system.`}
          action={
            <Link to="/suppliers" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Suppliers</span>
            </Link>
          }
        />
      </div>
    );
  }

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Supplier brand/trade name is required';
    if (!formData.companyName.trim()) errs.companyName = 'Registered company name is required';
    if (!formData.contactPerson.trim()) errs.contactPerson = 'Key contact person is required';

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+\s-]{8,15}$/.test(formData.phone)) {
      errs.phone = 'Enter a valid phone number';
    }

    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.state.trim()) errs.state = 'State is required';

    if (!formData.pincode.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = 'Pincode must be exactly 6 digits';
    }

    if (formData.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.trim().toUpperCase())) {
      errs.gstNumber = 'Enter a valid 15-character GSTIN format (e.g. 07AAACA1234A1Z5)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    updateSupplier(supplier.id, {
      ...formData,
      gstNumber: formData.gstNumber.trim().toUpperCase(),
    });

    navigate(`/suppliers/${supplier.id}`);
  };

  return (
    <div className="product-module-page">
      <div className="form-header-bar">
        <div>
          <Link to={`/suppliers/${supplier.id}`} className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Supplier Profile</span>
          </Link>
          <h2 className="form-page-title">Edit Supplier — {supplier.name}</h2>
          <p className="form-page-subtitle">
            Update commercial contacts, terms, and tax registration identifiers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="product-form-container">
        {/* Section 1: Basic Info */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Supplier Master Details</h3>
              <p className="form-section-desc">Primary commercial naming and vendor categorization</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name" className="form-label required">
                Supplier Trade / Brand Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="companyName" className="form-label required">
                Registered Company Legal Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                className={`form-input ${errors.companyName ? 'error' : ''}`}
                value={formData.companyName}
                onChange={handleChange}
              />
              {errors.companyName && <span className="form-error-msg">{errors.companyName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="supplierCode" className="form-label">
                Supplier Code (Read-Only)
              </label>
              <input
                type="text"
                id="supplierCode"
                name="supplierCode"
                className="form-input readonly-input"
                value={formData.supplierCode}
                readOnly
              />
            </div>

            <div className="form-field">
              <label htmlFor="category" className="form-label required">
                Merchandise Category
              </label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="status" className="form-label required">
                Vendor Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active (Ready for POs)</option>
                <option value="ON_HOLD">On Hold (Pending Verification)</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Info */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <User size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Point of Contact</h3>
              <p className="form-section-desc">Key relationship manager and communication details</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="contactPerson" className="form-label required">
                Contact Person Name
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                className={`form-input ${errors.contactPerson ? 'error' : ''}`}
                value={formData.contactPerson}
                onChange={handleChange}
              />
              {errors.contactPerson && <span className="form-error-msg">{errors.contactPerson}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="email" className="form-label required">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="form-error-msg">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="phone" className="form-label required">
                Phone / Mobile
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className="form-error-msg">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Section 3: Address Info */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Registered Business Address</h3>
              <p className="form-section-desc">Physical facility location for invoice and shipping dispatches</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="address" className="form-label">
                Street Address / Industrial Plot
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="city" className="form-label required">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className={`form-input ${errors.city ? 'error' : ''}`}
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <span className="form-error-msg">{errors.city}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="state" className="form-label required">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className={`form-input ${errors.state ? 'error' : ''}`}
                value={formData.state}
                onChange={handleChange}
              />
              {errors.state && <span className="form-error-msg">{errors.state}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="pincode" className="form-label required">
                PIN Code (6 digits)
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                maxLength={6}
                className={`form-input ${errors.pincode ? 'error' : ''}`}
                value={formData.pincode}
                onChange={handleChange}
              />
              {errors.pincode && <span className="form-error-msg">{errors.pincode}</span>}
            </div>
          </div>
        </div>

        {/* Section 4: Business Information */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Commercial & Compliance Terms</h3>
              <p className="form-section-desc">Taxation identifiers and negotiated credit payment terms</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="gstNumber" className="form-label">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                id="gstNumber"
                name="gstNumber"
                maxLength={15}
                className={`form-input ${errors.gstNumber ? 'error' : ''}`}
                value={formData.gstNumber}
                onChange={handleChange}
              />
              {errors.gstNumber && <span className="form-error-msg">{errors.gstNumber}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="paymentTerms" className="form-label required">
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                className="form-select"
                value={formData.paymentTerms}
                onChange={handleChange}
              >
                {PAYMENT_TERM_OPTIONS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="form-bottom-actions">
          <Link to={`/suppliers/${supplier.id}`} className="btn-sm btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-sm btn-primary">
            <CheckCircle2 size={15} />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
