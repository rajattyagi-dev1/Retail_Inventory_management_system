import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from '../../components/products/ProductForm';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

/**
 * Edit Product Page (/products/:id/edit).
 * Connects to GET /api/products/:id and PUT /api/products/:id.
 */
export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProduct, categories, updateProduct } = useProducts();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchProduct(id)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || 'Product not found.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, fetchProduct]);

  if (loading) {
    return (
      <div className="product-module-page" style={{ padding: '60px 0' }}>
        <LoadingState message="Loading product data for editing..." />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Product Not Found"
          message={loadError || `Unable to find product "${id}" for editing.`}
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

  const handleUpdateProduct = async (formData) => {
    setApiError(null);
    try {
      await updateProduct(product.id, formData);
      navigate(`/products/${product.id}`);
    } catch (err) {
      setApiError(err.message || 'Failed to update product in database.');
      throw err;
    }
  };

  return (
    <div className="product-module-page">
      <ProductForm
        initialData={product}
        isEditMode={true}
        categories={categories}
        onSubmit={handleUpdateProduct}
        apiError={apiError}
      />
    </div>
  );
}
