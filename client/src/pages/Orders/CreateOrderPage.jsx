import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  MapPin,
  Warehouse,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useInventory } from '../../hooks/useInventory';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { inventory } = useInventory();

  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');

  // Order items
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || '',
      quantity: 1,
    },
  ]);

  const [errors, setErrors] = useState({});

  // Helper to find available stock for a product in the selected warehouse
  const getProductAvailableStock = (prodId) => {
    const matched = inventory.find(
      (inv) =>
        inv.productId === prodId &&
        (String(inv.warehouseId) === String(warehouseId) || inv.warehouseCode === warehouseId)
    );
    return matched ? matched.availableStock : 0;
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProductChange = (index, prodId) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, productId: prodId, quantity: 1 };
        }
        return item;
      })
    );
  };

  const handleQtyChange = (index, qtyVal) => {
    const num = parseInt(qtyVal, 10);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, quantity: isNaN(num) ? '' : num };
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const usedIds = new Set(items.map((i) => i.productId));
    const nextProd = products.find((p) => !usedIds.has(p.id)) || products[0];
    setItems((prev) => [...prev, { productId: nextProd?.id || '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Line item calculation with stock check
  const calculatedItems = items.map((item) => {
    const matchedProd = products.find((p) => p.id === item.productId);
    const available = getProductAvailableStock(item.productId);
    const qty = parseInt(item.quantity, 10) || 0;
    const unitPrice = matchedProd?.sellingPrice || 0;
    const total = qty * unitPrice;
    const hasEnoughStock = available >= qty;

    return {
      productId: item.productId,
      productName: matchedProd?.name || 'Selected Product',
      sku: matchedProd?.sku || 'SKU-UNKNOWN',
      quantity: qty,
      unitPrice,
      total,
      available,
      hasEnoughStock,
    };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.total, 0);
  const tax = Math.round(subtotal * 0.18);
  const shippingFee = subtotal > 50000 ? 0 : 250;
  const grandTotal = subtotal + tax + shippingFee;

  const validate = () => {
    const errs = {};
    if (!customer.name.trim()) errs.name = 'Customer name is required';
    if (!customer.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!customer.phone.trim()) errs.phone = 'Phone number is required';
    if (!customer.address.trim()) errs.address = 'Street address is required';
    if (!customer.city.trim()) errs.city = 'City is required';
    if (!customer.state.trim()) errs.state = 'State is required';
    if (!customer.pincode.trim() || !/^\d{6}$/.test(customer.pincode.trim())) {
      errs.pincode = 'Pincode must be 6 digits';
    }

    if (!warehouseId) errs.warehouseId = 'Please select a fulfillment warehouse';

    // Stock checks
    for (let i = 0; i < calculatedItems.length; i++) {
      const it = calculatedItems[i];
      if (it.quantity <= 0) {
        errs[`item_${i}`] = 'Quantity must be at least 1';
      } else if (!it.hasEnoughStock) {
        errs[`item_${i}`] = `Only ${it.available} units available in selected warehouse`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedWh = warehouses.find((w) => w.id === warehouseId);

    createOrder({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      warehouseId,
      warehouseName: selectedWh?.name || 'Assigned Warehouse',
      shippingAddress: {
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      },
      items: calculatedItems.map(({ productId, productName, sku, quantity, unitPrice, total }) => ({
        productId,
        productName,
        sku,
        quantity,
        unitPrice,
        total,
      })),
      totalAmount: grandTotal,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    });

    navigate('/orders');
  };

  return (
    <div className="product-module-page">
      <div className="form-header-bar">
        <div>
          <Link to="/orders" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Orders</span>
          </Link>
          <h2 className="form-page-title">Create Sales Order</h2>
          <p className="form-page-subtitle">
            Initiate a customer order and lock inventory allocation at the dispatch hub.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="product-form-container">
        {/* Customer Information */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <User size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Customer Information</h3>
              <p className="form-section-desc">Recipient details for invoice and delivery notifications</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="ord-cust-name" className="form-label required">
                Customer Full Name
              </label>
              <input
                type="text"
                id="ord-cust-name"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. Aditya Sharma"
                value={customer.name}
                onChange={handleCustomerChange}
              />
              {errors.name && <span className="form-error-msg">{errors.name}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ord-cust-email" className="form-label required">
                Email Address
              </label>
              <input
                type="email"
                id="ord-cust-email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="e.g. aditya@gmail.com"
                value={customer.email}
                onChange={handleCustomerChange}
              />
              {errors.email && <span className="form-error-msg">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ord-cust-phone" className="form-label required">
                Contact Phone
              </label>
              <input
                type="text"
                id="ord-cust-phone"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="e.g. +91 98101 55443"
                value={customer.phone}
                onChange={handleCustomerChange}
              />
              {errors.phone && <span className="form-error-msg">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Delivery Destination</h3>
              <p className="form-section-desc">Physical address where packages will be dispatched</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="ord-address" className="form-label required">
                Street Address / Apartment
              </label>
              <input
                type="text"
                id="ord-address"
                name="address"
                className={`form-input ${errors.address ? 'error' : ''}`}
                placeholder="e.g. Flat 402, Lotus Apartments, Sector 45"
                value={customer.address}
                onChange={handleCustomerChange}
              />
              {errors.address && <span className="form-error-msg">{errors.address}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ord-city" className="form-label required">
                City
              </label>
              <input
                type="text"
                id="ord-city"
                name="city"
                className={`form-input ${errors.city ? 'error' : ''}`}
                placeholder="e.g. Gurugram"
                value={customer.city}
                onChange={handleCustomerChange}
              />
              {errors.city && <span className="form-error-msg">{errors.city}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ord-state" className="form-label required">
                State
              </label>
              <input
                type="text"
                id="ord-state"
                name="state"
                className={`form-input ${errors.state ? 'error' : ''}`}
                placeholder="e.g. Haryana"
                value={customer.state}
                onChange={handleCustomerChange}
              />
              {errors.state && <span className="form-error-msg">{errors.state}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="ord-pincode" className="form-label required">
                PIN Code
              </label>
              <input
                type="text"
                id="ord-pincode"
                name="pincode"
                maxLength={6}
                className={`form-input ${errors.pincode ? 'error' : ''}`}
                placeholder="e.g. 122003"
                value={customer.pincode}
                onChange={handleCustomerChange}
              />
              {errors.pincode && <span className="form-error-msg">{errors.pincode}</span>}
            </div>
          </div>
        </div>

        {/* Fulfillment Hub & Line Items */}
        <div className="card form-section-card">
          <div className="form-section-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="form-section-icon">
                <Warehouse size={18} />
              </div>
              <div>
                <h3 className="form-section-title">Warehouse Allocation & Items</h3>
                <p className="form-section-desc">Select dispatch hub to verify live stock availability</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={handleAddItem}
            >
              <Plus size={14} />
              <span>Add Item</span>
            </button>
          </div>

          <div className="form-field full-width" style={{ marginBottom: '16px' }}>
            <label htmlFor="ord-fulfillment-wh" className="form-label required">
              Dispatch Fulfillment Warehouse
            </label>
            <select
              id="ord-fulfillment-wh"
              className="form-select"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code}) &bull; {w.city}, {w.state}
                </option>
              ))}
            </select>
            <span className="form-helper-text">
              Stock availability is validated against this selected storage facility.
            </span>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Product</th>
                  <th style={{ padding: '10px 10px', width: '120px', textAlign: 'right' }}>Available</th>
                  <th style={{ padding: '10px 10px', width: '100px' }}>Quantity</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', width: '120px' }}>Price (₹)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: '130px' }}>Line Total</th>
                  <th style={{ padding: '10px 10px', width: '45px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const calc = calculatedItems[index] || {};
                  const itemErr = errors[`item_${index}`];

                  return (
                    <tr key={index} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          className="form-select"
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) &bull; ₹{p.sellingPrice}
                            </option>
                          ))}
                        </select>
                        {itemErr && <span className="form-error-msg" style={{ marginTop: 2 }}>{itemErr}</span>}
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: calc.available > 0 ? '#047857' : '#dc2626',
                            backgroundColor: calc.available > 0 ? '#ecfdf5' : '#fef2f2',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {calc.available} units
                        </span>
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <input
                          type="number"
                          min="1"
                          max={calc.available}
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                        />
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'right', color: '#475569' }}>
                        ₹{(calc.unitPrice || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{(calc.total || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="table-action-icon-btn toggle-active"
                            title="Remove line"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Box */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                width: '320px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>GST (18%):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Shipping:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {shippingFee === 0 ? 'Free' : `₹${shippingFee}`}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #cbd5e1',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                <span>Total Amount:</span>
                <span style={{ color: '#2563eb' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="form-bottom-actions">
          <Link to="/orders" className="btn-sm btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-sm btn-primary">
            <CheckCircle2 size={15} />
            <span>Confirm & Place Order</span>
          </button>
        </div>
      </form>
    </div>
  );
}
