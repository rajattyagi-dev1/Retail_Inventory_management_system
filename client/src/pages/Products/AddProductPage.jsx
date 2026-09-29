import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/products/ProductForm';

/**
 * Add Product Page (/products/new).
 * Connects ProductForm to POST /api/products via ProductContext.
 */
export default function AddProductPage() {
  const navigate = useNavigate();
  const { categories, addProduct } = useProducts();
  const [apiError, setApiError] = useState(null);

  const handleCreateProduct = async (formData) => {
    setApiError(null);
    try {
      await addProduct(formData);
      navigate('/products');
    } catch (err) {
      setApiError(err.message || 'Failed to create product in database.');
      throw err;
    }
  };

  return (
    <div className="product-module-page">
      <ProductForm
        isEditMode={false}
        categories={categories}
        onSubmit={handleCreateProduct}
        apiError={apiError}
      />
    </div>
  );
}
