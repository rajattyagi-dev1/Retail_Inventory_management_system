/**
 * End-to-End Frontend-Backend Authentication and API Integration Verification Script.
 * Verifies all requirements specified in Task 15.
 */

const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:5173';

async function runTests() {
  console.log('===========================================================');
  console.log('STARTING FRONTEND AUTHENTICATION & API INTEGRATION AUDIT');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // --- 1. Client Dev Server Availability ---
  console.log('--- 1. Frontend Client Availability ---');
  try {
    const clientRes = await fetch(CLIENT_URL);
    const clientHtml = await clientRes.text();
    assert(clientRes.status === 200, `Vite frontend is serving on ${CLIENT_URL}`);
    assert(clientHtml.includes('Retail Inventory Management System') || clientHtml.includes('root'), 'Vite HTML shell contains expected DOM root');
  } catch (err) {
    assert(false, `Failed to reach frontend on ${CLIENT_URL}: ${err.message}`);
  }

  // --- 2. Unauthenticated Protected Request (Current Frontend Bug Check) ---
  console.log('\n--- 2. Unauthenticated Request Security ---');
  try {
    const unauthProductsRes = await fetch(`${BASE_URL}/products`);
    const unauthProducts = await unauthProductsRes.json();
    assert(unauthProductsRes.status === 401, 'GET /api/products without token returns 401 Unauthorized');
    assert(unauthProducts.message === 'Authentication token is required', 'Error message is "Authentication token is required"');
  } catch (err) {
    assert(false, `Unexpected error on unauth check: ${err.message}`);
  }

  // --- 3. Login Flow ---
  console.log('\n--- 3. Login Flow (POST /api/auth/login) ---');
  let adminToken = null;
  let adminUser = null;
  try {
    // A. Invalid credentials test
    const invalidRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@retailflow.com', password: 'WrongPassword999!' }),
    });
    const invalidData = await invalidRes.json();
    assert(invalidRes.status === 401, 'Invalid credentials return 401');
    assert(invalidData.message === 'Invalid email or password', 'Generic error prevents user enumeration');

    // B. Valid credentials test
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@retailflow.com', password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Valid login returns 200 OK');
    assert(loginData.success === true, 'Response indicates success: true');
    assert(Boolean(loginData.data?.token), 'Response contains JWT token string');
    assert(loginData.data?.user?.email === 'admin@retailflow.com', 'Returned user email matches admin@retailflow.com');
    assert(loginData.data?.user?.name === 'System Administrator', 'Returned user name is "System Administrator"');
    assert(loginData.data?.user?.role === 'ADMIN', 'Returned user role is "ADMIN"');
    assert(!loginData.data?.user?.passwordHash, 'User object does NOT leak passwordHash');

    adminToken = loginData.data.token;
    adminUser = loginData.data.user;
  } catch (err) {
    assert(false, `Login flow error: ${err.message}`);
  }

  // --- 4. Authoritative Session Verification (GET /api/auth/me) ---
  console.log('\n--- 4. Authoritative User Profile (GET /api/auth/me) ---');
  try {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me with Bearer token returns 200');
    assert(meData.data?.email === 'admin@retailflow.com', 'Authoritative email matches');
    assert(meData.data?.name === 'System Administrator', 'Authoritative name is "System Administrator" (NOT "Alex Mercer")');
    assert(meData.data?.role === 'ADMIN', 'Authoritative role is "ADMIN"');
  } catch (err) {
    assert(false, `GET /api/auth/me error: ${err.message}`);
  }

  // --- 5. Protected Products API with JWT ---
  console.log('\n--- 5. Protected Products API with JWT Bearer Token ---');
  try {
    const productsRes = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const productsData = await productsRes.json();
    assert(productsRes.status === 200, 'GET /api/products returns 200 with Bearer token');
    assert(Array.isArray(productsData.data), 'GET /api/products returns array of products');
    assert(productsData.message !== 'Authentication token is required', 'No "Authentication token is required" error');
    assert(productsData.data.length > 0, `Returned ${productsData.data.length} real products from database`);
  } catch (err) {
    assert(false, `GET /api/products error: ${err.message}`);
  }

  // --- 6. Other Core Protected APIs with JWT ---
  console.log('\n--- 6. Other Protected Modules Integration ---');
  try {
    // Categories
    const catRes = await fetch(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(catRes.status === 200, 'GET /api/categories returns 200 with Bearer token');

    // Warehouses
    const whRes = await fetch(`${BASE_URL}/warehouses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(whRes.status === 200, 'GET /api/warehouses returns 200 with Bearer token');

    // Inventory
    const invRes = await fetch(`${BASE_URL}/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(invRes.status === 200, 'GET /api/inventory returns 200 with Bearer token');

    // Admin Dashboard
    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDashRes.status === 200, 'GET /api/admin/dashboard returns 200 for ADMIN role');

    // Users
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(usersRes.status === 200, 'GET /api/users returns 200 for ADMIN role');
  } catch (err) {
    assert(false, `Module audit error: ${err.message}`);
  }

  // --- 7. RBAC Security & 403 Forbidden Enforcement ---
  console.log('\n--- 7. RBAC Role Enforcement (STAFF role) ---');
  try {
    // Login as STAFF
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@retailflow.com', password: 'Password123!' }),
    });
    const staffLoginData = await staffLoginRes.json();
    assert(staffLoginRes.status === 200, 'STAFF login successful');
    assert(staffLoginData.data.user.role === 'STAFF', 'STAFF role confirmed');

    const staffToken = staffLoginData.data.token;

    // STAFF can view products
    const staffProductsRes = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(staffProductsRes.status === 200, 'STAFF can view products (200 OK)');

    // STAFF cannot access admin dashboard (403)
    const staffAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(staffAdminRes.status === 403, 'STAFF denied from /api/admin/dashboard with 403 Forbidden');

    // STAFF cannot access user management (403)
    const staffUsersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(staffUsersRes.status === 403, 'STAFF denied from /api/users with 403 Forbidden');

    // STAFF cannot access audit logs (403)
    const staffAuditRes = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(staffAuditRes.status === 403, 'STAFF denied from /api/audit-logs with 403 Forbidden');
  } catch (err) {
    assert(false, `RBAC test error: ${err.message}`);
  }

  // --- 8. Invalid / Expired Token Handling (401) ---
  console.log('\n--- 8. Malformed & Expired Token Handling ---');
  try {
    const invalidTokenRes = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: 'Bearer bad.token.value' },
    });
    assert(invalidTokenRes.status === 401, 'Invalid Bearer token returns 401 Unauthorized');
  } catch (err) {
    assert(false, `Invalid token test error: ${err.message}`);
  }

  // --- 9. Logout Flow (POST /api/auth/logout) ---
  console.log('\n--- 9. Logout Flow ---');
  try {
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');
    assert(logoutData.message === 'Logged out successfully', 'Logout message confirmed');
  } catch (err) {
    assert(false, `Logout flow error: ${err.message}`);
  }

  console.log('\n===========================================================');
  console.log(`INTEGRATION AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runTests();
