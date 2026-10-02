import React, { useState, useEffect, useCallback } from 'react';
import { ProductContext } from './productContextInstance';
import productService from '../services/productService';
import categoryService from '../services/categoryService';

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // CATEGORIES OPERATIONS
  // ==========================================

  const fetchCategories = useCallback(async (params = { limit: 100 }) => {
    try {
      const result = await categoryService.getCategories(params);
      setCategories(result.data);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // Keep existing categories on failure to avoid UI breaks
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      setCategories((prev) => [newCategory, ...prev]);
      showToast(`Category "${newCategory.name}" created successfully.`, 'success');
      return newCategory;
    } catch (err) {
      const msg = err.message || 'Failed to create category.';
      showToast(msg, 'error');
      throw err;
    }
  }, [showToast]);

  const updateCategory = useCallback(async (id, categoryData) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, categoryData);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      showToast(`Category "${updatedCategory.name}" updated successfully.`, 'success');
      return updatedCategory;
    } catch (err) {
      const msg = err.message || 'Failed to update category.';
      showToast(msg, 'error');
      throw err;
    }
  }, [showToast]);

  const updateCategoryStatus = useCallback(async (id, status) => {
    try {
      const updatedCategory = await categoryService.updateCategoryStatus(id, status);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      showToast(`Category "${updatedCategory.name}" set to ${updatedCategory.status}.`, 'info');
      return updatedCategory;
    } catch (err) {
      const msg = err.message || 'Failed to update category status.';
      showToast(msg, 'error');
      throw err;
    }
  }, [showToast]);

  const toggleCategoryStatus = useCallback(async (id) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;
    const newStatus = existing.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    return updateCategoryStatus(id, newStatus);
  }, [categories, updateCategoryStatus]);

  // Backward-compatible alias
  const addCategory = createCategory;

  // ==========================================
  // PRODUCTS OPERATIONS
  // ==========================================

  const fetchProducts = useCallback(async (params = {}) => {
    try {
      const result = await productService.getProducts(params);
      setProducts(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      return result;
    } catch (err) {
      console.error('Failed to fetch products:', err);
      const msg = err.message || 'Failed to load products from server.';
      setError(msg);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProduct = useCallback(async (id) => {
    try {
      const product = await productService.getProductById(id);
      return product;
    } catch (err) {
      console.error(`Failed to fetch product ${id}:`, err);
      throw err;
    }
  }, []);

  const getProductById = useCallback((id) => {
    if (!id) return undefined;
    return products.find((p) => String(p.id) === String(id) || p.sku === id);
  }, [products]);

  const createProduct = useCallback(async (formData) => {
    try {
      // Resolve categoryId if category was passed as name
      const payload = { ...formData };
      if (!payload.categoryId && payload.category) {
        const matchingCategory = categories.find(
          (c) => c.name.toLowerCase() === String(payload.category).trim().toLowerCase()
        );
        if (matchingCategory) {
          payload.categoryId = matchingCategory.id;
        }
      }

      const newProduct = await productService.createProduct(payload);

      // Prepend to current products list
      setProducts((prev) => [newProduct, ...prev]);

      // Update category count locally or trigger refresh
      setCategories((prev) =>
        prev.map((c) =>
          c.id === newProduct.categoryId || c.name === newProduct.category
            ? { ...c, productCount: (c.productCount || 0) + 1 }
            : c
        )
      );

      showToast(`Product "${newProduct.name}" added successfully.`, 'success');
      return newProduct;
    } catch (err) {
      const msg = err.message || 'Failed to create product.';
      showToast(msg, 'error');
      throw err;
    }
  }, [categories, showToast]);

  const addProduct = createProduct;

  const updateProduct = useCallback(async (id, updatedFields) => {
    try {
      const payload = { ...updatedFields };
      if (!payload.categoryId && payload.category) {
        const matchingCategory = categories.find(
          (c) => c.name.toLowerCase() === String(payload.category).trim().toLowerCase()
        );
        if (matchingCategory) {
          payload.categoryId = matchingCategory.id;
        }
      }

      const updated = await productService.updateProduct(id, payload);
      setProducts((prev) =>
        prev.map((prod) => (String(prod.id) === String(id) ? updated : prod))
      );

      showToast(`Product "${updated.name}" updated successfully.`, 'success');
      return updated;
    } catch (err) {
      const msg = err.message || 'Failed to update product.';
      showToast(msg, 'error');
      throw err;
    }
  }, [categories, showToast]);

  const updateProductStatus = useCallback(async (id, status) => {
    try {
      const updated = await productService.updateProductStatus(id, status);
      setProducts((prev) =>
        prev.map((prod) => (String(prod.id) === String(id) ? updated : prod))
      );
      showToast(`Product "${updated.name}" set to ${updated.status}.`, 'info');
      return updated;
    } catch (err) {
      const msg = err.message || 'Failed to update product status.';
      showToast(msg, 'error');
      throw err;
    }
  }, [showToast]);

  const toggleProductStatus = useCallback(async (id) => {
    const existing = products.find((p) => String(p.id) === String(id));
    if (!existing) return;
    const newStatus = existing.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    return updateProductStatus(id, newStatus);
  }, [products, updateProductStatus]);

  // Initial data loading from server on mount
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      setCategoriesLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        await Promise.all([fetchCategories(), fetchProducts({ page: 1, limit: 10 })]);
      } catch (err) {
        if (active) console.error('Initial catalog load failed:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchCategories, fetchProducts]);

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        categoriesLoading,
        error,
        pagination,
        toast,
        showToast,
        fetchProducts,
        fetchProduct,
        getProductById,
        createProduct,
        addProduct,
        updateProduct,
        updateProductStatus,
        toggleProductStatus,
        fetchCategories,
        createCategory,
        addCategory,
        updateCategory,
        updateCategoryStatus,
        toggleCategoryStatus,
      }}
    >
      {children}

      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`app-toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{toast.message}</span>
        </div>
      )}
    </ProductContext.Provider>
  );
}

export default ProductProvider;
