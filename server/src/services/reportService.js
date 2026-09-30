const prisma = require('../config/prisma');

/**
 * Inventory Health & KPIs Report
 */
const getInventoryReport = async ({ warehouseId, categoryId } = {}) => {
  const where = {};

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim().toUpperCase() !== 'ALL') {
    where.warehouseId = warehouseId.trim();
  }

  if (categoryId && typeof categoryId === 'string' && categoryId.trim().toUpperCase() !== 'ALL') {
    where.product = { categoryId: categoryId.trim() };
  }

  const inventoryItems = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
    },
  });

  let totalCurrentStock = 0;
  let totalReservedStock = 0;
  let totalAvailableStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;

  const warehouseMap = new Map();
  const categoryMap = new Map();
  const productSet = new Set();

  for (const inv of inventoryItems) {
    productSet.add(inv.productId);

    const cur = Number(inv.currentStock) || 0;
    const res = Number(inv.reservedStock) || 0;
    const reorder = Number(inv.reorderLevel) || 10;
    const avail = Math.max(0, cur - res);

    const costPrice = inv.product?.costPrice ? Number(inv.product.costPrice) : 0;
    const sellingPrice = inv.product?.sellingPrice ? Number(inv.product.sellingPrice) : 0;

    totalCurrentStock += cur;
    totalReservedStock += res;
    totalAvailableStock += avail;
    totalCostValue += cur * costPrice;
    totalRetailValue += cur * sellingPrice;

    const isLow = cur > 0 && cur <= reorder;
    const isOut = cur === 0;

    if (isLow) lowStockCount++;
    if (isOut) outOfStockCount++;

    // Warehouse grouping
    const whId = inv.warehouseId;
    if (!warehouseMap.has(whId)) {
      warehouseMap.set(whId, {
        warehouseId: whId,
        warehouseName: inv.warehouse?.name || 'Unknown Hub',
        warehouseCode: inv.warehouse?.code || '',
        itemCount: 0,
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        stockValue: 0,
      });
    }
    const whStat = warehouseMap.get(whId);
    whStat.itemCount++;
    whStat.currentStock += cur;
    whStat.reservedStock += res;
    whStat.availableStock += avail;
    whStat.stockValue += cur * costPrice;
    if (isLow) whStat.lowStockItems++;
    if (isOut) whStat.outOfStockItems++;

    // Category grouping
    const catName = inv.product?.category?.name || 'Uncategorized';
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, {
        categoryName: catName,
        itemCount: 0,
        totalStock: 0,
        stockValue: 0,
      });
    }
    const catStat = categoryMap.get(catName);
    catStat.itemCount++;
    catStat.totalStock += cur;
    catStat.stockValue += cur * costPrice;
  }

  return {
    kpis: {
      totalProductsTracked: productSet.size,
      totalInventoryRecords: inventoryItems.length,
      totalCurrentStock,
      totalReservedStock,
      totalAvailableStock,
      lowStockCount,
      outOfStockCount,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      totalRetailValue: Math.round(totalRetailValue * 100) / 100,
    },
    warehouseBreakdown: Array.from(warehouseMap.values()),
    categoryBreakdown: Array.from(categoryMap.values()),
  };
};

/**
 * Procurement Pipeline & Supplier Report
 */
const getProcurementReport = async ({ supplierId, warehouseId, status } = {}) => {
  const where = {};

  if (supplierId && typeof supplierId === 'string' && supplierId.trim().toUpperCase() !== 'ALL') {
    where.supplierId = supplierId.trim();
  }

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim().toUpperCase() !== 'ALL') {
    where.warehouseId = warehouseId.trim();
  }

  if (status && typeof status === 'string' && status.trim().toUpperCase() !== 'ALL') {
    where.status = status.trim().toUpperCase();
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: true,
      warehouse: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusCounts = {
    DRAFT: 0,
    PENDING: 0,
    APPROVED: 0,
    PARTIALLY_RECEIVED: 0,
    RECEIVED: 0,
    CANCELLED: 0,
  };

  let totalOrderedUnits = 0;
  let totalReceivedUnits = 0;
  let totalSpend = 0;

  const supplierMap = new Map();

  for (const po of purchaseOrders) {
    if (statusCounts[po.status] !== undefined) {
      statusCounts[po.status]++;
    }

    const orderAmount = po.total ? Number(po.total) : 0;
    if (po.status !== 'CANCELLED') {
      totalSpend += orderAmount;
    }

    for (const it of po.items) {
      const q = Number(it.quantity) || 0;
      const r = Number(it.receivedQuantity) || 0;
      totalOrderedUnits += q;
      totalReceivedUnits += r;
    }

    // Supplier stats
    const supId = po.supplierId;
    if (!supplierMap.has(supId)) {
      supplierMap.set(supId, {
        supplierId: supId,
        supplierName: po.supplier?.name || 'Unknown Vendor',
        supplierCode: po.supplier?.supplierCode || '',
        orderCount: 0,
        totalSpend: 0,
      });
    }
    const supStat = supplierMap.get(supId);
    supStat.orderCount++;
    if (po.status !== 'CANCELLED') {
      supStat.totalSpend += orderAmount;
    }
  }

  return {
    kpis: {
      totalPurchaseOrders: purchaseOrders.length,
      statusCounts,
      totalOrderedUnits,
      totalReceivedUnits,
      totalOutstandingUnits: Math.max(0, totalOrderedUnits - totalReceivedUnits),
      fulfillmentRatePct: totalOrderedUnits > 0 ? Math.round((totalReceivedUnits / totalOrderedUnits) * 100) : 0,
      totalSpend: Math.round(totalSpend * 100) / 100,
    },
    supplierBreakdown: Array.from(supplierMap.values()).sort((a, b) => b.totalSpend - a.totalSpend),
    recentPurchaseOrders: purchaseOrders.slice(0, 5).map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      supplierName: po.supplier?.name,
      warehouseName: po.warehouse?.name,
      status: po.status,
      total: po.total ? Number(po.total) : 0,
      orderDate: po.orderDate,
    })),
  };
};

/**
 * Customer Orders & Sales Fulfillment Report
 */
const getOrderReport = async ({ warehouseId, status, paymentStatus } = {}) => {
  const where = {};

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim().toUpperCase() !== 'ALL') {
    where.warehouseId = warehouseId.trim();
  }

  if (status && typeof status === 'string' && status.trim().toUpperCase() !== 'ALL') {
    where.status = status.trim().toUpperCase();
  }

  if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus.trim().toUpperCase() !== 'ALL') {
    where.paymentStatus = paymentStatus.trim().toUpperCase();
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      warehouse: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusCounts = {
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    PICKING: 0,
    PACKED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  const paymentStatusCounts = {
    PENDING: 0,
    PAID: 0,
    FAILED: 0,
    REFUNDED: 0,
  };

  let totalOrderedUnits = 0;
  let totalRevenue = 0;

  const warehouseMap = new Map();

  for (const ord of orders) {
    if (statusCounts[ord.status] !== undefined) {
      statusCounts[ord.status]++;
    }
    if (paymentStatusCounts[ord.paymentStatus] !== undefined) {
      paymentStatusCounts[ord.paymentStatus]++;
    }

    const orderAmount = ord.totalAmount ? Number(ord.totalAmount) : 0;
    if (ord.status !== 'CANCELLED') {
      totalRevenue += orderAmount;
    }

    for (const it of ord.items) {
      totalOrderedUnits += Number(it.quantity) || 0;
    }

    // Warehouse breakdown
    const whId = ord.warehouseId;
    if (!warehouseMap.has(whId)) {
      warehouseMap.set(whId, {
        warehouseId: whId,
        warehouseName: ord.warehouse?.name || 'Unknown Hub',
        orderCount: 0,
        revenue: 0,
      });
    }
    const whStat = warehouseMap.get(whId);
    whStat.orderCount++;
    if (ord.status !== 'CANCELLED') {
      whStat.revenue += orderAmount;
    }
  }

  return {
    kpis: {
      totalOrders: orders.length,
      statusCounts,
      paymentStatusCounts,
      totalOrderedUnits,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      fulfilledOrders: statusCounts.SHIPPED + statusCounts.DELIVERED,
      activePipelineOrders:
        statusCounts.PENDING +
        statusCounts.CONFIRMED +
        statusCounts.PROCESSING +
        statusCounts.PICKING +
        statusCounts.PACKED,
    },
    warehouseBreakdown: Array.from(warehouseMap.values()),
    recentOrders: orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      warehouseName: o.warehouse?.name,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount ? Number(o.totalAmount) : 0,
      orderDate: o.orderDate,
    })),
  };
};

/**
 * Combined Executive Dashboard
 */
const getDashboardReport = async () => {
  const [
    invReport,
    procReport,
    orderReport,
    totalWarehouses,
    activeWarehouses,
    totalUsers,
    activeUsers,
    usersByRole,
    unreadNotifCount,
    recentNotifs,
    recentAudits,
  ] = await Promise.all([
    getInventoryReport(),
    getProcurementReport(),
    getOrderReport(),
    prisma.warehouse.count(),
    prisma.warehouse.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.groupBy({
      by: ['roleId'],
      _count: { id: true },
    }),
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { role: true } } },
    }),
  ]);

  // Roles map for role distribution
  const allRoles = await prisma.role.findMany();
  const roleNameMap = new Map(allRoles.map((r) => [r.id, r.name]));
  const roleDistribution = usersByRole.map((g) => ({
    roleId: g.roleId,
    role: roleNameMap.get(g.roleId) || 'UNKNOWN',
    userCount: g._count.id,
  }));

  return {
    inventory: invReport.kpis,
    procurement: procReport.kpis,
    orders: orderReport.kpis,
    warehouses: {
      total: totalWarehouses,
      active: activeWarehouses,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      roleDistribution,
    },
    notifications: {
      unreadCount: unreadNotifCount,
      recent: recentNotifs,
    },
    auditLogs: {
      recent: recentAudits.map((a) => ({
        id: a.id,
        action: a.action,
        module: a.module,
        entity: a.entity,
        description: a.description,
        severity: a.severity,
        userName: a.userName || a.user?.name || 'System',
        createdAt: a.createdAt,
      })),
    },
  };
};

module.exports = {
  getInventoryReport,
  getProcurementReport,
  getOrderReport,
  getDashboardReport,
};
