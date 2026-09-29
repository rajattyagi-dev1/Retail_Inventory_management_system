import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useProducts } from '../../hooks/useProducts';

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();
  const { createPurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Initial order item populated with first catalog product
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || '',
      quantity: 10,
      unitPrice: products[0]?.costPrice || 1000,
    },
  ]);

  const [errors, setErrors] = useState({});

  const handleProductChange = (index, prodId) => {
    const matched = products.find((p) => p.id === prodId);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            productId: prodId,
            unitPrice: matched?.costPrice || item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    // Pick next product not already in list if possible
    const usedIds = new Set(items.map((i) => i.productId));
    const nextProd = products.find((p) => !usedIds.has(p.id)) || products[0];

    setItems((prev) => [
      ...prev,
      {
        productId: nextProd?.id || '',
        quantity: 10,
        unitPrice: nextProd?.costPrice || 1000,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const matched = products.find((p) => p.id === item.productId);
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    const price = Math.max(0, parseFloat(item.unitPrice) || 0);
    const lineSubtotal = qty * price;
    const tax = Math.round(lineSubtotal * 0.18); // 18% standard GST
    const total = lineSubtotal + tax;

    return {
      productId: item.productId,
      productName: matched?.name || 'Selected Product',
      sku: matched?.sku || 'SKU-UNKNOWN',
      quantity: qty,
      unitPrice: price,
      tax,
      total,
      lineSubtotal,
    };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.lineSubtotal, 0);
  const taxTotal = calculatedItems.reduce((acc, i) => acc + i.tax, 0);
  const grandTotal = subtotal + taxTotal;

  const validate = () => {
    const errs = {};
    if (!supplierId) errs.supplierId = 'Please select a vendor';
    if (!warehouseId) errs.warehouseId = 'Please select a destination warehouse';
    if (!expectedDate) errs.expectedDate = 'Expected delivery date is required';

    if (items.length === 0) {
      errs.items = 'At least one line item is required';
    } else {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.productId) {
          errs[`item_${i}`] = 'Product is required';
        }
        if (!it.quantity || parseInt(it.quantity, 10) <= 0) {
          errs[`item_${i}`] = 'Quantity must be greater than zero';
        }
        if (parseFloat(it.unitPrice) < 0) {
          errs[`item_${i}`] = 'Unit price cannot be negative';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

    createPurchaseOrder({
      supplierId,
      supplierName: selectedSupplier?.name || 'Selected Supplier',
      warehouseId,
      warehouseName: selectedWarehouse?.name || 'Destination Warehouse',
      expectedDate,
      notes,
      subtotal,
      tax: taxTotal,
      total: grandTotal,
      items: calculatedItems,
      status: 'PENDING',
    });

    navigate('/purchase-orders');
  };

  return (
    <div className="product-module-page">
      <div className="form-header-bar">
        <div>
          <Link to="/purchase-orders" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Purchase Orders</span>
          </Link>
          <h2 className="form-page-title">Create Purchase Order</h2>
          <p className="form-page-subtitle">
            Initiate a stock replenishment requisition from an authorized vendor partner.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="product-form-container">
        {/* Header Information */}
        <div className="card form-section-card">
          <div className="form-section-header">
            <div className="form-section-icon">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="form-section-title">Requisition Parameters</h3>
              <p className="form-section-desc">Vendor source, receiving facility, and fulfillment deadline</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="po-supplier" className="form-label required">
                Supplier / Vendor Partner
              </label>
              <select
                id="po-supplier"
                className={`form-select ${errors.supplierId ? 'error' : ''}`}
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplierCode}) &bull; {s.city}
                  </option>
                ))}
              </select>
              {errors.supplierId && <span className="form-error-msg">{errors.supplierId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="po-warehouse" className="form-label required">
                Receiving Destination Warehouse
              </label>
              <select
                id="po-warehouse"
                className={`form-select ${errors.warehouseId ? 'error' : ''}`}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) &bull; {w.city}
                  </option>
                ))}
              </select>
              {errors.warehouseId && <span className="form-error-msg">{errors.warehouseId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="po-expected-date" className="form-label required">
                Expected Delivery Date
              </label>
              <input
                type="date"
                id="po-expected-date"
                className={`form-input ${errors.expectedDate ? 'error' : ''}`}
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
              {errors.expectedDate && <span className="form-error-msg">{errors.expectedDate}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="po-notes" className="form-label">
                Procurement Notes / Reference
              </label>
              <input
                type="text"
                id="po-notes"
                className="form-input"
                placeholder="e.g. Q3 festive replenishment, contract rate verified"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="card form-section-card">
          <div className="form-section-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="form-section-icon">
                <Plus size={18} />
              </div>
              <div>
                <h3 className="form-section-title">Order Line Items</h3>
                <p className="form-section-desc">Select catalog products, quantities, and agreed unit rates</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={handleAddItem}
            >
              <Plus size={14} />
              <span>Add Another Item</span>
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Product</th>
                  <th style={{ padding: '10px 10px', width: '110px' }}>Quantity</th>
                  <th style={{ padding: '10px 10px', width: '130px' }}>Unit Cost (₹)</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', width: '110px' }}>GST (18%)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: '140px' }}>Line Total</th>
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
                              {p.name} ({p.sku}) &bull; ₹{p.costPrice}
                            </option>
                          ))}
                        </select>
                        {itemErr && <span className="form-error-msg" style={{ marginTop: 2 }}>{itemErr}</span>}
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'right', color: '#64748b' }}>
                        ₹{(calc.tax || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{(calc.total || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="table-action-icon-btn toggle-active"
                            title="Remove item"
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
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
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
                <span>Subtotal ({calculatedItems.length} lines):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Estimated GST (18%):</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{taxTotal.toLocaleString('en-IN')}</span>
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
                <span>Grand Total:</span>
                <span style={{ color: '#2563eb' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="form-bottom-actions">
          <Link to="/purchase-orders" className="btn-sm btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-sm btn-primary">
            <CheckCircle2 size={15} />
            <span>Generate Purchase Order</span>
          </button>
        </div>
      </form>
    </div>
  );
}
