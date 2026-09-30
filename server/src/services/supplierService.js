const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE'];
const ALLOWED_SORT_FIELDS = [
  'name',
  'supplierCode',
  'companyName',
  'city',
  'status',
  'createdAt',
  'updatedAt',
];

/**
 * Format raw supplier object from Prisma into clean JSON output.
 */
const formatSupplier = (sup) => {
  if (!sup) return null;

  const productsSupplied =
    sup._count?.supplierProducts ??
    (Array.isArray(sup.supplierProducts) ? sup.supplierProducts.length : 0);
  const purchaseOrderCount =
    sup._count?.purchaseOrders ??
    (Array.isArray(sup.purchaseOrders) ? sup.purchaseOrders.length : 0);

  return {
    id: sup.id,
    supplierCode: sup.supplierCode,
    name: sup.name,
    companyName: sup.companyName || null,
    category: sup.category || null,
    contactPerson: sup.contactPerson || null,
    email: sup.email || null,
    phone: sup.phone || null,
    address: sup.address || null,
    city: sup.city || null,
    state: sup.state || null,
    pincode: sup.pincode || null,
    gstNumber: sup.gstNumber || null,
    paymentTerms: sup.paymentTerms || 'Net 30',
    status: sup.status,
    productsSupplied,
    purchaseOrderCount,
    createdAt: sup.createdAt,
    updatedAt: sup.updatedAt,
    ...(sup.supplierProducts && {
      supplierProducts: sup.supplierProducts.map((sp) => ({
        id: sp.id,
        supplierId: sp.supplierId,
        productId: sp.productId,
        supplierSku: sp.supplierSku || null,
        costPrice: sp.costPrice ? Number(sp.costPrice) : null,
        leadTimeDays: sp.leadTimeDays ?? 7,
        isPrimary: Boolean(sp.isPrimary),
        product: sp.product
          ? {
              id: sp.product.id,
              name: sp.product.name,
              sku: sp.product.sku,
              brand: sp.product.brand || null,
              category: sp.product.category?.name || null,
              unit: sp.product.unit || 'Pieces',
              costPrice: sp.product.costPrice ? Number(sp.product.costPrice) : 0,
              sellingPrice: sp.product.sellingPrice ? Number(sp.product.sellingPrice) : 0,
              status: sp.product.status,
            }
          : null,
      })),
    }),
  };
};

/**
 * List suppliers with pagination, search, status filtering, and sorting.
 */
const getAllSuppliers = async ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status && typeof status === 'string' && status.trim()) {
    const normalizedStatus = status.trim().toUpperCase();
    if (!VALID_SUPPLIER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status filter. Allowed values: ${VALID_SUPPLIER_STATUSES.join(', ')}`
      );
    }
    where.status = normalizedStatus;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { name: { contains: query } },
      { supplierCode: { contains: query } },
      { companyName: { contains: query } },
      { contactPerson: { contains: query } },
      { email: { contains: query } },
      { city: { contains: query } },
    ];
  }

  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder =
    String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        _count: {
          select: {
            supplierProducts: true,
            purchaseOrders: true,
          },
        },
      },
    }),
  ]);

  return {
    data: suppliers.map(formatSupplier),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/**
 * Get supplier details by ID including associated products.
 */
const getSupplierById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Supplier ID is required');
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: id.trim() },
    include: {
      _count: {
        select: {
          supplierProducts: true,
          purchaseOrders: true,
        },
      },
      supplierProducts: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  return formatSupplier(supplier);
};

/**
 * Generate a unique supplier code if not provided.
 */
const generateSupplierCode = async (city = 'IND') => {
  const prefix = `SUP-${(city || 'IND').slice(0, 3).toUpperCase()}`;
  for (let i = 0; i < 5; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-${randomSuffix}`;
    const existing = await prisma.supplier.findUnique({
      where: { supplierCode: candidate },
    });
    if (!existing) return candidate;
  }
  return `SUP-${Date.now().toString().slice(-6)}`;
};

/**
 * Create a new supplier.
 */
const createSupplier = async (data) => {
  if (!data || typeof data !== 'object') {
    throw ApiError.badRequest('Request body must be an object');
  }

  const {
    name,
    supplierCode,
    companyName,
    category,
    contactPerson,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    gstNumber,
    paymentTerms,
    status = 'ACTIVE',
  } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Supplier name is required');
  }

  if (email && typeof email === 'string' && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw ApiError.badRequest('Invalid email address format');
    }
  }

  let normalizedStatus = 'ACTIVE';
  if (status) {
    normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_SUPPLIER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status. Allowed values: ${VALID_SUPPLIER_STATUSES.join(', ')}`
      );
    }
  }

  let finalCode = supplierCode && typeof supplierCode === 'string' ? supplierCode.trim() : null;
  if (finalCode) {
    const existing = await prisma.supplier.findUnique({
      where: { supplierCode: finalCode },
    });
    if (existing) {
      throw ApiError.conflict(`Supplier with code "${finalCode}" already exists`);
    }
  } else {
    finalCode = await generateSupplierCode(city);
  }

  const newSupplier = await prisma.supplier.create({
    data: {
      name: name.trim(),
      supplierCode: finalCode,
      companyName: companyName && typeof companyName === 'string' ? companyName.trim() : null,
      category: category && typeof category === 'string' ? category.trim() : null,
      contactPerson: contactPerson && typeof contactPerson === 'string' ? contactPerson.trim() : null,
      email: email && typeof email === 'string' ? email.trim() : null,
      phone: phone && typeof phone === 'string' ? phone.trim() : null,
      address: address && typeof address === 'string' ? address.trim() : null,
      city: city && typeof city === 'string' ? city.trim() : null,
      state: state && typeof state === 'string' ? state.trim() : null,
      pincode: pincode && typeof pincode === 'string' ? pincode.trim() : null,
      gstNumber: gstNumber && typeof gstNumber === 'string' ? gstNumber.trim() : null,
      paymentTerms: paymentTerms && typeof paymentTerms === 'string' ? paymentTerms.trim() : 'Net 30',
      status: normalizedStatus,
    },
    include: {
      _count: {
        select: {
          supplierProducts: true,
          purchaseOrders: true,
        },
      },
    },
  });

  return formatSupplier(newSupplier);
};

/**
 * Update an existing supplier.
 */
const updateSupplier = async (id, data) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Supplier ID is required');
  }

  const existingSupplier = await prisma.supplier.findUnique({
    where: { id: id.trim() },
  });

  if (!existingSupplier) {
    throw ApiError.notFound('Supplier not found');
  }

  const {
    name,
    supplierCode,
    companyName,
    category,
    contactPerson,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    gstNumber,
    paymentTerms,
    status,
  } = data;

  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Supplier name cannot be empty');
    }
    updateData.name = name.trim();
  }

  if (supplierCode !== undefined) {
    if (typeof supplierCode !== 'string' || !supplierCode.trim()) {
      throw ApiError.badRequest('Supplier code cannot be empty');
    }
    const cleanCode = supplierCode.trim();
    if (cleanCode !== existingSupplier.supplierCode) {
      const codeExists = await prisma.supplier.findUnique({
        where: { supplierCode: cleanCode },
      });
      if (codeExists) {
        throw ApiError.conflict(`Supplier with code "${cleanCode}" already exists`);
      }
      updateData.supplierCode = cleanCode;
    }
  }

  if (email !== undefined) {
    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw ApiError.badRequest('Invalid email address format');
      }
      updateData.email = email.trim();
    } else {
      updateData.email = null;
    }
  }

  if (status !== undefined) {
    const normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_SUPPLIER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status. Allowed values: ${VALID_SUPPLIER_STATUSES.join(', ')}`
      );
    }
    updateData.status = normalizedStatus;
  }

  if (companyName !== undefined) updateData.companyName = companyName ? String(companyName).trim() : null;
  if (category !== undefined) updateData.category = category ? String(category).trim() : null;
  if (contactPerson !== undefined) updateData.contactPerson = contactPerson ? String(contactPerson).trim() : null;
  if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
  if (address !== undefined) updateData.address = address ? String(address).trim() : null;
  if (city !== undefined) updateData.city = city ? String(city).trim() : null;
  if (state !== undefined) updateData.state = state ? String(state).trim() : null;
  if (pincode !== undefined) updateData.pincode = pincode ? String(pincode).trim() : null;
  if (gstNumber !== undefined) updateData.gstNumber = gstNumber ? String(gstNumber).trim() : null;
  if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms ? String(paymentTerms).trim() : 'Net 30';

  const updatedSupplier = await prisma.supplier.update({
    where: { id: id.trim() },
    data: updateData,
    include: {
      _count: {
        select: {
          supplierProducts: true,
          purchaseOrders: true,
        },
      },
    },
  });

  return formatSupplier(updatedSupplier);
};

/**
 * Change supplier status (ACTIVE / INACTIVE).
 */
const updateSupplierStatus = async (id, status) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Supplier ID is required');
  }

  if (!status || typeof status !== 'string') {
    throw ApiError.badRequest('Status is required');
  }

  const normalizedStatus = status.trim().toUpperCase();
  if (!VALID_SUPPLIER_STATUSES.includes(normalizedStatus)) {
    throw ApiError.badRequest(
      `Invalid status. Allowed values: ${VALID_SUPPLIER_STATUSES.join(', ')}`
    );
  }

  const existingSupplier = await prisma.supplier.findUnique({
    where: { id: id.trim() },
  });

  if (!existingSupplier) {
    throw ApiError.notFound('Supplier not found');
  }

  const updatedSupplier = await prisma.supplier.update({
    where: { id: id.trim() },
    data: { status: normalizedStatus },
    include: {
      _count: {
        select: {
          supplierProducts: true,
          purchaseOrders: true,
        },
      },
    },
  });

  return formatSupplier(updatedSupplier);
};

/**
 * Get products linked to a supplier.
 */
const getSupplierProducts = async (supplierId) => {
  if (!supplierId || typeof supplierId !== 'string') {
    throw ApiError.badRequest('Supplier ID is required');
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId.trim() },
  });

  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  const supplierProducts = await prisma.supplierProduct.findMany({
    where: { supplierId: supplierId.trim() },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return supplierProducts.map((sp) => ({
    id: sp.id,
    supplierId: sp.supplierId,
    productId: sp.productId,
    supplierSku: sp.supplierSku || null,
    costPrice: sp.costPrice ? Number(sp.costPrice) : null,
    leadTimeDays: sp.leadTimeDays ?? 7,
    isPrimary: Boolean(sp.isPrimary),
    createdAt: sp.createdAt,
    product: sp.product
      ? {
          id: sp.product.id,
          name: sp.product.name,
          sku: sp.product.sku,
          brand: sp.product.brand || null,
          category: sp.product.category?.name || null,
          unit: sp.product.unit || 'Pieces',
          costPrice: sp.product.costPrice ? Number(sp.product.costPrice) : 0,
          sellingPrice: sp.product.sellingPrice ? Number(sp.product.sellingPrice) : 0,
          status: sp.product.status,
        }
      : null,
  }));
};

/**
 * Associate a product with a supplier.
 */
const addSupplierProduct = async (supplierId, data) => {
  if (!supplierId || typeof supplierId !== 'string') {
    throw ApiError.badRequest('Supplier ID is required');
  }

  if (!data || typeof data !== 'object') {
    throw ApiError.badRequest('Request body must be an object');
  }

  const { productId, supplierSku, costPrice, leadTimeDays, isPrimary = false } = data;

  if (!productId || typeof productId !== 'string' || !productId.trim()) {
    throw ApiError.badRequest('Product ID is required');
  }

  const cleanSupplierId = supplierId.trim();
  const cleanProductId = productId.trim();

  // Verify supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: cleanSupplierId },
  });
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: cleanProductId },
    include: { category: true },
  });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check unique constraint [supplierId, productId]
  const existing = await prisma.supplierProduct.findUnique({
    where: {
      unique_supplier_product: {
        supplierId: cleanSupplierId,
        productId: cleanProductId,
      },
    },
  });
  if (existing) {
    throw ApiError.conflict('This product is already associated with this supplier');
  }

  const created = await prisma.supplierProduct.create({
    data: {
      supplierId: cleanSupplierId,
      productId: cleanProductId,
      supplierSku: supplierSku && typeof supplierSku === 'string' ? supplierSku.trim() : null,
      costPrice: costPrice !== undefined && costPrice !== null && costPrice !== '' ? Number(costPrice) : null,
      leadTimeDays: leadTimeDays !== undefined && leadTimeDays !== null ? parseInt(leadTimeDays, 10) : 7,
      isPrimary: Boolean(isPrimary),
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  return {
    id: created.id,
    supplierId: created.supplierId,
    productId: created.productId,
    supplierSku: created.supplierSku || null,
    costPrice: created.costPrice ? Number(created.costPrice) : null,
    leadTimeDays: created.leadTimeDays ?? 7,
    isPrimary: Boolean(created.isPrimary),
    createdAt: created.createdAt,
    product: {
      id: created.product.id,
      name: created.product.name,
      sku: created.product.sku,
      brand: created.product.brand || null,
      category: created.product.category?.name || null,
      unit: created.product.unit || 'Pieces',
      costPrice: created.product.costPrice ? Number(created.product.costPrice) : 0,
      sellingPrice: created.product.sellingPrice ? Number(created.product.sellingPrice) : 0,
      status: created.product.status,
    },
  };
};

/**
 * Remove product from supplier.
 */
const removeSupplierProduct = async (supplierId, productId) => {
  if (!supplierId || typeof supplierId !== 'string') {
    throw ApiError.badRequest('Supplier ID is required');
  }
  if (!productId || typeof productId !== 'string') {
    throw ApiError.badRequest('Product ID is required');
  }

  const cleanSupplierId = supplierId.trim();
  const cleanProductId = productId.trim();

  const existing = await prisma.supplierProduct.findUnique({
    where: {
      unique_supplier_product: {
        supplierId: cleanSupplierId,
        productId: cleanProductId,
      },
    },
  });

  if (!existing) {
    throw ApiError.notFound('Supplier-product association not found');
  }

  await prisma.supplierProduct.delete({
    where: { id: existing.id },
  });

  return { message: 'Product removed from supplier successfully' };
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  getSupplierProducts,
  addSupplierProduct,
  removeSupplierProduct,
  formatSupplier,
};
