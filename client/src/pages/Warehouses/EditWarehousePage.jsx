import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useWarehouses } from '../../hooks/useWarehouses';
import WarehouseForm from '../../components/warehouses/WarehouseForm';
import EmptyState from '../../components/common/EmptyState';

/**
 * Edit Warehouse Page (/warehouses/:id/edit).
 */
export default function EditWarehousePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWarehouseById, updateWarehouse } = useWarehouses();

  const warehouse = getWarehouseById(id);

  if (!warehouse) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Warehouse Not Found"
          message={`Unable to find warehouse "${id}" for editing.`}
          action={
            <Link to="/warehouses" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Warehouses</span>
            </Link>
          }
        />
      </div>
    );
  }

  const handleUpdateWarehouse = (formData) => {
    updateWarehouse(warehouse.id, formData);
    navigate(`/warehouses/${warehouse.id}`);
  };

  return (
    <div className="product-module-page">
      <WarehouseForm
        initialData={warehouse}
        isEditMode={true}
        onSubmit={handleUpdateWarehouse}
      />
    </div>
  );
}
