import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/products/ProductForm';
import EmptyState from '../../components/common/EmptyState';

/**
 * Edit Product Page (/products/:id/edit).
 */
export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, categories, updateProduct } = useProducts();

  const product = getProductById(id);

  if (!product) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Product Not Found"
          message={`Unable to find product "${id}" for editing.`}
          action={
            <Link to="/products" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Products</span>
            </Link>
          }
        />
      </div>
    );
  }

  const handleUpdateProduct = (formData) => {
    updateProduct(product.id, formData);
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="product-module-page">
      <ProductForm
        initialData={product}
        isEditMode={true}
        categories={categories}
        onSubmit={handleUpdateProduct}
      />
    </div>
  );
}
