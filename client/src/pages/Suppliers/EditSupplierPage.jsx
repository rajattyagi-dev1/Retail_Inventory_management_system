import React, { useState, useEffect } from 'react';
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
import supplierService from '../../services/supplierService';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

const CATEGORY_OPTIONS = ['Electronics', 'Accessories', 'Clothing', 'Home Appliances', 'General Merchandise'];
const PAYMENT_TERM_OPTIONS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance', 'COD'];

export default function EditSupplierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSupplierById, updateSupplier } = useSuppliers();

  const cachedSupplier = getSupplierById(id);
  const [supplier, setSupplier] = useState(cachedSupplier);
  const [loading, setLoading] = useState(!cachedSupplier);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: cachedSupplier?.name || '',
    supplierCode: cachedSupplier?.supplierCode || '',
    companyName: cachedSupplier?.companyName || '',
    category: cachedSupplier?.category || CATEGORY_OPTIONS[0],
    status: cachedSupplier?.status || 'ACTIVE',
    contactPerson: cachedSupplier?.contactPerson || '',
    email: cachedSupplier?.email || '',
    phone: cachedSupplier?.phone || '',
    address: cachedSupplier?.address || '',
    city: cachedSupplier?.city || '',
    state: cachedSupplier?.state || '',
    pincode: cachedSupplier?.pincode || '',
    gstNumber: cachedSupplier?.gstNumber || '',
    paymentTerms: cachedSupplier?.paymentTerms || 'Net 30',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!cachedSupplier && id) {
      setLoading(true);
      supplierService
        .getSupplierById(id)
        .then((data) => {
          if (data) {
            setSupplier(data);
            setFormData({
              name: data.name || '',
              supplierCode: data.supplierCode || '',
              companyName: data.companyName || '',
              category: data.category || CATEGORY_OPTIONS[0],
              status: data.status || 'ACTIVE',
              contactPerson: data.contactPerson || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              pincode: data.pincode || '',
              gstNumber: data.gstNumber || '',
              paymentTerms: data.paymentTerms || 'Net 30',
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load supplier for editing:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [cachedSupplier, id]);

  if (loading) {
    return <LoadingState message="Loading supplier details..." />;
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await updateSupplier(supplier.id, {
        ...formData,
        gstNumber: formData.gstNumber.trim().toUpperCase(),
      });
      navigate(`/suppliers/${supplier.id}`);
    } catch (err) {
      console.error('Update supplier failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-module-page">
      <div className="form-header-bar">
        <div>
          <Link to={`/suppliers/${supplier.id}`} className="form-back-link">
            <ArrowLeft size={16} />
            <span>Cancel & Back to Supplier</span>
          </Link>
          <h2 className="form-page-title">Edit Supplier Profile</h2>
          <p className="form-page-subtitle">
            Update commercial credentials, GSTIN registration, and settlement terms for {supplier.name}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="product-form-container">
        {/* Section 1: Basic Information */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Supplier Identity</h3>
              <p className="form-section-desc">Brand name, legal registration, and segment classification</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="edit-sup-code" className="form-label">
                Supplier Code (System Assigned)
              </label>
              <input
                type="text"
                id="edit-sup-code"
                name="supplierCode"
                className="form-input"
                value={formData.supplierCode}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-status" className="form-label required">
                Vendor Status
              </label>
              <select
                id="edit-sup-status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active (Eligible for POs)</option>
                <option value="INACTIVE">Inactive (Procurement Frozen)</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-name" className="form-label required">
                Brand / Trade Name
              </label>
              <input
                type="text"
                id="edit-sup-name"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-company" className="form-label required">
                Registered Entity / Company Name
              </label>
              <input
                type="text"
                id="edit-sup-company"
                name="companyName"
                className={`form-input ${errors.companyName ? 'error' : ''}`}
                value={formData.companyName}
                onChange={handleChange}
              />
              {errors.companyName && <span className="form-error-msg">{errors.companyName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-cat" className="form-label required">
                Merchandise Category
              </label>
              <select
                id="edit-sup-cat"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <User size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Key Contact Personnel</h3>
              <p className="form-section-desc">Designated relationship manager for order escalations</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="edit-sup-contact" className="form-label required">
                Primary Contact Person
              </label>
              <input
                type="text"
                id="edit-sup-contact"
                name="contactPerson"
                className={`form-input ${errors.contactPerson ? 'error' : ''}`}
                value={formData.contactPerson}
                onChange={handleChange}
              />
              {errors.contactPerson && <span className="form-error-msg">{errors.contactPerson}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-email" className="form-label required">
                Official Business Email
              </label>
              <input
                type="email"
                id="edit-sup-email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="form-error-msg">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-phone" className="form-label required">
                Contact Phone Number
              </label>
              <input
                type="tel"
                id="edit-sup-phone"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className="form-error-msg">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Section 3: Physical Address */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Facility & Warehouse Address</h3>
              <p className="form-section-desc">Dispatch source location for freight lead time calculation</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="edit-sup-addr" className="form-label">
                Street Address / Unit
              </label>
              <input
                type="text"
                id="edit-sup-addr"
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-city" className="form-label required">
                City / Hub
              </label>
              <input
                type="text"
                id="edit-sup-city"
                name="city"
                className={`form-input ${errors.city ? 'error' : ''}`}
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <span className="form-error-msg">{errors.city}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-state" className="form-label required">
                State
              </label>
              <input
                type="text"
                id="edit-sup-state"
                name="state"
                className={`form-input ${errors.state ? 'error' : ''}`}
                value={formData.state}
                onChange={handleChange}
              />
              {errors.state && <span className="form-error-msg">{errors.state}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-pin" className="form-label required">
                Postal PIN Code
              </label>
              <input
                type="text"
                id="edit-sup-pin"
                name="pincode"
                className={`form-input ${errors.pincode ? 'error' : ''}`}
                value={formData.pincode}
                onChange={handleChange}
                maxLength={6}
              />
              {errors.pincode && <span className="form-error-msg">{errors.pincode}</span>}
            </div>
          </div>
        </div>

        {/* Section 4: Tax & Commercial Terms */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Commercial & Tax Credentials</h3>
              <p className="form-section-desc">Indian GSTIN registration and invoice payment cycle</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="edit-sup-gst" className="form-label">
                GSTIN Number (15 Characters)
              </label>
              <input
                type="text"
                id="edit-sup-gst"
                name="gstNumber"
                className={`form-input ${errors.gstNumber ? 'error' : ''}`}
                value={formData.gstNumber}
                onChange={handleChange}
                maxLength={15}
                style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
              />
              {errors.gstNumber && <span className="form-error-msg">{errors.gstNumber}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="edit-sup-terms" className="form-label required">
                Invoice Payment Settlement Terms
              </label>
              <select
                id="edit-sup-terms"
                name="paymentTerms"
                className="form-select"
                value={formData.paymentTerms}
                onChange={handleChange}
              >
                {PAYMENT_TERM_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="form-actions-bottom">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/suppliers/${supplier.id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            <CheckCircle2 size={16} />
            <span>{isSubmitting ? 'Saving Changes...' : 'Update Supplier Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
