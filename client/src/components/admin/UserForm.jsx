import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, CheckCircle2 } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'System Administrator' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { value: 'PROCUREMENT_MANAGER', label: 'Procurement Manager' },
  { value: 'SALES_MANAGER', label: 'Sales & Fulfillment Manager' },
  { value: 'STAFF', label: 'Operations Staff' },
];

export default function UserForm({
  initialData = {},
  onSubmit,
  isEdit = false,
  cancelPath = '/admin/users',
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'STAFF',
    department: initialData?.department || '',
    status: initialData?.status || 'ACTIVE',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid corporate email';
    }
    if (!formData.department.trim()) errs.department = 'Department / Facility is required';

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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="product-form-container">
      <div className="card form-section-card">
        <div className="form-section-header">
          <div className="form-section-icon">
            <User size={18} />
          </div>
          <div>
            <h3 className="form-section-title">User Account Information</h3>
            <p className="form-section-desc">Personal identity, role-based authorization, and departmental assignment</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="usr-name" className="form-label required">
              Full Name
            </label>
            <input
              type="text"
              id="usr-name"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Alex Mercer"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="form-error-msg">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="usr-email" className="form-label required">
              Corporate Email Address
            </label>
            <input
              type="email"
              id="usr-email"
              name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="e.g. alex.mercer@retailims.in"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="form-error-msg">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="usr-role" className="form-label required">
              Role & Permissions
            </label>
            <select
              id="usr-role"
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="form-helper-text">Defines functional access level across modules</span>
          </div>

          <div className="form-field">
            <label htmlFor="usr-dept" className="form-label required">
              Department / Assigned Node
            </label>
            <input
              type="text"
              id="usr-dept"
              name="department"
              className={`form-input ${errors.department ? 'error' : ''}`}
              placeholder="e.g. Central Merchandising & Stock Control"
              value={formData.department}
              onChange={handleChange}
            />
            {errors.department && <span className="form-error-msg">{errors.department}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="usr-status" className="form-label required">
              Access Status
            </label>
            <select
              id="usr-status"
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="ACTIVE">Active (Login Allowed)</option>
              <option value="INACTIVE">Inactive (Suspended)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-bottom-actions">
        <Link to={cancelPath} className="btn-sm btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-sm btn-primary">
          <CheckCircle2 size={15} />
          <span>{isEdit ? 'Save Changes' : 'Create User'}</span>
        </button>
      </div>
    </form>
  );
}
