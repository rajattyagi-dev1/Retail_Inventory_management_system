import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, PackageCheck } from 'lucide-react';

export default function ReceiveGoodsModal({
  isOpen,
  purchaseOrder,
  onClose,
  onConfirmReceipt,
}) {
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('Inbound Dock Manager');
  const [error, setError] = useState('');
  const [prevPoId, setPrevPoId] = useState(null);

  const currentPoId = purchaseOrder?.id || null;
  if (isOpen && currentPoId && currentPoId !== prevPoId) {
    setPrevPoId(currentPoId);
    const initial = {};
    (purchaseOrder?.items || []).forEach((item) => {
      const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
      initial[item.productId] = remaining;
    });
    setQuantities(initial);
    setNotes('');
    setError('');
  }

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (productId, val, maxRemaining) => {
    const num = parseInt(val, 10);
    setQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(num) ? '' : Math.min(Math.max(0, num), maxRemaining),
    }));
    setError('');
  };

  const handleReceiveAll = () => {
    const updated = {};
    (purchaseOrder.items || []).forEach((item) => {
      const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
      updated[item.productId] = remaining;
    });
    setQuantities(updated);
  };

  const handleClearAll = () => {
    const updated = {};
    (purchaseOrder.items || []).forEach((item) => {
      updated[item.productId] = 0;
    });
    setQuantities(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    let totalReceiving = 0;
    for (const item of purchaseOrder.items || []) {
      const val = parseInt(quantities[item.productId], 10) || 0;
      const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));

      if (val < 0) {
        setError('Receiving quantities cannot be negative.');
        return;
      }
      if (val > remaining) {
        setError(`Receiving quantity for ${item.productName} cannot exceed remaining (${remaining} units).`);
        return;
      }
      totalReceiving += val;
    }

    if (totalReceiving === 0) {
      setError('Please specify at least 1 unit to receive.');
      return;
    }

    onConfirmReceipt(quantities, notes, performedBy);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="form-section-icon" style={{ width: 34, height: 34, color: '#059669', backgroundColor: '#ecfdf5' }}>
              <PackageCheck size={18} />
            </div>
            <div>
              <h3 className="modal-title">Receive Inbound Goods</h3>
              <p className="modal-subtitle">
                Record physical intake at {purchaseOrder.warehouseName} ({purchaseOrder.poNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Vendor Partner</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                  {purchaseOrder.supplierName}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-sm btn-secondary"
                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                  onClick={handleReceiveAll}
                >
                  Receive All Remaining
                </button>
                <button
                  type="button"
                  className="btn-sm btn-secondary"
                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Line items table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>Product Line</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ordered</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Received</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Remaining</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px' }}>Receiving Now</th>
                  </tr>
                </thead>
                <tbody>
                  {(purchaseOrder.items || []).map((item) => {
                    const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
                    const currentVal = quantities[item.productId] ?? '';

                    return (
                      <tr key={item.productId} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</div>
                          <span className="sku-code" style={{ fontSize: '10.5px' }}>{item.sku}</span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#475569' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          {item.receivedQuantity || 0}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: remaining > 0 ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
                          {remaining}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            disabled={remaining === 0}
                            style={{
                              width: '80px',
                              textAlign: 'right',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              fontWeight: 700,
                            }}
                            value={currentVal}
                            onChange={(e) => handleQtyChange(item.productId, e.target.value, remaining)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inbound receipt metadata */}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="recv-dock-manager" className="form-label required">
                  Receiving Dock Operator
                </label>
                <input
                  type="text"
                  id="recv-dock-manager"
                  className="form-input"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="form-field">
                <label htmlFor="recv-dock-notes" className="form-label">
                  Inspection / Delivery Notes
                </label>
                <input
                  type="text"
                  id="recv-dock-notes"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Good condition, seal verified"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-sm btn-primary">
              <CheckCircle2 size={15} />
              <span>Confirm Goods Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
