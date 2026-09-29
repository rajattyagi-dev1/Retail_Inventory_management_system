import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useWarehouses } from '../../hooks/useWarehouses';
import WarehouseForm from '../../components/warehouses/WarehouseForm';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

/**
 * Edit Warehouse Page (/warehouses/:id/edit).
 * Connects to GET /api/warehouses/:id and PUT /api/warehouses/:id.
 */
export default function EditWarehousePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchWarehouse, updateWarehouse } = useWarehouses();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchWarehouse(id)
      .then((data) => {
        if (isMounted) {
          setWarehouse(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || 'Warehouse not found.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, fetchWarehouse]);

  if (loading) {
    return (
      <div className="product-module-page" style={{ padding: '60px 0' }}>
        <LoadingState message="Loading warehouse data for editing..." />
      </div>
    );
  }

  if (loadError || !warehouse) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Warehouse Not Found"
          message={loadError || `Unable to find warehouse "${id}" for editing.`}
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

  const handleUpdateWarehouse = async (formData) => {
    setApiError(null);
    try {
      await updateWarehouse(warehouse.id, formData);
      navigate(`/warehouses/${warehouse.id}`);
    } catch (err) {
      setApiError(err.message || 'Failed to update warehouse in database.');
      throw err;
    }
  };

  return (
    <div className="product-module-page">
      <WarehouseForm
        initialData={warehouse}
        isEditMode={true}
        onSubmit={handleUpdateWarehouse}
        apiError={apiError}
      />
    </div>
  );
}
