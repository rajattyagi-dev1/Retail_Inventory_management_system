const jwt = require('jsonwebtoken');
const prisma = require('./src/config/prisma');
const { seedDefaultUsers, generateToken } = require('./src/services/authService');

const BASE_URL = 'http://localhost:5000/api';

async function runAuthSuite() {
  console.log('====================================================');
  console.log('STARTING AUTHENTICATION & RBAC SECURITY TEST SUITE');
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

  async function request(path, options = {}, token = null) {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
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
    // Setup: Seed default users
    console.log('--- TEST GROUP 0: SETUP & HEALTH ---');
    await seedDefaultUsers();
    const health = await request('/health');
    assert(health.status === 200 && health.body.database === 'connected', 'GET /api/health is public and returns 200');

    // ==========================================
    // 1. LOGIN VALIDATION & CREDENTIAL TESTING
    // ==========================================
    console.log('\n--- TEST GROUP 1: LOGIN VALIDATION & CREDENTIAL SECURITY ---');

    const missingEmail = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'Password123!' }),
    });
    assert(missingEmail.status === 400, 'Login without email returns 400');

    const missingPassword = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@retailflow.com' }),
    });
    assert(missingPassword.status === 400, 'Login without password returns 400');

    const invalidEmail = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email', password: 'Password123!' }),
    });
    assert(invalidEmail.status === 400, 'Login with invalid email format returns 400');

    const nonexistentUser = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody_here@retailflow.com', password: 'Password123!' }),
    });
    assert(nonexistentUser.status === 401, 'Login with nonexistent email returns 401 (generic error)');
    assert(
      nonexistentUser.body.message === 'Invalid email or password',
      'Generic credential failure message prevents user enumeration'
    );

    const wrongPassword = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@retailflow.com', password: 'IncorrectPassword999!' }),
    });
    assert(wrongPassword.status === 401, 'Login with wrong password returns 401');
    assert(
      wrongPassword.body.message === 'Invalid email or password',
      'Generic credential failure matches for wrong password'
    );

    // Setup an INACTIVE test user
    const inactiveUser = await prisma.user.upsert({
      where: { email: 'inactive_test@retailflow.com' },
      update: { status: 'INACTIVE' },
      create: {
        name: 'Inactive User',
        email: 'inactive_test@retailflow.com',
        status: 'INACTIVE',
        passwordHash: '$2a$10$wKzNl6g3eR1o5R3/c.tqqu1c.9R9tWqXGj3qL3hXbK1pC6y0ZzV1W',
        role: { connect: { name: 'STAFF' } },
      },
    });

    const inactiveLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'inactive_test@retailflow.com', password: 'Password123!' }),
    });
    assert(inactiveLogin.status === 401, 'Login with INACTIVE account returns 401');

    // Setup a SUSPENDED test user
    const suspendedUser = await prisma.user.upsert({
      where: { email: 'suspended_test@retailflow.com' },
      update: { status: 'SUSPENDED' },
      create: {
        name: 'Suspended User',
        email: 'suspended_test@retailflow.com',
        status: 'SUSPENDED',
        passwordHash: '$2a$10$wKzNl6g3eR1o5R3/c.tqqu1c.9R9tWqXGj3qL3hXbK1pC6y0ZzV1W',
        role: { connect: { name: 'STAFF' } },
      },
    });

    const suspendedLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'suspended_test@retailflow.com', password: 'Password123!' }),
    });
    assert(suspendedLogin.status === 401, 'Login with SUSPENDED account returns 401');

    // Valid Login for Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@retailflow.com', password: 'Password123!' }),
    });
    assert(adminLogin.status === 200, 'Valid login returns 200');
    assert(adminLogin.body.data && adminLogin.body.data.token, 'Login returns JWT token');
    assert(adminLogin.body.data.user && adminLogin.body.data.user.email === 'admin@retailflow.com', 'Login returns user profile');
    assert(adminLogin.body.data.user.role === 'ADMIN', 'User role is ADMIN');
    assert(
      adminLogin.body.data.user.password === undefined &&
      adminLogin.body.data.user.passwordHash === undefined,
      'Password or passwordHash is never returned in login response'
    );

    const adminToken = adminLogin.body.data.token;

    // Inspect decoded JWT payload
    const decodedJwt = jwt.decode(adminToken);
    assert(decodedJwt.userId && decodedJwt.role === 'ADMIN', 'JWT payload contains userId and role');
    assert(
      decodedJwt.password === undefined &&
      decodedJwt.passwordHash === undefined,
      'JWT payload does not contain sensitive credentials'
    );

    // ==========================================
    // 2. JWT TOKEN SECURITY & /api/auth/me
    // ==========================================
    console.log('\n--- TEST GROUP 2: JWT TOKEN VALIDATION & /api/auth/me ---');

    const meNoToken = await request('/auth/me');
    assert(meNoToken.status === 401, 'GET /api/auth/me without token returns 401');

    const meMalformedToken = await request('/auth/me', {}, 'malformed.token.string');
    assert(meMalformedToken.status === 401, 'GET /api/auth/me with malformed token returns 401');

    const badSecretToken = jwt.sign({ userId: inactiveUser.id, role: 'ADMIN' }, 'wrong_secret_12345');
    const meBadSignature = await request('/auth/me', {}, badSecretToken);
    assert(meBadSignature.status === 401, 'GET /api/auth/me with invalid signature returns 401');

    const expiredToken = jwt.sign(
      { userId: inactiveUser.id, role: 'ADMIN' },
      process.env.JWT_SECRET || 'retail_inventory_jwt_secret_dev_2026',
      { expiresIn: '-1s' }
    );
    const meExpired = await request('/auth/me', {}, expiredToken);
    assert(meExpired.status === 401, 'GET /api/auth/me with expired token returns 401');

    const meValid = await request('/auth/me', {}, adminToken);
    assert(meValid.status === 200, 'GET /api/auth/me with valid token returns 200');
    assert(meValid.body.data.email === 'admin@retailflow.com', 'Current user email matches');
    assert(meValid.body.data.role === 'ADMIN', 'Current user role matches');
    assert(
      meValid.body.data.password === undefined &&
      meValid.body.data.passwordHash === undefined,
      'GET /api/auth/me never returns credentials'
    );

    // Logout
    const logoutRes = await request('/auth/logout', { method: 'POST' }, adminToken);
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200');

    // ==========================================
    // 3. ROLE-BASED ACCESS CONTROL (RBAC) GUARDS
    // ==========================================
    console.log('\n--- TEST GROUP 3: ROLE-BASED ACCESS CONTROL (RBAC) ---');

    // Obtain tokens for other roles
    const staffLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staff@retailflow.com', password: 'Password123!' }),
    });
    const staffToken = staffLogin.body.data.token;

    const procLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'procurement@retailflow.com', password: 'Password123!' }),
    });
    const procToken = procLogin.body.data.token;

    const salesLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sales@retailflow.com', password: 'Password123!' }),
    });
    const salesToken = salesLogin.body.data.token;

    const invLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'inventory@retailflow.com', password: 'Password123!' }),
    });
    const invToken = invLogin.body.data.token;

    const whLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'warehouse@retailflow.com', password: 'Password123!' }),
    });
    const whToken = whLogin.body.data.token;

    // Staff access restrictions
    const staffUsers = await request('/users', {}, staffToken);
    assert(staffUsers.status === 403, 'STAFF access to /api/users returns 403 Forbidden');

    const staffAdminDash = await request('/admin/dashboard', {}, staffToken);
    assert(staffAdminDash.status === 403, 'STAFF access to /api/admin/dashboard returns 403 Forbidden');

    const staffAudit = await request('/audit-logs', {}, staffToken);
    assert(staffAudit.status === 403, 'STAFF access to /api/audit-logs returns 403 Forbidden');

    const dummyWh = await prisma.warehouse.findFirst();
    const dummyProd = await prisma.product.findFirst();

    const staffStockAdjust = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: dummyProd.id,
        warehouseId: dummyWh.id,
        quantity: 10,
        type: 'ADD',
      }),
    }, staffToken);
    assert(staffStockAdjust.status === 403, 'STAFF cannot adjust inventory (403)');

    // Sales cannot adjust stock or approve POs
    const salesStockAdjust = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: dummyProd.id,
        warehouseId: dummyWh.id,
        quantity: 10,
        type: 'ADD',
      }),
    }, salesToken);
    assert(salesStockAdjust.status === 403, 'SALES_MANAGER cannot adjust physical inventory (403)');

    const salesApprovePo = await request('/purchase-orders/dummy-id/approve', {
      method: 'PATCH',
    }, salesToken);
    assert(salesApprovePo.status === 403, 'SALES_MANAGER cannot approve purchase orders (403)');

    // Procurement cannot create sales orders
    const procCreateOrder = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        warehouseId: dummyWh.id,
        items: [{ productId: dummyProd.id, quantity: 1, unitPrice: 100 }],
      }),
    }, procToken);
    assert(procCreateOrder.status === 403, 'PROCUREMENT_MANAGER cannot create customer orders (403)');

    // Non-admin cannot create users
    const invCreateUser = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Hacker User',
        email: 'hacker@retailflow.com',
        role: 'ADMIN',
      }),
    }, invToken);
    assert(invCreateUser.status === 403, 'Non-admin (INVENTORY_MANAGER) cannot create users (403)');

    // ==========================================
    // 4. USER MANAGEMENT SECURITY & AUDIT ACTOR
    // ==========================================
    console.log('\n--- TEST GROUP 4: USER CREATION SECURITY & AUDIT ACTOR ---');

    const adminCreateUser = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Secured Junior Staff',
        email: `secured_staff_${Date.now()}@retailflow.com`,
        department: 'Operations',
        role: 'STAFF',
        password: 'CustomSecurePassword!2026',
      }),
    }, adminToken);
    assert(adminCreateUser.status === 201, 'ADMIN can create users with custom credentials');
    assert(
      adminCreateUser.body.data.password === undefined &&
      adminCreateUser.body.data.passwordHash === undefined,
      'Created user response does not leak password or passwordHash'
    );

    // Verify Audit actor captured correctly from req.user.id
    const recentAudit = await prisma.auditLog.findFirst({
      where: {
        module: 'USER',
        action: 'CREATE',
        entityId: adminCreateUser.body.data.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(recentAudit !== null, 'Audit log created for user creation');
    assert(recentAudit.userId !== null, 'Audit log records authenticated userId');
    assert(recentAudit.userRole === 'ADMIN', 'Audit log records authenticated userRole');

    // Verify spoofing prevention on stock adjustment
    const spoofAttempt = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: dummyProd.id,
        warehouseId: dummyWh.id,
        quantity: 5,
        type: 'ADD',
        performedById: 'spoofed_malicious_user_id_123',
        notes: 'Security check adjustment',
      }),
    }, adminToken);
    assert(spoofAttempt.status === 200, 'Admin adjustment successful');

    const adjustAudit = await prisma.auditLog.findFirst({
      where: {
        module: 'INVENTORY',
        action: 'STOCK_ADJUSTMENT',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(
      adjustAudit && adjustAudit.userId !== 'spoofed_malicious_user_id_123',
      'Client cannot spoof audit log userId (req.user.id enforced)'
    );

    // ==========================================
    // 5. NOTIFICATION OWNERSHIP & PRIVACY
    // ==========================================
    console.log('\n--- TEST GROUP 5: NOTIFICATION OWNERSHIP & PRIVACY ---');

    // Create private notification for admin
    const adminUserRecord = await prisma.user.findUnique({ where: { email: 'admin@retailflow.com' } });
    const staffUserRecord = await prisma.user.findUnique({ where: { email: 'staff@retailflow.com' } });

    const adminPrivateNotif = await prisma.notification.create({
      data: {
        userId: adminUserRecord.id,
        type: 'SYSTEM',
        title: 'Confidential Admin Notice',
        message: 'Top secret system notification',
      },
    });

    // Staff attempts to access notifications with ?userId=adminUserRecord.id
    const staffGetNotifs = await request(`/notifications?userId=${adminUserRecord.id}`, {}, staffToken);
    assert(staffGetNotifs.status === 200, 'GET /api/notifications returns 200');
    const staffFoundSecret = staffGetNotifs.body.data.some((n) => n.id === adminPrivateNotif.id);
    assert(!staffFoundSecret, 'Staff user cannot retrieve admin private notifications via query param');

    // Clean up test notif
    await prisma.notification.delete({ where: { id: adminPrivateNotif.id } });

    // ==========================================
    // 6. CROSS-MODULE FLOW 1 — PROCUREMENT MANAGER
    // ==========================================
    console.log('\n--- TEST GROUP 6: FLOW 1 — PROCUREMENT MANAGER ---');

    const testSupCode = `SUP-SEC-${Date.now().toString().slice(-5)}`;
    const createSup = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Secured Defense Supplier Ltd',
        supplierCode: testSupCode,
        contactPerson: 'Mr. Procurement Leader',
        email: `contact_${Date.now()}@supplier.com`,
      }),
    }, procToken);
    assert(createSup.status === 201, 'PROCUREMENT_MANAGER can create supplier');
    const createdSupplier = createSup.body.data;

    const assignProd = await request(`/suppliers/${createdSupplier.id}/products`, {
      method: 'POST',
      body: JSON.stringify({
        productId: dummyProd.id,
        costPrice: 500,
        leadTimeDays: 7,
      }),
    }, procToken);
    assert(assignProd.status === 201, 'PROCUREMENT_MANAGER can associate supplier with product');

    const createPo = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        poNumber: `PO-SEC-${Date.now().toString().slice(-6)}`,
        supplierId: createdSupplier.id,
        warehouseId: dummyWh.id,
        expectedDate: new Date(Date.now() + 86400000).toISOString(),
        items: [{ productId: dummyProd.id, quantity: 15, unitCost: 500 }],
      }),
    }, procToken);
    assert(createPo.status === 201, 'PROCUREMENT_MANAGER can create PO');
    const poId = createPo.body.data.id;

    const approvePo = await request(`/purchase-orders/${poId}/approve`, {
      method: 'PATCH',
    }, procToken);
    assert(approvePo.status === 200, 'PROCUREMENT_MANAGER can approve PO');

    const procReport = await request('/reports/procurement', {}, procToken);
    assert(procReport.status === 200, 'PROCUREMENT_MANAGER can access procurement reports');

    const procDeniedAdmin = await request('/admin/dashboard', {}, procToken);
    assert(procDeniedAdmin.status === 403, 'PROCUREMENT_MANAGER is denied admin dashboard');

    // ==========================================
    // 7. CROSS-MODULE FLOW 2 — WAREHOUSE MANAGER
    // ==========================================
    console.log('\n--- TEST GROUP 7: FLOW 2 — WAREHOUSE MANAGER ---');

    const whWarehouses = await request('/warehouses', {}, whToken);
    assert(whWarehouses.status === 200, 'WAREHOUSE_MANAGER can view warehouses');

    const whInventory = await request('/inventory', {}, whToken);
    assert(whInventory.status === 200, 'WAREHOUSE_MANAGER can view inventory');

    // Receive goods on the approved PO
    const receiveGoods = await request(`/purchase-orders/${poId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: dummyProd.id, quantity: 15 }],
      }),
    }, whToken);
    assert(receiveGoods.status === 200, 'WAREHOUSE_MANAGER can receive goods on approved PO');

    const whStockAdjust = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: dummyProd.id,
        warehouseId: dummyWh.id,
        quantity: 2,
        type: 'ADD',
        notes: 'Warehouse manager operational replenishment',
      }),
    }, whToken);
    assert(whStockAdjust.status === 200, 'WAREHOUSE_MANAGER can adjust stock');

    const whDeniedUsers = await request('/users', {}, whToken);
    assert(whDeniedUsers.status === 403, 'WAREHOUSE_MANAGER cannot manage users');

    // ==========================================
    // 8. CROSS-MODULE FLOW 3 — SALES MANAGER
    // ==========================================
    console.log('\n--- TEST GROUP 8: FLOW 3 — SALES MANAGER ---');

    const createOrder = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Enterprise Client Inc',
        customerEmail: 'procurement@enterprise.com',
        warehouseId: dummyWh.id,
        items: [{ productId: dummyProd.id, quantity: 2, unitPrice: 1200 }],
      }),
    }, salesToken);
    assert(createOrder.status === 201, 'SALES_MANAGER can create customer order');
    const orderId = createOrder.body.data.id;

    const reserveOrder = await request(`/orders/${orderId}/reserve`, {
      method: 'POST',
    }, salesToken);
    assert(reserveOrder.status === 200, 'SALES_MANAGER can reserve stock for order');

    const advanceOrder = await request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PROCESSING' }),
    }, salesToken);
    assert(advanceOrder.status === 200, 'SALES_MANAGER can advance fulfillment state');

    const salesReport = await request('/reports/orders', {}, salesToken);
    assert(salesReport.status === 200, 'SALES_MANAGER can view order reports');

    const salesDeniedPo = await request(`/purchase-orders/${poId}/approve`, {
      method: 'PATCH',
    }, salesToken);
    assert(salesDeniedPo.status === 403, 'SALES_MANAGER cannot approve purchase orders');

    // ==========================================
    // 9. CROSS-MODULE FLOW 4 — INVENTORY MANAGER
    // ==========================================
    console.log('\n--- TEST GROUP 9: FLOW 4 — INVENTORY MANAGER ---');

    const invInventory = await request('/inventory', {}, invToken);
    assert(invInventory.status === 200, 'INVENTORY_MANAGER can view inventory');

    const invAdjust = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: dummyProd.id,
        warehouseId: dummyWh.id,
        quantity: 1,
        type: 'ADD',
      }),
    }, invToken);
    assert(invAdjust.status === 200, 'INVENTORY_MANAGER can perform stock adjustments');

    const invMovements = await request('/stock-movements', {}, invToken);
    assert(invMovements.status === 200, 'INVENTORY_MANAGER can view stock movements');

    const invReport = await request('/reports/inventory', {}, invToken);
    assert(invReport.status === 200, 'INVENTORY_MANAGER can view inventory reports');

    // ==========================================
    // 10. CROSS-MODULE FLOW 5 — ADMIN FULL ACCESS
    // ==========================================
    console.log('\n--- TEST GROUP 10: FLOW 5 — ADMIN FULL PRIVILEGES ---');

    const adminDashboard = await request('/admin/dashboard', {}, adminToken);
    assert(adminDashboard.status === 200, 'ADMIN can access admin dashboard');

    const adminUsers = await request('/users', {}, adminToken);
    assert(adminUsers.status === 200, 'ADMIN can access users list');

    const adminAudit = await request('/audit-logs', {}, adminToken);
    assert(adminAudit.status === 200, 'ADMIN can access audit logs');

    const adminOrders = await request('/orders', {}, adminToken);
    assert(adminOrders.status === 200, 'ADMIN can access orders');

    const adminPos = await request('/purchase-orders', {}, adminToken);
    assert(adminPos.status === 200, 'ADMIN can access purchase orders');

    // ==========================================
    // 11. CROSS-MODULE FLOW 6 — STAFF RESTRICTIONS
    // ==========================================
    console.log('\n--- TEST GROUP 11: FLOW 6 — STAFF PERMISSIONS & DENIALS ---');

    const staffProducts = await request('/products', {}, staffToken);
    assert(staffProducts.status === 200, 'STAFF can view products catalog');

    const staffWarehouses = await request('/warehouses', {}, staffToken);
    assert(staffWarehouses.status === 200, 'STAFF can view warehouses');

    const staffModifyProduct = await request('/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacked Product', sku: 'HACK-1' }),
    }, staffToken);
    assert(staffModifyProduct.status === 403, 'STAFF cannot create products (403)');

    const staffModifyWarehouse = await request('/warehouses', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacked Hub', code: 'HACK-HUB' }),
    }, staffToken);
    assert(staffModifyWarehouse.status === 403, 'STAFF cannot create warehouses (403)');

    const staffAdminReports = await request('/admin/dashboard', {}, staffToken);
    assert(staffAdminReports.status === 403, 'STAFF cannot view admin dashboard (403)');

    console.log('\n====================================================');
    console.log(`AUTH TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error in auth test suite:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthSuite();
