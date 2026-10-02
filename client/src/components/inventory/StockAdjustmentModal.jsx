import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';

const REASON_OPTIONS = [
  'Cycle Count Audit Discrepancy',
  'Damaged / Defective Stock Removed',
  'Customer Return Re-shelved',
  'Inbound Shipment Variance Correction',
  'Inter-Hub Transfer Adjustment',
  'Loss / Shrinkage Write-off',
  'Other Operational Adjustment',
];

function StockAdjustmentDialog({
  item,
  inventoryList = [],
  onClose,
}) {
  const { adjustStock } = useInventory();

  const [selectedInventoryId, setSelectedInventoryId] = useState(
    item ? item.id : inventoryList[0]?.id || ''
  );
  const [type, setType] = useState('ADD STOCK');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('Inventory Supervisor');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected item object
  const currentItem = item || inventoryList.find((i) => String(i.id) === String(selectedInventoryId));

  const currentStock = currentItem ? currentItem.currentStock : 0;
  const reservedStock = currentItem ? currentItem.reservedStock : 0;

  // Calculation for live preview
  const parsedQty = parseInt(quantity, 10);
  const isValidNumber = !isNaN(parsedQty) && parsedQty >= 0;

  let calculatedNewStock = currentStock;
  let adjustmentDisplay = '+0';

  if (isValidNumber) {
    if (type === 'ADD STOCK') {
      calculatedNewStock = currentStock + parsedQty;
      adjustmentDisplay = `+${parsedQty}`;
    } else if (type === 'REMOVE STOCK') {
      calculatedNewStock = Math.max(0, currentStock - parsedQty);
      adjustmentDisplay = `-${parsedQty}`;
    } else if (type === 'SET STOCK') {
      calculatedNewStock = parsedQty;
      const diff = parsedQty - currentStock;
      adjustmentDisplay = `${diff >= 0 ? '+' : ''}${diff}`;
    }
  }

  const newReserved = Math.min(reservedStock, calculatedNewStock);
  const newAvailable = Math.max(0, calculatedNewStock - newReserved);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentItem) {
      setError('Please select a valid inventory item to adjust.');
      return;
    }

    if (!quantity || isNaN(parsedQty) || parsedQty < 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    if ((type === 'ADD STOCK' || type === 'REMOVE STOCK') && parsedQty === 0) {
      setError('Adjustment quantity must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adjustStock({
        inventoryId: currentItem.id,
        productId: currentItem.productId,
        warehouseId: currentItem.warehouseId,
        type,
        quantity: parsedQty,
        reason,
        reference,
        notes,
        performedBy,
      });

      if (res) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to adjust stock. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="form-section-icon" style={{ width: 34, height: 34 }}>
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h3 className="modal-title">Inventory Stock Adjustment</h3>
              <p className="modal-subtitle">
                Reconcile physical on-hand stock and generate an audit ledger movement
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
          <div className="modal-body">
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

            {/* Target Item Selection (if not locked to a specific item) */}
            {!item ? (
              <div className="form-field full-width">
                <label htmlFor="target-inventory" className="form-label required">
                  Target Product & Warehouse Location
                </label>
                <select
                  id="target-inventory"
                  className="form-select"
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                >
                  {inventoryList.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.productName} ({inv.sku}) &bull; {inv.warehouseName} [Current: {inv.currentStock} units]
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                    {currentItem.productName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>
                    <span className="sku-code" style={{ marginRight: 6 }}>{currentItem.sku}</span>
                    <span>&bull; {currentItem.warehouseName}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Current On-Hand</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {currentItem.currentStock} units
                  </div>
                </div>
              </div>
            )}

            {/* Adjustment Type Selector */}
            <div className="form-field full-width">
              <label className="form-label required">Adjustment Action</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setType('ADD STOCK')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: type === 'ADD STOCK' ? '#ecfdf5' : '#ffffff',
                    borderColor: type === 'ADD STOCK' ? '#10b981' : '#cbd5e1',
                    color: type === 'ADD STOCK' ? '#065f46' : '#475569',
                  }}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setType('REMOVE STOCK')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: type === 'REMOVE STOCK' ? '#fef2f2' : '#ffffff',
                    borderColor: type === 'REMOVE STOCK' ? '#ef4444' : '#cbd5e1',
                    color: type === 'REMOVE STOCK' ? '#991b1b' : '#475569',
                  }}
                >
                  - Remove Stock
                </button>
                <button
                  type="button"
                  onClick={() => setType('SET STOCK')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: type === 'SET STOCK' ? '#eff6ff' : '#ffffff',
                    borderColor: type === 'SET STOCK' ? '#3b82f6' : '#cbd5e1',
                    color: type === 'SET STOCK' ? '#1e40af' : '#475569',
                  }}
                >
                  = Set Stock
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="form-field full-width">
              <label htmlFor="adj-qty" className="form-label required">
                {type === 'SET STOCK' ? 'New On-Hand Stock Count' : 'Quantity to Adjust (Units)'}
              </label>
              <input
                type="number"
                id="adj-qty"
                min="0"
                className="form-input"
                placeholder={type === 'SET STOCK' ? 'e.g. 150' : 'e.g. 25'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </div>

            {/* Live Calculation Preview Banner */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Current Stock</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>{currentStock}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Adjustment</span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: type === 'REMOVE STOCK' ? '#dc2626' : '#059669',
                  }}
                >
                  {adjustmentDisplay}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>New On-Hand</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {calculatedNewStock}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>New Available</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>
                  {newAvailable}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="form-field full-width">
              <label htmlFor="adj-reason" className="form-label required">
                Adjustment Reason
              </label>
              <select
                id="adj-reason"
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference & Performed By */}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="adj-ref" className="form-label">
                  Audit / PO Reference (Optional)
                </label>
                <input
                  type="text"
                  id="adj-ref"
                  className="form-input"
                  placeholder="e.g. AUD-2026-081"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="adj-user" className="form-label">
                  Authorized Personnel
                </label>
                <input
                  type="text"
                  id="adj-user"
                  className="form-input"
                  placeholder="e.g. System Administrator"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-field full-width">
              <label htmlFor="adj-notes" className="form-label">
                Operational Notes / Justification
              </label>
              <textarea
                id="adj-notes"
                rows={2}
                className="form-textarea"
                placeholder="Details regarding physical count verification or batch tags..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-sm btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-sm btn-primary"
              disabled={isSubmitting}
            >
              <CheckCircle2 size={15} />
              <span>{isSubmitting ? 'Adjusting...' : 'Confirm Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Reusable modal for performing stock adjustments.
 */
export default function StockAdjustmentModal({
  isOpen,
  item = null,
  inventoryList = [],
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <StockAdjustmentDialog
      key={item?.id || 'general-adjustment'}
      item={item}
      inventoryList={inventoryList}
      onClose={onClose}
    />
  );
}
