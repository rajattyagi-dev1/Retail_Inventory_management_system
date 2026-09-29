import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/products/ProductForm';

/**
 * Add Product Page (/products/new).
 */
export default function AddProductPage() {
  const navigate = useNavigate();
  const { categories, addProduct } = useProducts();

  const handleCreateProduct = (formData) => {
    addProduct(formData);
    navigate('/products');
  };

  return (
    <div className="product-module-page">
      <ProductForm
        isEditMode={false}
        categories={categories}
        onSubmit={handleCreateProduct}
      />
    </div>
  );
}
