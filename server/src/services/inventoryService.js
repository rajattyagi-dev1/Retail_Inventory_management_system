const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_STOCK_STATUSES = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'];
const ALLOWED_SORT_FIELDS = [
  'currentStock',
  'reservedStock',
  'reorderLevel',
  'createdAt',
  'updatedAt',
  'productName',
  'warehouseName',
  'sku',
];

/**
 * Format inventory object for JSON responses.
 * Computes availableStock and stockStatus dynamically.
 */
const formatInventory = (inv) => {
  if (!inv) return null;

  const currentStock = inv.currentStock !== undefined && inv.currentStock !== null
    ? Number(inv.currentStock)
    : 0;
  const reservedStock = inv.reservedStock !== undefined && inv.reservedStock !== null
    ? Number(inv.reservedStock)
    : 0;
  const reorderLevel = inv.reorderLevel !== undefined && inv.reorderLevel !== null
    ? Number(inv.reorderLevel)
    : 0;

  // availableStock = Math.max(0, currentStock - reservedStock)
  const availableStock = Math.max(0, currentStock - reservedStock);

  // Determine stockStatus
  let stockStatus = 'IN_STOCK';
  if (currentStock === 0) {
    stockStatus = 'OUT_OF_STOCK';
  } else if (currentStock <= reorderLevel) {
    stockStatus = 'LOW_STOCK';
  }

  return {
    id: inv.id,
    productId: inv.productId,
    productName: inv.product?.name || null,
    sku: inv.product?.sku || null,
    category: inv.product?.category
      ? {
          id: inv.product.category.id,
          name: inv.product.category.name,
          slug: inv.product.category.slug,
        }
      : null,
    warehouseId: inv.warehouseId,
    warehouseName: inv.warehouse?.name || null,
    warehouseCode: inv.warehouse?.code || null,
    currentStock,
    reservedStock,
    availableStock,
    reorderLevel,
    stockStatus,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    ...(inv.product && {
      product: {
        id: inv.product.id,
        name: inv.product.name,
        sku: inv.product.sku,
        brand: inv.product.brand || null,
        price: inv.product.price ? Number(inv.product.price) : 0,
        costPrice: inv.product.costPrice ? Number(inv.product.costPrice) : 0,
        status: inv.product.status,
        category: inv.product.category
          ? {
              id: inv.product.category.id,
              name: inv.product.category.name,
              slug: inv.product.category.slug,
            }
          : null,
      },
    }),
    ...(inv.warehouse && {
      warehouse: {
        id: inv.warehouse.id,
        code: inv.warehouse.code,
        name: inv.warehouse.name,
        city: inv.warehouse.city || null,
        state: inv.warehouse.state || null,
        status: inv.warehouse.status || null,
      },
    }),
  };
};

/**
 * Format stock movement object for JSON responses.
 */
const formatStockMovement = (sm) => {
  if (!sm) return null;

  return {
    id: sm.id,
    inventoryId: sm.inventoryId,
    productId: sm.productId,
    productName: sm.product?.name || null,
    sku: sm.product?.sku || null,
    warehouseId: sm.warehouseId,
    warehouseName: sm.warehouse?.name || null,
    warehouseCode: sm.warehouse?.code || null,
    type: sm.type,
    quantity: sm.quantity !== undefined && sm.quantity !== null ? Number(sm.quantity) : 0,
    reference: sm.reference || null,
    performedById: sm.performedById || null,
    performedBy: sm.performedBy || null,
    notes: sm.notes || null,
    createdAt: sm.createdAt,
    ...(sm.product && {
      product: {
        id: sm.product.id,
        name: sm.product.name,
        sku: sm.product.sku,
      },
    }),
    ...(sm.warehouse && {
      warehouse: {
        id: sm.warehouse.id,
        code: sm.warehouse.code,
        name: sm.warehouse.name,
      },
    }),
    ...(sm.performedByUser && {
      performedByUser: {
        id: sm.performedByUser.id,
        name: sm.performedByUser.name,
        email: sm.performedByUser.email,
      },
    }),
  };
};

/**
 * Build Prisma where clause for inventory filtering.
 */
const buildInventoryWhere = ({ search, warehouseId, productId, categoryId, stockStatus }) => {
  const where = {};

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim();
    where.OR = [
      { product: { name: { contains: q } } },
      { product: { sku: { contains: q } } },
      { product: { category: { name: { contains: q } } } },
      { warehouse: { name: { contains: q } } },
      { warehouse: { code: { contains: q } } },
    ];
  }

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim()) {
    where.warehouseId = warehouseId.trim();
  }

  if (productId && typeof productId === 'string' && productId.trim()) {
    where.productId = productId.trim();
  }

  if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
    where.product = {
      ...(where.product || {}),
      categoryId: categoryId.trim(),
    };
  }

  if (stockStatus && typeof stockStatus === 'string') {
    const upper = stockStatus.trim().toUpperCase();
    if (VALID_STOCK_STATUSES.includes(upper)) {
      if (upper === 'OUT_OF_STOCK') {
        where.currentStock = 0;
      } else if (upper === 'LOW_STOCK') {
        where.currentStock = {
          gt: 0,
          lte: prisma.inventory.fields.reorderLevel,
        };
      } else if (upper === 'IN_STOCK') {
        where.currentStock = {
          gt: prisma.inventory.fields.reorderLevel,
        };
      }
    }
  }

  return where;
};

/**
 * Build Prisma orderBy clause for inventory sorting.
 */
const buildInventoryOrderBy = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const cleanSortOrder = ['asc', 'desc'].includes(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  if (sortBy === 'productName') {
    return { product: { name: cleanSortOrder } };
  }
  if (sortBy === 'sku') {
    return { product: { sku: cleanSortOrder } };
  }
  if (sortBy === 'warehouseName') {
    return { warehouse: { name: cleanSortOrder } };
  }
  if (ALLOWED_SORT_FIELDS.includes(sortBy)) {
    return { [sortBy]: cleanSortOrder };
  }

  return { createdAt: 'desc' };
};

/**
 * Inventory Service
 * Contains all business logic, validation, calculations, and Prisma data access.
 */

const getAllInventory = async ({
  page = 1,
  limit = 10,
  search,
  warehouseId,
  productId,
  categoryId,
  stockStatus,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = buildInventoryWhere({ search, warehouseId, productId, categoryId, stockStatus });
  const orderBy = buildInventoryOrderBy(sortBy, sortOrder);

  const [total, inventories] = await Promise.all([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        warehouse: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    data: inventories.map(formatInventory),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
};

const getInventoryById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Inventory ID is required');
  }

  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
    },
  });

  if (!inventory) {
    throw ApiError.notFound('Inventory record not found');
  }

  return formatInventory(inventory);
};

const getInventoryByWarehouse = async (warehouseId, query = {}) => {
  if (!warehouseId || typeof warehouseId !== 'string') {
    throw ApiError.badRequest('Valid Warehouse ID is required');
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  return getAllInventory({
    ...query,
    warehouseId,
  });
};

const getInventoryByProduct = async (productId, query = {}) => {
  if (!productId || typeof productId !== 'string') {
    throw ApiError.badRequest('Valid Product ID is required');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return getAllInventory({
    ...query,
    productId,
  });
};

/**
 * Adjust stock atomically with StockMovement creation inside a Prisma transaction.
 *
 * Supported action types:
 * - ADD (or 'ADD STOCK'): newStock = currentStock + quantity
 * - REMOVE (or 'REMOVE STOCK'): newStock = currentStock - quantity (must NOT become negative)
 * - SET (or 'SET STOCK'): newStock = quantity (must be >= 0)
 */
const adjustStock = async ({
  inventoryId,
  productId,
  warehouseId,
  type,
  quantity,
  reason,
  reference,
  notes,
  performedBy,
  performedById,
}) => {
  // Validate adjustment type
  if (!type || typeof type !== 'string') {
    throw ApiError.badRequest('Adjustment type is required (ADD, REMOVE, or SET)');
  }

  let normalizedType = type.trim().toUpperCase();
  if (normalizedType === 'ADD STOCK' || normalizedType === 'ADD') {
    normalizedType = 'ADD';
  } else if (normalizedType === 'REMOVE STOCK' || normalizedType === 'REMOVE') {
    normalizedType = 'REMOVE';
  } else if (normalizedType === 'SET STOCK' || normalizedType === 'SET') {
    normalizedType = 'SET';
  } else {
    throw ApiError.badRequest('Invalid adjustment type. Must be ADD, REMOVE, or SET');
  }

  // Validate quantity
  if (quantity === undefined || quantity === null || quantity === '') {
    throw ApiError.badRequest('Adjustment quantity is required');
  }

  const parsedQty = Number.isInteger(quantity) ? quantity : parseInt(quantity, 10);
  if (isNaN(parsedQty)) {
    throw ApiError.badRequest('Adjustment quantity must be a valid integer');
  }

  if ((normalizedType === 'ADD' || normalizedType === 'REMOVE') && parsedQty <= 0) {
    throw ApiError.badRequest('Adjustment quantity must be a positive integer greater than zero');
  }

  if (normalizedType === 'SET' && parsedQty < 0) {
    throw ApiError.badRequest('Stock quantity cannot be negative');
  }

  // Target item identification validation
  const hasInventoryId = Boolean(inventoryId && typeof inventoryId === 'string' && inventoryId.trim());
  const hasProductAndWarehouse = Boolean(
    productId && typeof productId === 'string' && productId.trim() &&
    warehouseId && typeof warehouseId === 'string' && warehouseId.trim()
  );

  if (!hasInventoryId && !hasProductAndWarehouse) {
    throw ApiError.badRequest('Either inventoryId or both productId and warehouseId are required');
  }

  // Execute atomic transaction
  return await prisma.$transaction(async (tx) => {
    let targetInventory = null;

    if (hasInventoryId) {
      targetInventory = await tx.inventory.findUnique({
        where: { id: inventoryId.trim() },
        include: {
          product: { include: { category: true } },
          warehouse: true,
        },
      });

      if (!targetInventory) {
        throw ApiError.notFound('Inventory record not found');
      }
    } else {
      const cleanProductId = productId.trim();
      const cleanWarehouseId = warehouseId.trim();

      // Verify product exists
      const product = await tx.product.findUnique({
        where: { id: cleanProductId },
      });
      if (!product) {
        throw ApiError.notFound('Product not found');
      }

      // Verify warehouse exists
      const warehouse = await tx.warehouse.findUnique({
        where: { id: cleanWarehouseId },
      });
      if (!warehouse) {
        throw ApiError.notFound('Warehouse not found');
      }

      // Check if inventory record already exists for (productId, warehouseId)
      targetInventory = await tx.inventory.findUnique({
        where: {
          unique_product_warehouse_inventory: {
            productId: cleanProductId,
            warehouseId: cleanWarehouseId,
          },
        },
        include: {
          product: { include: { category: true } },
          warehouse: true,
        },
      });

      // If no inventory record exists yet
      if (!targetInventory) {
        if (normalizedType === 'REMOVE') {
          throw ApiError.badRequest('Cannot remove stock: inventory record does not exist and on-hand stock is 0');
        }

        const initialStock = normalizedType === 'ADD' ? parsedQty : parsedQty;
        const diff = initialStock;

        // Create new inventory record
        const newInventory = await tx.inventory.create({
          data: {
            productId: cleanProductId,
            warehouseId: cleanWarehouseId,
            currentStock: initialStock,
            reservedStock: 0,
            reorderLevel: 10,
          },
          include: {
            product: { include: { category: true } },
            warehouse: true,
          },
        });

        // Validate optional performedById
        let validUserId = null;
        if (performedById && typeof performedById === 'string' && performedById.trim()) {
          const user = await tx.user.findUnique({ where: { id: performedById.trim() } });
          if (user) {
            validUserId = user.id;
          }
        }

        const noteParts = [reason, notes].filter((n) => Boolean(n && String(n).trim()));
        const combinedNotes = noteParts.length > 0 ? noteParts.map((n) => String(n).trim()).join(' - ') : null;
        const refCode = (reference && String(reference).trim()) || `ADJ-${Date.now().toString().slice(-6)}`;
        const performerName = (performedBy && String(performedBy).trim()) || 'Inventory Supervisor';

        // Create stock movement
        const movement = await tx.stockMovement.create({
          data: {
            inventoryId: newInventory.id,
            productId: newInventory.productId,
            warehouseId: newInventory.warehouseId,
            type: 'ADJUSTMENT',
            quantity: diff,
            reference: refCode,
            performedById: validUserId,
            performedBy: performerName,
            notes: combinedNotes,
          },
          include: {
            product: true,
            warehouse: true,
            performedByUser: true,
          },
        });

        return {
          inventory: formatInventory(newInventory),
          movement: formatStockMovement(movement),
        };
      }
    }

    // Existing inventory record adjustment
    const currentStock = targetInventory.currentStock;
    let newStock = currentStock;
    let diff = 0;

    if (normalizedType === 'ADD') {
      newStock = currentStock + parsedQty;
      diff = parsedQty;
    } else if (normalizedType === 'REMOVE') {
      if (parsedQty > currentStock) {
        throw ApiError.badRequest(
          `Cannot remove ${parsedQty} units. Current stock is only ${currentStock} units.`
        );
      }
      newStock = currentStock - parsedQty;
      diff = -parsedQty;
    } else if (normalizedType === 'SET') {
      newStock = parsedQty;
      diff = newStock - currentStock;
    }

    // Update inventory record
    const updatedInventory = await tx.inventory.update({
      where: { id: targetInventory.id },
      data: { currentStock: newStock },
      include: {
        product: { include: { category: true } },
        warehouse: true,
      },
    });

    // Validate optional performedById
    let validUserId = null;
    if (performedById && typeof performedById === 'string' && performedById.trim()) {
      const user = await tx.user.findUnique({ where: { id: performedById.trim() } });
      if (user) {
        validUserId = user.id;
      }
    }

    const noteParts = [reason, notes].filter((n) => Boolean(n && String(n).trim()));
    const combinedNotes = noteParts.length > 0 ? noteParts.map((n) => String(n).trim()).join(' - ') : null;
    const refCode = (reference && String(reference).trim()) || `ADJ-${Date.now().toString().slice(-6)}`;
    const performerName = (performedBy && String(performedBy).trim()) || 'Inventory Supervisor';

    // Create stock movement ledger entry
    const movement = await tx.stockMovement.create({
      data: {
        inventoryId: updatedInventory.id,
        productId: updatedInventory.productId,
        warehouseId: updatedInventory.warehouseId,
        type: 'ADJUSTMENT',
        quantity: diff,
        reference: refCode,
        performedById: validUserId,
        performedBy: performerName,
        notes: combinedNotes,
      },
      include: {
        product: true,
        warehouse: true,
        performedByUser: true,
      },
    });

    return {
      inventory: formatInventory(updatedInventory),
      movement: formatStockMovement(movement),
    };
  });
};

module.exports = {
  getAllInventory,
  getInventoryById,
  getInventoryByWarehouse,
  getInventoryByProduct,
  adjustStock,
  formatInventory,
  formatStockMovement,
};
