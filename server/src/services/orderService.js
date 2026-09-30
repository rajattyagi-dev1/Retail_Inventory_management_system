const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const auditLogService = require('./auditLogService');
const notificationService = require('./notificationService');

const VALID_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PICKING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

const ALLOWED_SORT_FIELDS = [
  'orderNumber',
  'orderDate',
  'customerName',
  'status',
  'paymentStatus',
  'totalAmount',
  'subtotal',
  'createdAt',
  'updatedAt',
];

/**
 * Format raw order object from Prisma into clean JSON output for API responses.
 */
const formatOrder = (ord) => {
  if (!ord) return null;

  const items = (ord.items || []).map((item) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = item.unitPrice ? Number(item.unitPrice) : 0;
    const total = item.total ? Number(item.total) : qty * unitPrice;

    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.product?.name || null,
      sku: item.product?.sku || null,
      quantity: qty,
      unitPrice,
      total,
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

  const itemCount = ord._count?.items ?? items.length;
  const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);

  return {
    id: ord.id,
    orderNumber: ord.orderNumber,
    customerName: ord.customerName,
    customerEmail: ord.customerEmail || null,
    customerPhone: ord.customerPhone || null,
    shippingAddress: {
      address: ord.shippingAddress || null,
      city: ord.shippingCity || null,
      state: ord.shippingState || null,
      pincode: ord.shippingPincode || null,
    },
    orderDate: ord.orderDate,
    status: ord.status,
    paymentStatus: ord.paymentStatus,
    warehouseId: ord.warehouseId,
    warehouseName: ord.warehouse?.name || null,
    warehouseCode: ord.warehouse?.code || null,
    subtotal: ord.subtotal ? Number(ord.subtotal) : 0,
    tax: ord.tax ? Number(ord.tax) : 0,
    shipping: ord.shipping ? Number(ord.shipping) : 0,
    totalAmount: ord.totalAmount ? Number(ord.totalAmount) : 0,
    cancellationReason: ord.cancellationReason || null,
    itemCount,
    totalQuantity,
    createdAt: ord.createdAt,
    updatedAt: ord.updatedAt,
    warehouse: ord.warehouse
      ? {
          id: ord.warehouse.id,
          code: ord.warehouse.code,
          name: ord.warehouse.name,
          city: ord.warehouse.city || null,
          state: ord.warehouse.state || null,
          status: ord.warehouse.status || null,
        }
      : null,
    items,
  };
};

/**
 * Generate a unique order number (e.g. ORD-2026-XXXX).
 */
const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `ORD-${year}-${randomSuffix}`;
    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
    });
    if (!existing) return candidate;
  }
  return `ORD-${year}-${Date.now().toString().slice(-6)}`;
};

/**
 * List orders with pagination, search, status/payment/warehouse filtering, and sorting.
 */
const getAllOrders = async ({
  page = 1,
  limit = 10,
  search,
  status,
  paymentStatus,
  warehouseId,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status && typeof status === 'string' && status.trim() && status.trim().toUpperCase() !== 'ALL') {
    const normalizedStatus = status.trim().toUpperCase();
    if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid status filter. Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`
      );
    }
    where.status = normalizedStatus;
  }

  if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus.trim() && paymentStatus.trim().toUpperCase() !== 'ALL') {
    const normalizedPayment = paymentStatus.trim().toUpperCase();
    if (!VALID_PAYMENT_STATUSES.includes(normalizedPayment)) {
      throw ApiError.badRequest(
        `Invalid payment status filter. Allowed values: ${VALID_PAYMENT_STATUSES.join(', ')}`
      );
    }
    where.paymentStatus = normalizedPayment;
  }

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim() && warehouseId.trim().toUpperCase() !== 'ALL') {
    where.warehouseId = warehouseId.trim();
  }

  if (search && typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { orderNumber: { contains: query } },
      { customerName: { contains: query } },
      { customerEmail: { contains: query } },
      { customerPhone: { contains: query } },
      { shippingCity: { contains: query } },
      { warehouse: { name: { contains: query } } },
    ];
  }

  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder =
    String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
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
    data: orders.map(formatOrder),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/**
 * Get single order by ID with enriched items and warehouse.
 */
const getOrderById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Order ID is required');
  }

  const order = await prisma.order.findUnique({
    where: { id: id.trim() },
    include: {
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

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  return formatOrder(order);
};

/**
 * Create a new customer order with line items.
 * If status is CONFIRMED, atomically verifies stock availability and locks reservedStock.
 */
const createOrder = async (data, actorUser = null) => {
  if (!data || typeof data !== 'object') {
    throw ApiError.badRequest('Request body must be an object');
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    warehouseId,
    orderNumber,
    orderDate,
    status = 'PENDING',
    paymentStatus = 'PENDING',
    items,
    shipping,
    tax,
  } = data;

  // 1. Customer validation
  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    throw ApiError.badRequest('Customer name is required');
  }

  if (customerEmail && typeof customerEmail === 'string' && customerEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      throw ApiError.badRequest('Invalid email address format');
    }
  }

  // 2. Warehouse validation
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

  // 3. Status validations
  let normalizedStatus = 'PENDING';
  if (status) {
    normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid order status. Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`
      );
    }
  }

  let normalizedPayment = 'PENDING';
  if (paymentStatus) {
    normalizedPayment = String(paymentStatus).trim().toUpperCase();
    if (!VALID_PAYMENT_STATUSES.includes(normalizedPayment)) {
      throw ApiError.badRequest(
        `Invalid payment status. Allowed values: ${VALID_PAYMENT_STATUSES.join(', ')}`
      );
    }
  }

  // 4. Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Order must contain at least one line item');
  }

  // Normalize shipping address
  let addressLine = null;
  let city = null;
  let state = null;
  let pincode = null;

  if (typeof shippingAddress === 'object' && shippingAddress !== null) {
    addressLine = shippingAddress.address ? String(shippingAddress.address).trim() : null;
    city = shippingAddress.city ? String(shippingAddress.city).trim() : null;
    state = shippingAddress.state ? String(shippingAddress.state).trim() : null;
    pincode = shippingAddress.pincode ? String(shippingAddress.pincode).trim() : null;
  } else if (typeof shippingAddress === 'string') {
    addressLine = shippingAddress.trim();
    city = data.shippingCity ? String(data.shippingCity).trim() : null;
    state = data.shippingState ? String(data.shippingState).trim() : null;
    pincode = data.shippingPincode ? String(data.shippingPincode).trim() : null;
  }

  // Process order line items
  let calculatedSubtotal = 0;
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
      unitPrice = product.sellingPrice ? Number(product.sellingPrice) : 0;
    }

    const lineTotal = qty * unitPrice;
    calculatedSubtotal += lineTotal;

    processedItems.push({
      productId: cleanProductId,
      quantity: qty,
      unitPrice,
      total: lineTotal,
    });
  }

  // Calculate taxes and shipping
  const calculatedTax = tax !== undefined && tax !== null && tax !== ''
    ? parseFloat(tax)
    : Math.round(calculatedSubtotal * 0.18 * 100) / 100;

  const calculatedShipping = shipping !== undefined && shipping !== null && shipping !== ''
    ? parseFloat(shipping)
    : (calculatedSubtotal > 50000 ? 0 : 250);

  const grandTotal = calculatedSubtotal + calculatedTax + calculatedShipping;

  // Order number assignment & duplicate check
  let finalOrderNumber = orderNumber && typeof orderNumber === 'string' ? orderNumber.trim() : null;
  if (finalOrderNumber) {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: finalOrderNumber },
    });
    if (existing) {
      throw ApiError.conflict(`Order with number "${finalOrderNumber}" already exists`);
    }
  } else {
    finalOrderNumber = await generateOrderNumber();
  }

  // Check if initial status requires stock reservation (e.g. CONFIRMED, PROCESSING, PICKING, PACKED)
  const shouldReserveStock = ['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED'].includes(normalizedStatus);

  // ATOMIC TRANSACTION: Create Order, OrderItems, and optionally reserve stock
  const createdOrder = await prisma.$transaction(async (tx) => {
    if (shouldReserveStock) {
      for (const it of processedItems) {
        const inv = await tx.inventory.findUnique({
          where: {
            unique_product_warehouse_inventory: {
              productId: it.productId,
              warehouseId: cleanWarehouseId,
            },
          },
        });

        const currentStock = inv ? inv.currentStock : 0;
        const reservedStock = inv ? inv.reservedStock : 0;
        const availableStock = Math.max(0, currentStock - reservedStock);

        if (availableStock < it.quantity) {
          throw ApiError.badRequest(
            `Insufficient available stock for product "${it.productId}" at selected warehouse. Available: ${availableStock}, Requested: ${it.quantity}`
          );
        }

        // Increment reservedStock
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            reservedStock: { increment: it.quantity },
          },
        });
      }
    }

    const order = await tx.order.create({
      data: {
        orderNumber: finalOrderNumber,
        customerName: customerName.trim(),
        customerEmail: customerEmail && typeof customerEmail === 'string' ? customerEmail.trim() : null,
        customerPhone: customerPhone && typeof customerPhone === 'string' ? customerPhone.trim() : null,
        shippingAddress: addressLine,
        shippingCity: city,
        shippingState: state,
        shippingPincode: pincode,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        status: normalizedStatus,
        paymentStatus: normalizedPayment,
        warehouseId: cleanWarehouseId,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        shipping: calculatedShipping,
        totalAmount: grandTotal,
        items: {
          create: processedItems,
        },
      },
      include: {
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

    return order;
  });

  const formatted = formatOrder(createdOrder);
  try {
    await auditLogService.logEvent({
      action: 'CREATE',
      module: 'ORDER',
      entity: 'Order',
      entityId: formatted.id,
      description: `Created customer order ${formatted.orderNumber} for customer "${formatted.customerName}" totaling ${formatted.totalAmount}`,
      severity: 'INFO',
      userId: actorUser?.id || null,
      userName: actorUser?.name || null,
      userRole: actorUser?.role || null,
    });
  } catch (err) {
    console.error('Failed to log order create audit:', err.message);
  }

  return formatted;
};

/**
 * Reserve stock for an existing PENDING order.
 * Transitions order status PENDING -> CONFIRMED.
 * Atomically verifies stock and locks reservedStock across all order items.
 */
const reserveStockForOrder = async (id, actorUser = null) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Order ID is required');
  }

  const cleanId = id.trim();
  const order = await prisma.order.findUnique({
    where: { id: cleanId },
    include: {
      items: {
        include: { product: true },
      },
      warehouse: true,
    },
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot reserve stock for a cancelled order');
  }

  if (['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    throw ApiError.badRequest(`Order is already reserved / confirmed. Current status: ${order.status}`);
  }

  // ATOMIC RESERVATION TRANSACTION
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. Verify all items have sufficient available stock
    for (const it of order.items) {
      const inv = await tx.inventory.findUnique({
        where: {
          unique_product_warehouse_inventory: {
            productId: it.productId,
            warehouseId: order.warehouseId,
          },
        },
      });

      const currentStock = inv ? inv.currentStock : 0;
      const reservedStock = inv ? inv.reservedStock : 0;
      const availableStock = Math.max(0, currentStock - reservedStock);

      if (availableStock < it.quantity) {
        throw ApiError.badRequest(
          `Insufficient available stock for product "${it.product?.name || it.productId}". Available: ${availableStock}, Required: ${it.quantity}`
        );
      }

      // 2. Increment reservedStock atomically
      await tx.inventory.update({
        where: { id: inv.id },
        data: {
          reservedStock: { increment: it.quantity },
        },
      });
    }

    // 3. Update order status to CONFIRMED
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
      include: {
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

    return updated;
  });

  const formatted = formatOrder(updatedOrder);
  try {
    await auditLogService.logEvent({
      action: 'STATUS_CHANGE',
      module: 'ORDER',
      entity: 'Order',
      entityId: formatted.id,
      description: `Reserved stock and confirmed customer order ${formatted.orderNumber}`,
      severity: 'INFO',
      userId: actorUser?.id || null,
      userName: actorUser?.name || null,
      userRole: actorUser?.role || null,
    });

    await notificationService.createNotification({
      type: 'ORDER',
      title: `Order Confirmed: ${formatted.orderNumber}`,
      message: `Stock reserved and order ${formatted.orderNumber} confirmed for ${formatted.customerName}.`,
      severity: 'INFO',
      relatedId: formatted.id,
    });
  } catch (err) {
    console.error('Failed to log order reserve audit/notification:', err.message);
  }

  return formatted;
};

/**
 * Valid status transitions helper.
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;

  const validTransitions = {
    PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'PICKING', 'CANCELLED'],
    PROCESSING: ['PICKING', 'PACKED', 'CANCELLED'],
    PICKING: ['PACKED', 'SHIPPED', 'CANCELLED'],
    PACKED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid order status transition from ${currentStatus} to ${newStatus}. Allowed next states: ${
        allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
      }`
    );
  }

  return true;
};

/**
 * Update order status along the fulfillment lifecycle.
 *
 * Handles critical inventory milestones:
 * - PENDING -> CONFIRMED / PROCESSING: Atomically verifies stock and locks reservedStock.
 * - -> SHIPPED: Critical inventory deduction point (currentStock -= qty, reservedStock -= qty, logs SALE movement).
 * - -> DELIVERED: Marks delivery completed without duplicate inventory deduction.
 * - -> CANCELLED: Releases reservedStock back to available stock if order was reserved before shipping.
 */
const updateOrderStatus = async (id, status, reason = '', metadata = {}, actorUser = null) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Order ID is required');
  }

  if (!status || typeof status !== 'string') {
    throw ApiError.badRequest('Status is required');
  }

  const cleanId = id.trim();
  const normalizedStatus = status.trim().toUpperCase();

  if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
    throw ApiError.badRequest(
      `Invalid order status. Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: cleanId },
    include: {
      items: {
        include: { product: true },
      },
      warehouse: true,
    },
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const previousStatus = order.status;
  if (previousStatus === normalizedStatus) {
    return formatOrder(order);
  }

  // Validate state machine transition
  validateStatusTransition(previousStatus, normalizedStatus);

  // States where stock is actively reserved
  const isPreviouslyReserved = ['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED'].includes(previousStatus);
  const isTargetReserved = ['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED'].includes(normalizedStatus);

  // ATOMIC PRISMA TRANSACTION
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // SCENARIO 1: Transitioning from unreserved (PENDING) into a reserved state (CONFIRMED / PROCESSING)
    if (!isPreviouslyReserved && isTargetReserved) {
      for (const it of order.items) {
        const inv = await tx.inventory.findUnique({
          where: {
            unique_product_warehouse_inventory: {
              productId: it.productId,
              warehouseId: order.warehouseId,
            },
          },
        });

        const currentStock = inv ? inv.currentStock : 0;
        const reservedStock = inv ? inv.reservedStock : 0;
        const availableStock = Math.max(0, currentStock - reservedStock);

        if (availableStock < it.quantity) {
          throw ApiError.badRequest(
            `Insufficient available stock for product "${it.product?.name || it.productId}". Available: ${availableStock}, Required: ${it.quantity}`
          );
        }

        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            reservedStock: { increment: it.quantity },
          },
        });
      }
    }

    // SCENARIO 2: Transitioning to SHIPPED (Physical Inventory Deduction & Stock Movement)
    if (normalizedStatus === 'SHIPPED') {
      if (previousStatus === 'SHIPPED' || previousStatus === 'DELIVERED') {
        throw ApiError.badRequest('Order has already been shipped');
      }

      for (const it of order.items) {
        const inv = await tx.inventory.findUnique({
          where: {
            unique_product_warehouse_inventory: {
              productId: it.productId,
              warehouseId: order.warehouseId,
            },
          },
        });

        if (!inv) {
          throw ApiError.badRequest(
            `Cannot ship: Inventory record not found for product "${it.productId}" at destination warehouse`
          );
        }

        if (inv.currentStock < it.quantity) {
          throw ApiError.badRequest(
            `Cannot ship: Physical currentStock (${inv.currentStock}) is insufficient for ordered quantity (${it.quantity}) for product "${it.product?.name || it.productId}"`
          );
        }

        // Deduct currentStock and release reservedStock
        const newCurrent = Math.max(0, inv.currentStock - it.quantity);
        const newReserved = isPreviouslyReserved
          ? Math.max(0, inv.reservedStock - it.quantity)
          : inv.reservedStock;

        const updatedInv = await tx.inventory.update({
          where: { id: inv.id },
          data: {
            currentStock: newCurrent,
            reservedStock: newReserved,
          },
        });

        // Create StockMovement SALE audit record
        await tx.stockMovement.create({
          data: {
            inventoryId: updatedInv.id,
            productId: it.productId,
            warehouseId: order.warehouseId,
            type: 'SALE',
            quantity: it.quantity, // magnitude of sold units
            reference: order.orderNumber,
            notes: metadata.notes || `Dispatched customer order ${order.orderNumber} to ${order.customerName}`,
            performedBy: metadata.performedBy || 'Dispatch Coordinator',
            performedById: metadata.performedById || null,
          },
        });
      }
    }

    // SCENARIO 3: Transitioning to CANCELLED from a reserved pre-shipment state
    if (normalizedStatus === 'CANCELLED') {
      if (previousStatus === 'SHIPPED' || previousStatus === 'DELIVERED') {
        throw ApiError.badRequest('Cannot cancel an order that has already been shipped or delivered');
      }

      if (isPreviouslyReserved) {
        for (const it of order.items) {
          const inv = await tx.inventory.findUnique({
            where: {
              unique_product_warehouse_inventory: {
                productId: it.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          if (inv) {
            const newReserved = Math.max(0, inv.reservedStock - it.quantity);
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                reservedStock: newReserved,
              },
            });
          }
        }
      }
    }

    // Update order status and optional cancellationReason
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: normalizedStatus,
        ...(reason && typeof reason === 'string' ? { cancellationReason: reason.trim() } : {}),
      },
      include: {
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

    return updated;
  });

  const formatted = formatOrder(updatedOrder);
  try {
    const isCancelled = normalizedStatus === 'CANCELLED';
    const isDelivered = normalizedStatus === 'DELIVERED';
    const isShipped = normalizedStatus === 'SHIPPED';

    await auditLogService.logEvent({
      action: isCancelled ? 'STATUS_CHANGE' : (normalizedStatus === 'DELIVERED' ? 'STATUS_CHANGE' : 'STATUS_CHANGE'),
      module: 'ORDER',
      entity: 'Order',
      entityId: formatted.id,
      description: `Order ${formatted.orderNumber} status changed from ${previousStatus} to ${normalizedStatus}${reason ? ` (${reason})` : ''}`,
      severity: isCancelled ? 'WARNING' : 'INFO',
      userId: actorUser?.id || null,
      userName: actorUser?.name || null,
      userRole: actorUser?.role || null,
    });

    if (['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(normalizedStatus)) {
      await notificationService.createNotification({
        type: 'ORDER',
        title: `Order ${normalizedStatus}: ${formatted.orderNumber}`,
        message: `Order ${formatted.orderNumber} for ${formatted.customerName} has transitioned to ${normalizedStatus}.`,
        severity: isCancelled ? 'WARNING' : isDelivered ? 'SUCCESS' : 'INFO',
        relatedId: formatted.id,
      });
    }

    // If shipped, inspect inventory items to check for low/out-of-stock transitions
    if (isShipped && order.items && order.items.length > 0) {
      for (const it of order.items) {
        const inv = await prisma.inventory.findUnique({
          where: {
            unique_product_warehouse_inventory: {
              productId: it.productId,
              warehouseId: order.warehouseId,
            },
          },
          include: { product: true, warehouse: true },
        });
        if (inv) {
          await notificationService.notifyInventoryThreshold(inv, inv.currentStock + it.quantity);
        }
      }
    }
  } catch (err) {
    console.error('Failed to log order update audit/notification:', err.message);
  }

  return formatted;
};

/**
 * Cancel an order. Convenience wrapper around updateOrderStatus('CANCELLED').
 */
const cancelOrder = async (id, reason = 'Customer requested cancellation', actorUser = null) => {
  return await updateOrderStatus(id, 'CANCELLED', reason, {}, actorUser);
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  reserveStockForOrder,
  updateOrderStatus,
  cancelOrder,
  formatOrder,
};
