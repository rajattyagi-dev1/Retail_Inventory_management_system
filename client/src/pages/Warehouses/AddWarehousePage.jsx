import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouses } from '../../hooks/useWarehouses';
import WarehouseForm from '../../components/warehouses/WarehouseForm';

/**
 * Add Warehouse Page (/warehouses/new).
 * Connects WarehouseForm to POST /api/warehouses via WarehouseContext.
 */
export default function AddWarehousePage() {
  const navigate = useNavigate();
  const { addWarehouse } = useWarehouses();
  const [apiError, setApiError] = useState(null);

  const handleCreateWarehouse = async (formData) => {
    setApiError(null);
    try {
      const newWh = await addWarehouse(formData);
      navigate(`/warehouses/${newWh.id}`);
    } catch (err) {
      setApiError(err.message || 'Failed to create warehouse in database.');
      throw err;
    }
  };

  return (
    <div className="product-module-page">
      <WarehouseForm
        isEditMode={false}
        onSubmit={handleCreateWarehouse}
        apiError={apiError}
      />
    </div>
  );
}
