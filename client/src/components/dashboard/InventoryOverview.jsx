import React from 'react';
import { Warehouse, MapPin, AlertCircle } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { MOCK_WAREHOUSE_DATA } from '../../utils/mockData';

/**
 * Warehouse-wise inventory overview widget.
 */
export default function InventoryOverview() {
  return (
    <div className="card">
      <div style={{ padding: '20px 20px 0 20px' }}>
        <SectionHeader
          title="Warehouse Stock Overview"
          subtitle="Regional distribution and capacity utilization across storage hubs"
        />
      </div>

      <div className="warehouse-list">
        {MOCK_WAREHOUSE_DATA.map((wh) => {
          // Color based on capacity utilization
          let barColor = '#3b82f6';
          if (wh.utilization > 80) barColor = '#f59e0b';
          if (wh.utilization > 90) barColor = '#ef4444';

          return (
            <div key={wh.id} className="warehouse-item">
              <div className="warehouse-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Warehouse size={16} color="#475569" />
                  <div>
                    <div className="warehouse-name">{wh.name}</div>
                    <div className="warehouse-location">
                      <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                      {wh.location}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    {wh.totalStock.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>units</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {wh.utilization}% Capacity
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-track" title={`${wh.utilization}% utilized`}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${wh.utilization}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              <div className="warehouse-meta-row">
                <span>SKUs Managed: <strong>{wh.skusCount}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: wh.lowStockCount > 0 ? '#b45309' : '#047857' }}>
                  <AlertCircle size={12} />
                  <span>{wh.lowStockCount} Low stock alerts</span>
                </span>
                <span>Limit: {wh.capacity.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
