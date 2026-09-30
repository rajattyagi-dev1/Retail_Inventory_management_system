const prisma = require('./src/config/prisma');

const BASE_URL = 'http://localhost:5000/api';

async function runSystemTestSuite() {
  console.log('====================================================');
  console.log('STARTING SYSTEM, REPORTS, ADMIN & AUDIT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    let body;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body };
  }

  try {
    // ==========================================
    // 0. BASELINE HEALTH & REGRESSION CHECK
    // ==========================================
    console.log('--- TEST GROUP 0: BASELINE HEALTH CHECK ---');
    const health = await request('/health');
    assert(health.status === 200 && health.body.database === 'connected', 'GET /api/health returns 200 & db connected');

    const productsRes = await request('/products');
    const warehousesRes = await request('/warehouses');
    assert(productsRes.status === 200 && productsRes.body.data.length >= 2, 'Products API accessible with at least 2 items');
    assert(warehousesRes.status === 200 && warehousesRes.body.data.length >= 2, 'Warehouses API accessible with at least 2 items');

    const testProduct = productsRes.body.data[0];
    const testWarehouse = warehousesRes.body.data[0];

    // ==========================================
    // 1. REPORT APIS
    // ==========================================
    console.log('\n--- TEST GROUP 1: REPORT APIS ---');

    // 1.1 Inventory Report
    const invReportRes = await request('/reports/inventory');
    assert(invReportRes.status === 200, 'GET /api/reports/inventory returns 200');
    assert(invReportRes.body.success === true, 'Inventory report returns success=true');
    const invData = invReportRes.body.data;
    assert(invData && invData.kpis, 'Inventory report contains kpis object');
    assert(typeof invData.kpis.totalCurrentStock === 'number', 'KPI totalCurrentStock is numeric');
    assert(typeof invData.kpis.totalReservedStock === 'number', 'KPI totalReservedStock is numeric');
    assert(typeof invData.kpis.totalAvailableStock === 'number', 'KPI totalAvailableStock is numeric');
    assert(typeof invData.kpis.lowStockCount === 'number', 'KPI lowStockCount is numeric');
    assert(typeof invData.kpis.outOfStockCount === 'number', 'KPI outOfStockCount is numeric');
    assert(Array.isArray(invData.warehouseBreakdown), 'Inventory report contains warehouseBreakdown array');
    assert(Array.isArray(invData.categoryBreakdown), 'Inventory report contains categoryBreakdown array');

    // Inventory report filtering
    const invFilteredRes = await request(`/reports/inventory?warehouseId=${testWarehouse.id}`);
    assert(invFilteredRes.status === 200, 'GET /api/reports/inventory with warehouseId filter returns 200');

    // 1.2 Procurement Report
    const procReportRes = await request('/reports/procurement');
    assert(procReportRes.status === 200, 'GET /api/reports/procurement returns 200');
    assert(procReportRes.body.success === true, 'Procurement report returns success=true');
    const procData = procReportRes.body.data;
    assert(procData && procData.kpis, 'Procurement report contains kpis object');
    assert(typeof procData.kpis.totalPurchaseOrders === 'number', 'KPI totalPurchaseOrders is numeric');
    assert(procData.kpis.statusCounts && typeof procData.kpis.statusCounts.APPROVED === 'number', 'KPI statusCounts.APPROVED exists');
    assert(typeof procData.kpis.totalOrderedUnits === 'number', 'KPI totalOrderedUnits is numeric');
    assert(typeof procData.kpis.totalReceivedUnits === 'number', 'KPI totalReceivedUnits is numeric');
    assert(Array.isArray(procData.supplierBreakdown), 'Procurement report contains supplierBreakdown array');
    assert(Array.isArray(procData.recentPurchaseOrders), 'Procurement report contains recentPurchaseOrders array');

    // 1.3 Order Report
    const ordReportRes = await request('/reports/orders');
    assert(ordReportRes.status === 200, 'GET /api/reports/orders returns 200');
    assert(ordReportRes.body.success === true, 'Order report returns success=true');
    const ordData = ordReportRes.body.data;
    assert(ordData && ordData.kpis, 'Order report contains kpis object');
    assert(typeof ordData.kpis.totalOrders === 'number', 'KPI totalOrders is numeric');
    assert(ordData.kpis.statusCounts && typeof ordData.kpis.statusCounts.DELIVERED === 'number', 'KPI statusCounts.DELIVERED exists');
    assert(typeof ordData.kpis.totalRevenue === 'number', 'KPI totalRevenue is numeric');
    assert(Array.isArray(ordData.warehouseBreakdown), 'Order report contains warehouseBreakdown array');
    assert(Array.isArray(ordData.recentOrders), 'Order report contains recentOrders array');

    // 1.4 Dashboard Report
    const dashReportRes = await request('/reports/dashboard');
    assert(dashReportRes.status === 200, 'GET /api/reports/dashboard returns 200');
    assert(dashReportRes.body.success === true, 'Dashboard report returns success=true');
    const dashData = dashReportRes.body.data;
    assert(dashData.inventory && typeof dashData.inventory.totalCurrentStock === 'number', 'Dashboard contains inventory KPIs');
    assert(dashData.procurement && typeof dashData.procurement.totalPurchaseOrders === 'number', 'Dashboard contains procurement KPIs');
    assert(dashData.orders && typeof dashData.orders.totalOrders === 'number', 'Dashboard contains orders KPIs');
    assert(dashData.warehouses && typeof dashData.warehouses.total === 'number', 'Dashboard contains warehouses summary');
    assert(dashData.users && typeof dashData.users.total === 'number', 'Dashboard contains users summary');

    // 1.5 Admin Dashboard Endpoint (/api/admin/dashboard)
    const adminDashRes = await request('/admin/dashboard');
    assert(adminDashRes.status === 200, 'GET /api/admin/dashboard returns 200');
    assert(adminDashRes.body.data.users !== undefined, 'Admin dashboard returns users metrics');
    assert(Array.isArray(adminDashRes.body.data.users.roleDistribution), 'Admin dashboard has roleDistribution');

    // ==========================================
    // 2. USER MANAGEMENT APIS
    // ==========================================
    console.log('\n--- TEST GROUP 2: USER MANAGEMENT APIS ---');

    // 2.1 Get Roles
    const rolesRes = await request('/users/roles');
    assert(rolesRes.status === 200, 'GET /api/users/roles returns 200');
    assert(Array.isArray(rolesRes.body.data), 'Roles data is an array');
    assert(rolesRes.body.data.length >= 6, `Found ${rolesRes.body.data.length} system roles (expected >= 6)`);
    const adminRole = rolesRes.body.data.find((r) => r.name === 'ADMIN');
    const staffRole = rolesRes.body.data.find((r) => r.name === 'STAFF');
    assert(adminRole && staffRole, 'Standard roles ADMIN and STAFF are present');

    // 2.2 List Users
    const usersListRes = await request('/users');
    assert(usersListRes.status === 200, 'GET /api/users returns 200');
    assert(Array.isArray(usersListRes.body.data), 'Users data is an array');
    assert(usersListRes.body.pagination && typeof usersListRes.body.pagination.total === 'number', 'Users pagination total exists');

    // 2.3 User Creation Validations
    const userNoName = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'noname@example.com', role: 'STAFF' }),
    });
    assert(userNoName.status === 400, 'POST /api/users without name returns 400');

    const userBadEmail = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Invalid User', email: 'not-an-email', role: 'STAFF' }),
    });
    assert(userBadEmail.status === 400, 'POST /api/users with invalid email format returns 400');

    const userBadRole = await request('/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Invalid Role', email: 'badrole@example.com', role: 'SUPER_HERO' }),
    });
    assert(userBadRole.status === 400, 'POST /api/users with invalid role returns 400');

    // 2.4 Create Valid User
    const testEmail = `operator_${Date.now()}@example.com`;
    const createUserRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Inventory Operations Specialist',
        email: testEmail,
        department: 'Warehouse Operations',
        role: 'INVENTORY_MANAGER',
        status: 'ACTIVE',
      }),
    });
    assert(createUserRes.status === 201, `POST /api/users returns 201 (Got ${createUserRes.status})`);
    const createdUser = createUserRes.body.data;
    assert(createdUser.id && createdUser.email === testEmail, 'Created user has id and normalized email');
    assert(createdUser.role === 'INVENTORY_MANAGER', 'Created user role is INVENTORY_MANAGER');
    assert(createdUser.status === 'ACTIVE', 'Created user status is ACTIVE');
    assert(createdUser.password === undefined && createdUser.passwordHash === undefined, 'No password or passwordHash in response');

    // 2.5 Duplicate Email Rejection
    const dupUserRes = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Operator',
        email: testEmail,
        role: 'STAFF',
      }),
    });
    assert(dupUserRes.status === 409, `POST /api/users with duplicate email returns 409 (Got ${dupUserRes.status})`);

    // 2.6 Get User By ID
    const getUserRes = await request(`/users/${createdUser.id}`);
    assert(getUserRes.status === 200, 'GET /api/users/:id returns 200');
    assert(getUserRes.body.data.name === createdUser.name, 'Fetched user name matches');
    assert(getUserRes.body.data.password === undefined, 'No password returned in GET /api/users/:id');

    const getBadUserRes = await request('/users/non-existent-user-id');
    assert(getBadUserRes.status === 404, 'GET /api/users/non-existent returns 404');

    // 2.7 Update User Details
    const updateUserRes = await request(`/users/${createdUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Senior Operations Lead',
        department: 'Logistics and Supply Chain',
      }),
    });
    assert(updateUserRes.status === 200, 'PUT /api/users/:id returns 200');
    assert(updateUserRes.body.data.name === 'Senior Operations Lead', 'User name updated successfully');
    assert(updateUserRes.body.data.department === 'Logistics and Supply Chain', 'Department updated successfully');

    // 2.8 Update User Status
    const updateStatusRes = await request(`/users/${createdUser.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });
    assert(updateStatusRes.status === 200, 'PATCH /api/users/:id/status returns 200');
    assert(updateStatusRes.body.data.status === 'SUSPENDED', 'User status changed to SUSPENDED');

    const updateBadStatus = await request(`/users/${createdUser.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'BANNED_FOR_LIFE' }),
    });
    assert(updateBadStatus.status === 400, 'PATCH /api/users/:id/status with invalid status returns 400');

    // 2.9 User Search & Filters
    const searchUserRes = await request(`/users?search=${encodeURIComponent('Senior Operations')}`);
    assert(searchUserRes.status === 200, 'GET /api/users with search query returns 200');
    assert(searchUserRes.body.data.some((u) => u.id === createdUser.id), 'Search returned the newly updated user');

    const filterStatusRes = await request('/users?status=SUSPENDED');
    assert(filterStatusRes.status === 200, 'GET /api/users?status=SUSPENDED returns 200');
    assert(filterStatusRes.body.data.every((u) => u.status === 'SUSPENDED'), 'All filtered users have status=SUSPENDED');

    // ==========================================
    // 3. NOTIFICATION APIS
    // ==========================================
    console.log('\n--- TEST GROUP 3: NOTIFICATION APIS ---');

    // 3.1 List Notifications
    const notifsRes = await request('/notifications');
    assert(notifsRes.status === 200, 'GET /api/notifications returns 200');
    assert(Array.isArray(notifsRes.body.data), 'Notifications data is an array');
    assert(typeof notifsRes.body.unreadCount === 'number', 'Notifications response contains unreadCount');

    // 3.2 Notification Filtering
    const unreadNotifsRes = await request('/notifications?unreadOnly=true');
    assert(unreadNotifsRes.status === 200, 'GET /api/notifications?unreadOnly=true returns 200');
    assert(unreadNotifsRes.body.data.every((n) => n.read === false), 'All returned notifications are unread');

    // 3.3 Create Direct System Notification to test Read/Delete flow
    const testNotif = await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'System Diagnostic Test Alert',
        message: 'This is a verified test alert for lifecycle testing.',
        severity: 'INFO',
        read: false,
      },
    });
    assert(Boolean(testNotif && testNotif.id), 'Test notification created directly in DB');

    // 3.4 Get Notification By ID
    const getNotifRes = await request(`/notifications/${testNotif.id}`);
    assert(getNotifRes.status === 200, 'GET /api/notifications/:id returns 200');
    assert(getNotifRes.body.data.title === testNotif.title, 'Notification title matches');

    // 3.5 Mark Notification as Read
    const markReadRes = await request(`/notifications/${testNotif.id}/read`, {
      method: 'PATCH',
    });
    assert(markReadRes.status === 200, 'PATCH /api/notifications/:id/read returns 200');
    assert(markReadRes.body.data.read === true, 'Notification read flag set to true');

    // 3.6 Mark All As Read
    const markAllReadRes = await request('/notifications/read-all', {
      method: 'PATCH',
    });
    assert(markAllReadRes.status === 200, 'PATCH /api/notifications/read-all returns 200');
    assert(typeof markAllReadRes.body.updatedCount === 'number', 'markAllAsRead returns updatedCount');

    // Verify unread count is now 0
    const verifyUnreadRes = await request('/notifications?unreadOnly=true');
    assert(verifyUnreadRes.body.data.length === 0, 'Unread notification count is now 0');

    // 3.7 Delete Notification
    const deleteNotifRes = await request(`/notifications/${testNotif.id}`, {
      method: 'DELETE',
    });
    assert(deleteNotifRes.status === 200, 'DELETE /api/notifications/:id returns 200');
    const verifyDeleteRes = await request(`/notifications/${testNotif.id}`);
    assert(verifyDeleteRes.status === 404, 'Deleted notification returns 404 on subsequent GET');

    // ==========================================
    // 4. AUDIT LOG APIS
    // ==========================================
    console.log('\n--- TEST GROUP 4: AUDIT LOG APIS ---');

    // 4.1 List Audit Logs
    const auditLogsRes = await request('/audit-logs');
    assert(auditLogsRes.status === 200, 'GET /api/audit-logs returns 200');
    assert(Array.isArray(auditLogsRes.body.data), 'Audit logs data is an array');
    assert(auditLogsRes.body.pagination && typeof auditLogsRes.body.pagination.total === 'number', 'Audit logs pagination total exists');

    // 4.2 Verify User Creation Audit Log
    const userAuditRes = await request(`/audit-logs?module=USER&action=CREATE`);
    assert(userAuditRes.status === 200, 'GET /api/audit-logs?module=USER&action=CREATE returns 200');
    assert(userAuditRes.body.data.length > 0, 'Found audit log for USER CREATE');
    const userLog = userAuditRes.body.data[0];
    assert(userLog.module === 'USER' && userLog.action === 'CREATE', 'Log entry fields match USER:CREATE');

    // 4.3 Get Audit Log Details By ID
    const getAuditRes = await request(`/audit-logs/${userLog.id}`);
    assert(getAuditRes.status === 200, 'GET /api/audit-logs/:id returns 200');
    assert(getAuditRes.body.data.id === userLog.id, 'Fetched audit log ID matches');
    assert(getAuditRes.body.data.description !== undefined, 'Audit log description is present');

    // 4.4 Audit Log Filter Validations
    const badModuleAudit = await request('/audit-logs?module=INVALID_MODULE_XYZ');
    assert(badModuleAudit.status === 400, 'GET /api/audit-logs with invalid module returns 400');

    const badActionAudit = await request('/audit-logs?action=INVALID_ACTION_XYZ');
    assert(badActionAudit.status === 400, 'GET /api/audit-logs with invalid action returns 400');

    // ==========================================
    // 5. CROSS-MODULE FLOW 1: PROCUREMENT
    // ==========================================
    console.log('\n--- TEST GROUP 5: FLOW 1 — PROCUREMENT & AUDIT/NOTIF ---');
    // Supplier -> Purchase Order -> Approve -> Receive -> Inventory Increases -> RECEIPT Movement -> Audit Entry -> Notification

    // 5.1 Create Supplier
    const supCode = `SUP-SYS-${Date.now().toString().slice(-4)}`;
    const createSupRes = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Apex Global Logistics Partners',
        supplierCode: supCode,
        email: `apex_${Date.now()}@logistics.com`,
        phone: '+91 9988776655',
        status: 'ACTIVE',
      }),
    });
    assert(createSupRes.status === 201, 'Created supplier for Flow 1');
    const flowSupplier = createSupRes.body.data;

    // 5.2 Create Purchase Order
    const poNum = `PO-SYS-${Date.now().toString().slice(-5)}`;
    const createPoRes = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        poNumber: poNum,
        supplierId: flowSupplier.id,
        warehouseId: testWarehouse.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 20,
            unitPrice: 1500,
          },
        ],
      }),
    });
    assert(createPoRes.status === 201, 'Created Purchase Order for Flow 1');
    const flowPO = createPoRes.body.data;

    // 5.3 Verify Audit Log for PO Creation
    const poCreateAudit = await request(`/audit-logs?module=PURCHASE_ORDER&search=${encodeURIComponent(poNum)}`);
    assert(poCreateAudit.status === 200, 'Queried audit logs for PO creation');
    assert(poCreateAudit.body.data.some((l) => l.action === 'CREATE'), 'Audit log created for PURCHASE_ORDER CREATE');

    // 5.4 Approve PO
    const approvePoRes = await request(`/purchase-orders/${flowPO.id}/approve`, {
      method: 'PATCH',
    });
    assert(approvePoRes.status === 200, 'Approved PO for Flow 1');

    // 5.5 Verify PO Approval Notification & Audit
    const poApprovalAudit = await request(`/audit-logs?module=PURCHASE_ORDER&search=${encodeURIComponent(poNum)}`);
    assert(poApprovalAudit.body.data.some((l) => l.action === 'APPROVAL'), 'Audit log created for PURCHASE_ORDER APPROVAL');

    const poApprovalNotif = await request(`/notifications?type=PURCHASE_ORDER`);
    assert(poApprovalNotif.body.data.some((n) => n.relatedId === flowPO.id), 'Notification generated for PO Approval');

    // 5.6 Receive Goods
    const receiveRes = await request(`/purchase-orders/${flowPO.id}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            purchaseOrderItemId: flowPO.items[0].id,
            quantity: 20,
          },
        ],
      }),
    });
    assert(receiveRes.status === 200, 'Goods received for Flow 1 (20 units)');
    assert(receiveRes.body.data.status === 'RECEIVED', 'PO transitioned to RECEIVED');

    // 5.7 Verify StockMovement RECEIPT
    const movementsRes = await request(`/stock-movements?productId=${testProduct.id}&warehouseId=${testWarehouse.id}`);
    assert(movementsRes.status === 200, 'Stock movements retrieved for Flow 1');
    assert(movementsRes.body.data.some((m) => m.type === 'RECEIPT' && m.quantity === 20), 'StockMovement RECEIPT logged with quantity=20');

    // 5.8 Verify Receiving Notification
    const poReceiveNotif = await request(`/notifications?type=PURCHASE_ORDER`);
    assert(poReceiveNotif.body.data.some((n) => n.title.includes('Goods Received')), 'Notification generated for Goods Received');

    // ==========================================
    // 6. CROSS-MODULE FLOW 2: SALES FULFILLMENT
    // ==========================================
    console.log('\n--- TEST GROUP 6: FLOW 2 — SALES FULFILLMENT & AUDIT/NOTIF ---');
    // Order -> Reserve -> Confirm -> Processing -> Picking -> Packed -> Ship -> Inventory Decreases -> SALE Movement -> Audit -> Notification

    // 6.1 Create Customer Order
    const ordNum = `ORD-SYS-${Date.now().toString().slice(-5)}`;
    const createOrdRes = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: ordNum,
        customerName: 'Enterprise Client Tech Corp',
        customerEmail: 'tech@clientcorp.in',
        warehouseId: testWarehouse.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 5,
          },
        ],
      }),
    });
    assert(createOrdRes.status === 201, 'Created customer order for Flow 2');
    const flowOrder = createOrdRes.body.data;

    // 6.2 Verify Audit Log for Order Creation
    const ordCreateAudit = await request(`/audit-logs?module=ORDER&search=${encodeURIComponent(ordNum)}`);
    assert(ordCreateAudit.body.data.some((l) => l.action === 'CREATE'), 'Audit log created for ORDER CREATE');

    // 6.3 Reserve & Confirm Order
    const reserveRes = await request(`/orders/${flowOrder.id}/reserve`, {
      method: 'POST',
    });
    assert(reserveRes.status === 200, 'Stock reserved and order confirmed for Flow 2');

    // 6.4 Transition Pipeline: CONFIRMED -> PROCESSING -> PICKING -> PACKED -> SHIPPED
    await request(`/orders/${flowOrder.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'PROCESSING' }) });
    await request(`/orders/${flowOrder.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'PICKING' }) });
    await request(`/orders/${flowOrder.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'PACKED' }) });

    // Ship Order
    const shipRes = await request(`/orders/${flowOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    assert(shipRes.status === 200, 'Order transitioned to SHIPPED for Flow 2');

    // 6.5 Verify StockMovement SALE
    const saleMovementsRes = await request(`/stock-movements?productId=${testProduct.id}&warehouseId=${testWarehouse.id}`);
    assert(saleMovementsRes.body.data.some((m) => m.type === 'SALE' && m.quantity === 5), 'StockMovement SALE logged for shipped order');

    // 6.6 Verify Notification for Order Shipped
    const orderNotifs = await request(`/notifications?type=ORDER`);
    assert(orderNotifs.body.data.some((n) => n.relatedId === flowOrder.id), 'Notification generated for Order Shipped');

    // 6.7 Deliver Order
    const deliverRes = await request(`/orders/${flowOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    assert(deliverRes.status === 200, 'Order transitioned to DELIVERED');

    // ==========================================
    // 7. CROSS-MODULE FLOW 3 & 4: LOW_STOCK & OUT_OF_STOCK NOTIFICATIONS
    // ==========================================
    console.log('\n--- TEST GROUP 7: FLOW 3 & 4 — THRESHOLD NOTIFICATIONS ---');

    // 7.1 Trigger LOW_STOCK: Adjust inventory to reorder threshold (e.g. 5 units, where reorderLevel=10)
    // First set stock to 50 so previousStock > reorderLevel
    await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct.id,
        warehouseId: testWarehouse.id,
        type: 'SET',
        quantity: 50,
      }),
    });

    // Now adjust to 5 (crosses threshold into LOW_STOCK)
    const lowStockAdjustRes = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct.id,
        warehouseId: testWarehouse.id,
        type: 'SET',
        quantity: 5,
        reason: 'Simulate stock consumption to trigger low stock alert',
      }),
    });
    assert(lowStockAdjustRes.status === 200, 'Adjusted stock down to 5 units');
    assert(lowStockAdjustRes.body.data.stockStatus === 'LOW_STOCK', 'Inventory stockStatus is LOW_STOCK');

    // Verify LOW_STOCK notification was generated
    const lowStockNotifRes = await request('/notifications?type=LOW_STOCK');
    assert(lowStockNotifRes.body.data.some((n) => n.type === 'LOW_STOCK' && n.severity === 'WARNING'), 'LOW_STOCK notification generated');

    // 7.2 Trigger OUT_OF_STOCK: Adjust inventory to 0 units
    const outStockAdjustRes = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct.id,
        warehouseId: testWarehouse.id,
        type: 'SET',
        quantity: 0,
        reason: 'Simulate complete depletion to trigger out of stock alert',
      }),
    });
    assert(outStockAdjustRes.status === 200, 'Adjusted stock to 0 units');
    assert(outStockAdjustRes.body.data.stockStatus === 'OUT_OF_STOCK', 'Inventory stockStatus is OUT_OF_STOCK');

    // Verify OUT_OF_STOCK notification was generated
    const outStockNotifRes = await request('/notifications?type=OUT_OF_STOCK');
    assert(outStockNotifRes.body.data.some((n) => n.type === 'OUT_OF_STOCK' && n.severity === 'CRITICAL'), 'OUT_OF_STOCK notification generated');

    // Reset stock to healthy level for subsequent tests
    await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct.id,
        warehouseId: testWarehouse.id,
        type: 'SET',
        quantity: 50,
      }),
    });

    // ==========================================
    // 8. DIRECT PERSISTENCE & RECHECK REPORT ACCURACY
    // ==========================================
    console.log('\n--- TEST GROUP 8: DATABASE ACCURACY & DASHBOARD METRICS ---');
    const finalDashRes = await request('/reports/dashboard');
    assert(finalDashRes.status === 200, 'Fetched final dashboard report');
    assert(finalDashRes.body.data.inventory.totalCurrentStock > 0, 'Dashboard totalCurrentStock reflects persisted inventory');
    assert(finalDashRes.body.data.procurement.totalPurchaseOrders > 0, 'Dashboard totalPurchaseOrders reflects created POs');
    assert(finalDashRes.body.data.orders.totalOrders > 0, 'Dashboard totalOrders reflects created sales orders');
    assert(finalDashRes.body.data.users.total > 0, 'Dashboard users.total includes operator accounts');

  } catch (err) {
    console.error('Unhandled test suite error:', err);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`SYSTEM TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runSystemTestSuite();
