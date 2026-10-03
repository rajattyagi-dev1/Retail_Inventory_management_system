import React from 'react';
import { Warehouse, MapPin, AlertCircle } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useInventory } from '../../hooks/useInventory';

/**
 * Warehouse-wise inventory overview widget.
 */
export default function InventoryOverview() {
  const { warehouses, loading: whLoading } = useWarehouses();
  const { inventory, loading: invLoading } = useInventory();

  const loading = whLoading || invLoading;

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 0 20px' }}>
        <SectionHeader
          title="Warehouse Stock Overview"
          subtitle="Regional distribution and capacity utilization across storage hubs"
        />
      </div>

      <div className="warehouse-list">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading warehouse distribution...
          </div>
        ) : warehouses.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No operational warehouses found.
          </div>
        ) : (
          warehouses.map((wh) => {
            const whInventory = inventory.filter((i) => String(i.warehouseId) === String(wh.id));
            const totalStock = whInventory.reduce((acc, i) => acc + (Number(i.currentStock) || 0), 0);
            const lowStockCount = whInventory.filter(
              (i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK'
            ).length;
            const skusCount = whInventory.length;
            const capacity = Number(wh.capacity) || 50000;
            const utilization = Math.min(100, Math.round((totalStock / capacity) * 100));

            // Color based on capacity utilization
            let barColor = '#3b82f6';
            if (utilization > 80) barColor = '#f59e0b';
            if (utilization > 90) barColor = '#ef4444';

            return (
              <div key={wh.id} className="warehouse-item">
                <div className="warehouse-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Warehouse size={16} color="#475569" />
                    <div>
                      <div className="warehouse-name">{wh.name}</div>
                      <div className="warehouse-location">
                        <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                        {wh.location || wh.city || 'India'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                      {totalStock.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>units</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {utilization}% Capacity
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-track" title={`${utilization}% utilized`}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${utilization}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                <div className="warehouse-meta-row">
                  <span>SKUs Managed: <strong>{skusCount}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: lowStockCount > 0 ? '#b45309' : '#047857' }}>
                    <AlertCircle size={12} />
                    <span>{lowStockCount} Low stock alerts</span>
                  </span>
                  <span>Limit: {capacity.toLocaleString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
