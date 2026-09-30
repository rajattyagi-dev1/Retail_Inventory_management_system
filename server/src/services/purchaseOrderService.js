const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const auditLogService = require('./auditLogService');
const notificationService = require('./notificationService');

const VALID_PO_STATUSES = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
];

const ALLOWED_SORT_FIELDS = [
  'poNumber',
  'orderDate',
  'expectedDate',
  'status',
  'total',
  'subtotal',
  'createdAt',
  'updatedAt',
];

/**
 * Format raw purchase order object from Prisma for JSON response.
 */
const formatPurchaseOrder = (po) => {
  if (!po) return null;

  const items = (po.items || []).map((item) => {
    const qty = Number(item.quantity) || 0;
    const recv = Number(item.receivedQuantity) || 0;
    const remaining = Math.max(0, qty - recv);
    const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
    const tax = item.tax ? Number(item.tax) : 0;
    const lineTotal = item.lineTotal ? Number(item.lineTotal) : 0;

    return {
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      productId: item.productId,
      productName: item.product?.name || null,
      sku: item.product?.sku || null,
      quantity: qty,
      receivedQuantity: recv,
      remaining,
      unitPrice,
      tax,
      lineTotal,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            brand: item.product.brand || null,
            unit: item.product.unit || 'Pieces',
            category: item.product.category?.name || null,
            costPrice: item.product.costPrice ? Number(item.product.costPrice) : 0,
            sellingPrice: item.product.sellingPrice ? Number(item.product.sellingPrice) : 0,
            status: item.product.status,
          }
        : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const itemCount = po._count?.items ?? items.length;
  const totalOrderedQuantity = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalReceivedQuantity = items.reduce((acc, it) => acc + it.receivedQuantity, 0);

  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId,
    supplierName: po.supplier?.name || null,
    supplierCode: po.supplier?.supplierCode || null,
    warehouseId: po.warehouseId,
    warehouseName: po.warehouse?.name || null,
    warehouseCode: po.warehouse?.code || null,
    orderDate: po.orderDate,
    expectedDate: po.expectedDate || null,
    status: po.status,
    subtotal: po.subtotal ? Number(po.subtotal) : 0,
    tax: po.tax ? Number(po.tax) : 0,
    total: po.total ? Number(po.total) : 0,
    createdById: po.createdById || null,
    createdBy: po.createdBy || null,
    notes: po.notes || null,
    itemCount,
    totalOrderedQuantity,
    totalReceivedQuantity,
    createdAt: po.createdAt,
    updatedAt: po.updatedAt,
    supplier: po.supplier
      ? {
          id: po.supplier.id,
          supplierCode: po.supplier.supplierCode,
          name: po.supplier.name,
          email: po.supplier.email || null,
          phone: po.supplier.phone || null,
          city: po.supplier.city || null,
          state: po.supplier.state || null,
        }
      : null,
    warehouse: po.warehouse
      ? {
          id: po.warehouse.id,
          code: po.warehouse.code,
          name: po.warehouse.name,
          city: po.warehouse.city || null,
          state: po.warehouse.state || null,
          status: po.warehouse.status || null,
        }
      : null,
    createdByUser: po.createdByUser
      ? {
          id: po.createdByUser.id,
          name: po.createdByUser.name,
          email: po.createdByUser.email,
        }
      : null,
    items,
  };
};

/**
 * Generate a unique PO number if not provided.
 */
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `PO-${year}-${randomSuffix}`;
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNumber: candidate },
    });
    if (!existing) return candidate;
  }
  return `PO-${year}-${Date.now().toString().slice(-6)}`;
};

/**
 * List purchase orders with filtering, search, pagination, and sorting.
 */
const getAllPurchaseOrders = async ({
  page = 1,
  limit = 10,
  search,
  status,
  supplierId,
  warehouseId,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status && typeof status === 'string' && status.trim()) {
    const normalizedStatus = status.trim().toUpperCase();
    if (!VALID_PO_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status filter. Allowed values: ${VALID_PO_STATUSES.join(', ')}`
      );
    }
    where.status = normalizedStatus;
  }

  if (supplierId && typeof supplierId === 'string' && supplierId.trim()) {
    where.supplierId = supplierId.trim();
  }

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim()) {
    where.warehouseId = warehouseId.trim();
  }

  if (search && typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { poNumber: { contains: query } },
      { notes: { contains: query } },
      { supplier: { name: { contains: query } } },
      { warehouse: { name: { contains: query } } },
    ];
  }

  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder =
    String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
  ]);

  return {
    data: orders.map(formatPurchaseOrder),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/**
 * Get single purchase order by ID.
 */
const getPurchaseOrderById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Purchase order ID is required');
  }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: id.trim() },
    include: {
      supplier: true,
      warehouse: true,
      createdByUser: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  if (!po) {
    throw ApiError.notFound('Purchase order not found');
  }

  return formatPurchaseOrder(po);
};

/**
 * Create a new purchase order with line items in an atomic transaction.
 */
const createPurchaseOrder = async (data, actorUser = null) => {
  if (!data || typeof data !== 'object') {
    throw ApiError.badRequest('Request body must be an object');
  }

  const {
    supplierId,
    warehouseId,
    expectedDate,
    notes,
    createdBy,
    createdById,
    poNumber,
    status = 'PENDING',
    items,
  } = data;

  // 1. Validate supplier
  if (!supplierId || typeof supplierId !== 'string' || !supplierId.trim()) {
    throw ApiError.badRequest('Supplier ID is required');
  }
  const cleanSupplierId = supplierId.trim();
  const supplier = await prisma.supplier.findUnique({
    where: { id: cleanSupplierId },
  });
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }

  // 2. Validate warehouse
  if (!warehouseId || typeof warehouseId !== 'string' || !warehouseId.trim()) {
    throw ApiError.badRequest('Warehouse ID is required');
  }
  const cleanWarehouseId = warehouseId.trim();
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: cleanWarehouseId },
  });
  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  // 3. Validate items
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Purchase order must contain at least one line item');
  }

  // Validate status if supplied
  let normalizedStatus = 'PENDING';
  if (status) {
    normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_PO_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status. Allowed values: ${VALID_PO_STATUSES.join(', ')}`
      );
    }
  }

  // Validate poNumber if supplied
  let finalPoNumber = poNumber && typeof poNumber === 'string' ? poNumber.trim() : null;
  if (finalPoNumber) {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNumber: finalPoNumber },
    });
    if (existing) {
      throw ApiError.conflict(`Purchase order with number "${finalPoNumber}" already exists`);
    }
  } else {
    finalPoNumber = await generatePONumber();
  }

  // Process items and verify each product
  let calculatedSubtotal = 0;
  let calculatedTax = 0;
  const processedItems = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.productId || typeof it.productId !== 'string' || !it.productId.trim()) {
      throw ApiError.badRequest(`Item at index ${i} is missing product ID`);
    }

    const cleanProductId = it.productId.trim();
    const product = await prisma.product.findUnique({
      where: { id: cleanProductId },
    });
    if (!product) {
      throw ApiError.notFound(`Product with ID "${cleanProductId}" not found`);
    }

    const qty = parseInt(it.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw ApiError.badRequest(
        `Item at index ${i} has invalid quantity (${it.quantity}). Must be a positive integer greater than zero.`
      );
    }

    let unitPrice = 0;
    if (it.unitPrice !== undefined && it.unitPrice !== null && it.unitPrice !== '') {
      unitPrice = parseFloat(it.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw ApiError.badRequest(`Item at index ${i} has invalid unit price (${it.unitPrice})`);
      }
    } else {
      unitPrice = product.costPrice ? Number(product.costPrice) : 0;
    }

    const lineSubtotal = qty * unitPrice;

    let lineTax = 0;
    if (it.tax !== undefined && it.tax !== null && it.tax !== '') {
      lineTax = parseFloat(it.tax);
      if (isNaN(lineTax) || lineTax < 0) {
        throw ApiError.badRequest(`Item at index ${i} has invalid tax amount (${it.tax})`);
      }
    } else {
      lineTax = Math.round(lineSubtotal * 0.18 * 100) / 100; // 18% standard GST default
    }

    const lineTotal = lineSubtotal + lineTax;

    calculatedSubtotal += lineSubtotal;
    calculatedTax += lineTax;

    processedItems.push({
      productId: cleanProductId,
      quantity: qty,
      receivedQuantity: 0,
      unitPrice,
      tax: lineTax,
      lineTotal,
    });
  }

  const grandTotal = calculatedSubtotal + calculatedTax;

  // Execute atomic transaction for PO and Items
  const createdPO = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber: finalPoNumber,
        supplierId: cleanSupplierId,
        warehouseId: cleanWarehouseId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: normalizedStatus,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        total: grandTotal,
        notes: notes ? String(notes).trim() : null,
        createdBy: createdBy ? String(createdBy).trim() : 'Procurement Officer',
        createdById: createdById && typeof createdById === 'string' ? createdById.trim() : null,
        items: {
          create: processedItems,
        },
      },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return po;
  });

  const formatted = formatPurchaseOrder(createdPO);
  try {
    await auditLogService.logEvent({
      action: 'CREATE',
      module: 'PURCHASE_ORDER',
      entity: 'PurchaseOrder',
      entityId: formatted.id,
      description: `Created purchase order ${formatted.poNumber} for supplier "${formatted.supplierName}" totaling ${formatted.total}`,
      severity: 'INFO',
      userId: actorUser?.id || formatted.createdById || null,
      userName: actorUser?.name || formatted.createdBy || null,
      userRole: actorUser?.role || null,
    });
  } catch (err) {
    console.error('Failed to log PO create audit:', err.message);
  }

  return formatted;
};

/**
 * Update an existing purchase order.
 */
const updatePurchaseOrder = async (id, data) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Purchase order ID is required');
  }

  const cleanId = id.trim();
  const existingPO = await prisma.purchaseOrder.findUnique({
    where: { id: cleanId },
    include: { items: true },
  });

  if (!existingPO) {
    throw ApiError.notFound('Purchase order not found');
  }

  if (existingPO.status === 'RECEIVED' || existingPO.status === 'CANCELLED') {
    throw ApiError.badRequest(
      `Cannot update purchase order: Order is already in ${existingPO.status} state`
    );
  }

  const { expectedDate, notes, createdBy, status } = data;
  const updateData = {};

  if (expectedDate !== undefined) {
    updateData.expectedDate = expectedDate ? new Date(expectedDate) : null;
  }
  if (notes !== undefined) {
    updateData.notes = notes ? String(notes).trim() : null;
  }
  if (createdBy !== undefined) {
    updateData.createdBy = createdBy ? String(createdBy).trim() : null;
  }

  if (status !== undefined) {
    const normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_PO_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status. Allowed values: ${VALID_PO_STATUSES.join(', ')}`
      );
    }
    // Validate valid status transition
    validateStatusTransition(existingPO.status, normalizedStatus);
    updateData.status = normalizedStatus;
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: cleanId },
    data: updateData,
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return formatPurchaseOrder(updated);
};

/**
 * Helper to validate status transition workflow rules.
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;

  const validTransitions = {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'CANCELLED', 'DRAFT'],
    APPROVED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
    PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
    RECEIVED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed next states: ${
        allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
      }`
    );
  }

  return true;
};

/**
 * Change status of a purchase order with transition validation.
 */
const updatePurchaseOrderStatus = async (id, status, actorUser = null) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Purchase order ID is required');
  }

  if (!status || typeof status !== 'string') {
    throw ApiError.badRequest('Status is required');
  }

  const cleanId = id.trim();
  const normalizedStatus = status.trim().toUpperCase();

  if (!VALID_PO_STATUSES.includes(normalizedStatus)) {
    throw ApiError.badRequest(
      `Invalid status. Allowed values: ${VALID_PO_STATUSES.join(', ')}`
    );
  }

  const existingPO = await prisma.purchaseOrder.findUnique({
    where: { id: cleanId },
  });

  if (!existingPO) {
    throw ApiError.notFound('Purchase order not found');
  }

  validateStatusTransition(existingPO.status, normalizedStatus);

  const updated = await prisma.purchaseOrder.update({
    where: { id: cleanId },
    data: { status: normalizedStatus },
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  const formatted = formatPurchaseOrder(updated);
  try {
    await auditLogService.logEvent({
      action: 'STATUS_CHANGE',
      module: 'PURCHASE_ORDER',
      entity: 'PurchaseOrder',
      entityId: formatted.id,
      description: `Purchase order ${formatted.poNumber} status updated to ${formatted.status}`,
      severity: formatted.status === 'CANCELLED' ? 'WARNING' : 'INFO',
      userId: actorUser?.id || null,
      userName: actorUser?.name || null,
      userRole: actorUser?.role || null,
    });

    if (formatted.status === 'CANCELLED') {
      await notificationService.createNotification({
        type: 'PURCHASE_ORDER',
        title: `Purchase Order Cancelled: ${formatted.poNumber}`,
        message: `Purchase order ${formatted.poNumber} with supplier ${formatted.supplierName} was cancelled.`,
        severity: 'WARNING',
        relatedId: formatted.id,
      });
    }
  } catch (err) {
    console.error('Failed to log PO status change audit/notification:', err.message);
  }

  return formatted;
};

/**
 * Approve a purchase order (workflow action: PENDING -> APPROVED).
 */
const approvePurchaseOrder = async (id, actorUser = null) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Purchase order ID is required');
  }

  const cleanId = id.trim();
  const existingPO = await prisma.purchaseOrder.findUnique({
    where: { id: cleanId },
  });

  if (!existingPO) {
    throw ApiError.notFound('Purchase order not found');
  }

  if (existingPO.status === 'APPROVED') {
    throw ApiError.badRequest('Purchase order is already approved');
  }

  if (existingPO.status === 'RECEIVED' || existingPO.status === 'CANCELLED') {
    throw ApiError.badRequest(`Cannot approve purchase order: Current status is ${existingPO.status}`);
  }

  validateStatusTransition(existingPO.status, 'APPROVED');

  const updated = await prisma.purchaseOrder.update({
    where: { id: cleanId },
    data: { status: 'APPROVED' },
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  const formatted = formatPurchaseOrder(updated);
  try {
    await auditLogService.logEvent({
      action: 'APPROVAL',
      module: 'PURCHASE_ORDER',
      entity: 'PurchaseOrder',
      entityId: formatted.id,
      description: `Approved purchase order ${formatted.poNumber} for warehouse "${formatted.warehouseName}"`,
      severity: 'INFO',
      userId: actorUser?.id || null,
      userName: actorUser?.name || null,
      userRole: actorUser?.role || null,
    });

    await notificationService.createNotification({
      type: 'PURCHASE_ORDER',
      title: `Purchase Order Approved: ${formatted.poNumber}`,
      message: `Purchase order ${formatted.poNumber} for supplier ${formatted.supplierName} has been approved.`,
      severity: 'INFO',
      relatedId: formatted.id,
    });
  } catch (err) {
    console.error('Failed to log PO approval audit/notification:', err.message);
  }

  return formatted;
};

/**
 * Receive goods against a purchase order.
 *
 * Atomically performs:
 * 1. Validate PO status (must be APPROVED or PARTIALLY_RECEIVED)
 * 2. Validate receipt quantities do not exceed remaining ordered quantities
 * 3. Update receivedQuantity on PurchaseOrderItems
 * 4. Update or create Inventory (productId, warehouseId) -> increment currentStock
 * 5. Create StockMovement (type: RECEIPT, magnitude: quantity, reference, notes, performedBy)
 * 6. Update PO status to PARTIALLY_RECEIVED or RECEIVED
 *
 * All operations run inside ONE Prisma transaction.
 */
const receiveGoods = async (id, payload = {}, actorUser = null) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Purchase order ID is required');
  }

  const cleanId = id.trim();

  // Find PO with current items
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: cleanId },
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!po) {
    throw ApiError.notFound('Purchase order not found');
  }

  // Verify PO is in a receivable state
  if (po.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot receive goods for a cancelled purchase order');
  }
  if (po.status === 'RECEIVED') {
    throw ApiError.badRequest('Purchase order has already been fully received');
  }
  if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') {
    throw ApiError.badRequest(
      `Purchase order must be approved before receiving goods. Current status: ${po.status}`
    );
  }

  // Normalize received items from payload
  // Accepts either { items: [...] } or { quantities: { [productId]: qty } } or { receiptsMap: { [productId]: qty } }
  let incomingItems = [];

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    incomingItems = payload.items;
  } else if (payload.quantities && typeof payload.quantities === 'object') {
    incomingItems = Object.entries(payload.quantities).map(([key, qty]) => ({
      productId: key,
      quantity: qty,
    }));
  } else if (payload.receiptsMap && typeof payload.receiptsMap === 'object') {
    incomingItems = Object.entries(payload.receiptsMap).map(([key, qty]) => ({
      productId: key,
      quantity: qty,
    }));
  } else {
    throw ApiError.badRequest('No receiving items specified in request');
  }

  // Build item lookups for fast and accurate matching
  const itemById = new Map();
  const itemByProductId = new Map();
  for (const it of po.items) {
    itemById.set(it.id, it);
    itemByProductId.set(it.productId, it);
  }

  // Validate receipt items
  const validReceipts = [];
  let totalReceivingUnits = 0;

  for (let idx = 0; idx < incomingItems.length; idx++) {
    const raw = incomingItems[idx];
    const qty = parseInt(raw.quantity, 10);

    // Skip items explicitly set to 0
    if (qty === 0) continue;

    if (isNaN(qty) || qty < 0) {
      throw ApiError.badRequest(
        `Invalid receiving quantity (${raw.quantity}) at item index ${idx}. Must be a positive integer.`
      );
    }

    // Match PO item
    let matchedItem = null;
    if (raw.purchaseOrderItemId && itemById.has(raw.purchaseOrderItemId.trim())) {
      matchedItem = itemById.get(raw.purchaseOrderItemId.trim());
    } else if (raw.productId && itemByProductId.has(raw.productId.trim())) {
      matchedItem = itemByProductId.get(raw.productId.trim());
    } else if (raw.id && itemById.has(raw.id.trim())) {
      matchedItem = itemById.get(raw.id.trim());
    }

    if (!matchedItem) {
      throw ApiError.badRequest(
        `Line item with identifier "${raw.purchaseOrderItemId || raw.productId || raw.id}" does not belong to this purchase order`
      );
    }

    const remaining = matchedItem.quantity - matchedItem.receivedQuantity;
    if (qty > remaining) {
      throw ApiError.badRequest(
        `Cannot receive ${qty} units for product "${matchedItem.product?.name || matchedItem.productId}". Remaining ordered quantity is only ${remaining} units.`
      );
    }

    totalReceivingUnits += qty;
    validReceipts.push({
      poItem: matchedItem,
      quantity: qty,
    });
  }

  if (totalReceivingUnits === 0) {
    throw ApiError.badRequest('Please specify at least 1 unit to receive');
  }

  const reference = payload.reference && typeof payload.reference === 'string'
    ? payload.reference.trim()
    : po.poNumber;
  const notes = payload.notes && typeof payload.notes === 'string'
    ? payload.notes.trim()
    : `Goods receipt against PO ${po.poNumber}`;
  const performedBy = payload.performedBy && typeof payload.performedBy === 'string'
    ? payload.performedBy.trim()
    : 'Warehouse Staff';
  const performedById = payload.performedById && typeof payload.performedById === 'string'
    ? payload.performedById.trim()
    : null;

  // ATOMIC PRISMA TRANSACTION
  const result = await prisma.$transaction(async (tx) => {
    const movementsCreated = [];

    for (const receipt of validReceipts) {
      const { poItem, quantity } = receipt;

      // 1. Update receivedQuantity on PO item
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          receivedQuantity: { increment: quantity },
        },
      });

      // 2. Update or create Inventory record
      const existingInventory = await tx.inventory.findUnique({
        where: {
          unique_product_warehouse_inventory: {
            productId: poItem.productId,
            warehouseId: po.warehouseId,
          },
        },
      });

      let targetInventory;
      if (existingInventory) {
        targetInventory = await tx.inventory.update({
          where: { id: existingInventory.id },
          data: {
            currentStock: { increment: quantity },
          },
        });
      } else {
        targetInventory = await tx.inventory.create({
          data: {
            productId: poItem.productId,
            warehouseId: po.warehouseId,
            currentStock: quantity,
            reservedStock: 0,
            reorderLevel: 10,
          },
        });
      }

      // 3. Create StockMovement audit record
      const movement = await tx.stockMovement.create({
        data: {
          inventoryId: targetInventory.id,
          productId: poItem.productId,
          warehouseId: po.warehouseId,
          type: 'RECEIPT',
          quantity, // positive magnitude
          reference,
          notes,
          performedBy,
          performedById,
        },
      });

      movementsCreated.push(movement);
    }

    // 4. Recalculate purchase order status
    const allItemsInPO = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: po.id },
    });

    const isFullyReceived = allItemsInPO.every((it) => it.receivedQuantity >= it.quantity);
    const hasAnyReceived = allItemsInPO.some((it) => it.receivedQuantity > 0);

    let nextStatus = po.status;
    if (isFullyReceived) {
      nextStatus = 'RECEIVED';
    } else if (hasAnyReceived) {
      nextStatus = 'PARTIALLY_RECEIVED';
    }

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: nextStatus },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return {
      purchaseOrder: updatedPO,
      movements: movementsCreated,
    };
  });

  const formattedPO = formatPurchaseOrder(result.purchaseOrder);
  try {
    const finalStatus = formattedPO.status;
    await auditLogService.logEvent({
      action: 'STATUS_CHANGE',
      module: 'PURCHASE_ORDER',
      entity: 'PurchaseOrder',
      entityId: formattedPO.id,
      description: `Received ${totalReceivingUnits} units for PO ${formattedPO.poNumber}. Status is now ${finalStatus}`,
      severity: 'INFO',
      userId: actorUser?.id || null,
      userName: actorUser?.name || null,
      userRole: actorUser?.role || null,
    });

    await notificationService.createNotification({
      type: 'PURCHASE_ORDER',
      title: `Goods Received: PO ${formattedPO.poNumber}`,
      message: `Received ${totalReceivingUnits} units against PO ${formattedPO.poNumber}. Current PO status: ${finalStatus}.`,
      severity: finalStatus === 'RECEIVED' ? 'SUCCESS' : 'INFO',
      relatedId: formattedPO.id,
    });
  } catch (err) {
    console.error('Failed to log goods receiving audit/notification:', err.message);
  }

  return {
    purchaseOrder: formattedPO,
    movementsCount: result.movements.length,
    receivedUnits: totalReceivingUnits,
    message: 'Goods received successfully and inventory updated',
  };
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  approvePurchaseOrder,
  receiveGoods,
  formatPurchaseOrder,
};
