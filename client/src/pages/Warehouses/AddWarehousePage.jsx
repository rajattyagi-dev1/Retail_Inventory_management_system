import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouses } from '../../hooks/useWarehouses';
import WarehouseForm from '../../components/warehouses/WarehouseForm';

/**
 * Add Warehouse Page (/warehouses/new).
 */
export default function AddWarehousePage() {
  const navigate = useNavigate();
  const { addWarehouse } = useWarehouses();

  const handleCreateWarehouse = (formData) => {
    const newWh = addWarehouse(formData);
    navigate(`/warehouses/${newWh.id}`);
  };

  return (
    <div className="product-module-page">
      <WarehouseForm
        isEditMode={false}
        onSubmit={handleCreateWarehouse}
      />
    </div>
  );
}
