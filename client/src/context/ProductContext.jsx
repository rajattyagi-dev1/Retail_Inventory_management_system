import React, { useState } from 'react';
import { ProductContext } from './productContextInstance';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../utils/productMockData';

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const getProductById = (id) => {
    return products.find((p) => String(p.id) === String(id) || p.sku === id);
  };

  const addProduct = (formData) => {
    const cost = parseFloat(formData.costPrice) || 0;
    const selling = parseFloat(formData.sellingPrice) || 0;
    const reorder = parseInt(formData.reorderLevel, 10) || 0;
    const stock = parseInt(formData.currentStock, 10) || 0;

    let stockStatus = 'In Stock';
    if (stock === 0) {
      stockStatus = 'Out of Stock';
    } else if (stock <= reorder) {
      stockStatus = 'Low Stock';
    }

    const today = new Date().toISOString().split('T')[0];

    const newProduct = {
      id: `prod-${Date.now()}`,
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim() || 'Generic',
      description: formData.description?.trim() || '',
      costPrice: cost,
      sellingPrice: selling,
      unit: formData.unit || 'Pieces',
      reorderLevel: reorder,
      currentStock: stock,
      stockStatus,
      status: formData.status || 'Active',
      imageUrl: formData.imageUrl || '',
      createdDate: today,
      updatedDate: today,
      warehouses: [
        { name: 'Delhi Central Hub', stock: Math.floor(stock * 0.5), location: 'Shelf E-New' },
        { name: 'Mumbai Distribution Center', stock: Math.floor(stock * 0.3), location: 'Shelf W-New' },
        { name: 'Bangalore Fulfillment Hub', stock: Math.floor(stock * 0.2), location: 'Shelf S-New' },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Update category count
    setCategories((prev) =>
      prev.map((c) =>
        c.name === formData.category ? { ...c, productCount: c.productCount + 1 } : c
      )
    );

    showToast(`Product "${newProduct.name}" added successfully.`);
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    const today = new Date().toISOString().split('T')[0];

    setProducts((prev) =>
      prev.map((prod) => {
        if (String(prod.id) !== String(id)) return prod;

        const cost = parseFloat(updatedFields.costPrice) || prod.costPrice;
        const selling = parseFloat(updatedFields.sellingPrice) || prod.sellingPrice;
        const reorder = parseInt(updatedFields.reorderLevel, 10) ?? prod.reorderLevel;
        const stock = parseInt(updatedFields.currentStock, 10) ?? prod.currentStock;

        let stockStatus = prod.stockStatus;
        if (stock === 0) stockStatus = 'Out of Stock';
        else if (stock <= reorder) stockStatus = 'Low Stock';
        else stockStatus = 'In Stock';

        return {
          ...prod,
          ...updatedFields,
          costPrice: cost,
          sellingPrice: selling,
          reorderLevel: reorder,
          currentStock: stock,
          stockStatus,
          updatedDate: today,
        };
      })
    );

    showToast(`Product details updated successfully.`);
  };

  const toggleProductStatus = (id) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (String(p.id) !== String(id)) return p;
        const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
        showToast(`Product "${p.name}" set to ${newStatus}.`, 'info');
        return { ...p, status: newStatus };
      })
    );
  };

  const addCategory = (categoryData) => {
    const today = new Date().toISOString().split('T')[0];
    const newCat = {
      id: `cat-${Date.now()}`,
      name: categoryData.name.trim(),
      description: categoryData.description.trim(),
      productCount: 0,
      status: categoryData.status || 'Active',
      createdDate: today,
    };

    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${newCat.name}" created successfully.`);
    return newCat;
  };

  const updateCategory = (id, updatedData) => {
    setCategories((prev) =>
      prev.map((cat) =>
        String(cat.id) === String(id) ? { ...cat, ...updatedData } : cat
      )
    );
    showToast('Category updated successfully.');
  };

  const toggleCategoryStatus = (id) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (String(c.id) !== String(id)) return c;
        const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        showToast(`Category "${c.name}" status changed to ${newStatus}.`, 'info');
        return { ...c, status: newStatus };
      })
    );
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        toast,
        showToast,
        getProductById,
        addProduct,
        updateProduct,
        toggleProductStatus,
        addCategory,
        updateCategory,
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
