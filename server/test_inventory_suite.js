const prisma = require('./src/config/prisma');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING RETAIL INVENTORY & STOCK MOVEMENT TEST SUITE');
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

  // Helper fetch wrapper with authentication support
  let adminToken = null;

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
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
    const { seedDefaultUsers, generateToken } = require('./src/services/authService');
    await seedDefaultUsers();
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@retailflow.com' },
      include: { role: true },
    });
    if (adminUser) {
      adminToken = generateToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role.name,
      });
    }

    // 0. HEALTH CHECK & REGRESSION BASELINES
    console.log('--- TEST GROUP 0: BASELINE HEALTH & REGRESSION ---');
    const health = await request('/health');
    assert(health.status === 200 && health.body.database === 'connected', 'GET /api/health returns 200 & db connected');

    const productsRes = await request('/products');
    assert(productsRes.status === 200 && Array.isArray(productsRes.body.data), 'GET /api/products returns 200');
    const products = productsRes.body.data;
    assert(products.length >= 2, `At least 2 products exist (found ${products.length})`);

    const categoriesRes = await request('/categories');
    assert(categoriesRes.status === 200 && Array.isArray(categoriesRes.body.data), 'GET /api/categories returns 200');

    const warehousesRes = await request('/warehouses');
    assert(warehousesRes.status === 200 && Array.isArray(warehousesRes.body.data), 'GET /api/warehouses returns 200');
    const warehouses = warehousesRes.body.data;
    assert(warehouses.length >= 2, `At least 2 warehouses exist (found ${warehouses.length})`);

    const testProduct1 = products[0];
    const testProduct2 = products[1];
    const testWarehouse1 = warehouses[0];
    const testWarehouse2 = warehouses[1];

    console.log(`Test Product 1: ${testProduct1.name} (${testProduct1.id})`);
    console.log(`Test Product 2: ${testProduct2.name} (${testProduct2.id})`);
    console.log(`Test Warehouse 1: ${testWarehouse1.name} (${testWarehouse1.id})`);
    console.log(`Test Warehouse 2: ${testWarehouse2.name} (${testWarehouse2.id})\n`);

    // D. STOCK ADJUSTMENT (INITIAL SETUP + ADD / REMOVE / SET)
    console.log('--- TEST GROUP D: STOCK ADJUSTMENTS & ATOMIC TRANSACTIONS ---');
    
    // Reset Product1 at Warehouse1 to 0 before initial test to ensure idempotency across multiple runs
    await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct1.id,
        warehouseId: testWarehouse1.id,
        type: 'SET',
        quantity: 0,
        reason: 'Test setup baseline reset',
      }),
    });

    // Initial ADD for Product1 at Warehouse1
    console.log('1. Initial stock adjustment: ADD 50 units');
    const adjInit = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct1.id,
        warehouseId: testWarehouse1.id,
        type: 'ADD',
        quantity: 50,
        reason: 'Initial Inbound Consignment',
        reference: 'TEST-PO-001',
        performedBy: 'Quality Inspector',
        notes: 'Initial stock intake test',
      }),
    });
    assert(adjInit.status === 200, `POST /api/inventory/adjust (ADD 50) returns 200 (Got ${adjInit.status})`);
    assert(adjInit.body.data?.currentStock === 50, `Inventory currentStock is 50 (Got ${adjInit.body.data?.currentStock})`);
    assert(adjInit.body.data?.availableStock === 50, `Inventory availableStock is 50 (Got ${adjInit.body.data?.availableStock})`);
    assert(adjInit.body.data?.stockStatus === 'IN_STOCK', `stockStatus is IN_STOCK (Got ${adjInit.body.data?.stockStatus})`);
    assert(adjInit.body.movement?.type === 'ADJUSTMENT', `Stock movement created with type ADJUSTMENT`);
    assert(adjInit.body.movement?.quantity === 50, `Stock movement quantity is 50`);
    assert(adjInit.body.movement?.reference === 'TEST-PO-001', `Stock movement reference matches`);

    const targetInventoryId = adjInit.body.data?.id;
    assert(Boolean(targetInventoryId), `Created target inventory id: ${targetInventoryId}`);

    // Test ADD 10 by inventoryId
    console.log('2. Perform ADD 10 on existing inventory');
    const oldStock = adjInit.body.data.currentStock;
    const adjAdd = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'ADD STOCK',
        quantity: 10,
        reason: 'Cycle Count Audit Discrepancy',
        reference: 'AUD-2026-001',
        performedBy: 'Alex Mercer',
      }),
    });
    assert(adjAdd.status === 200, `POST /api/inventory/adjust (ADD 10) returns 200`);
    assert(adjAdd.body.data.currentStock === oldStock + 10, `newStock (${adjAdd.body.data.currentStock}) = oldStock (${oldStock}) + 10`);
    assert(adjAdd.body.movement?.quantity === 10, `Movement quantity is 10`);

    // Test REMOVE 5
    console.log('3. Perform REMOVE 5 on existing inventory');
    const prevStock = adjAdd.body.data.currentStock;
    const adjRemove = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'REMOVE STOCK',
        quantity: 5,
        reason: 'Damaged / Defective Stock Removed',
        notes: 'Damaged during bay transfer',
        reference: 'DMG-2026-001',
      }),
    });
    assert(adjRemove.status === 200, `POST /api/inventory/adjust (REMOVE 5) returns 200`);
    assert(adjRemove.body.data.currentStock === prevStock - 5, `newStock (${adjRemove.body.data.currentStock}) = previousStock (${prevStock}) - 5`);
    assert(adjRemove.body.movement?.quantity === -5, `Movement quantity is -5`);

    // Test SET 20
    console.log('4. Perform SET 20 on existing inventory');
    const adjSet = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'SET STOCK',
        quantity: 20,
        reason: 'Reconciliation',
        reference: 'REC-2026-001',
      }),
    });
    assert(adjSet.status === 200, `POST /api/inventory/adjust (SET 20) returns 200`);
    assert(adjSet.body.data.currentStock === 20, `newStock = 20 (Got ${adjSet.body.data.currentStock})`);
    assert(adjSet.body.movement?.quantity === 20 - (prevStock - 5), `Movement quantity matches difference (${20 - (prevStock - 5)})`);

    // Create a 2nd inventory record for Product 2 at Warehouse 1 with stock = 5 (LOW_STOCK)
    console.log('5. Setup 2nd inventory (Product 2, Warehouse 1, stock = 5, LOW_STOCK)');
    const adjLow = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct2.id,
        warehouseId: testWarehouse1.id,
        type: 'SET',
        quantity: 5,
        reason: 'Low Stock Test Item',
      }),
    });
    assert(adjLow.status === 200, `Setup LOW_STOCK inventory returns 200`);
    assert(adjLow.body.data?.stockStatus === 'LOW_STOCK', `Stock status is LOW_STOCK for 5 units (reorderLevel 10)`);

    // Create a 3rd inventory record for Product 1 at Warehouse 2 with stock = 0 (OUT_OF_STOCK)
    console.log('6. Setup 3rd inventory (Product 1, Warehouse 2, stock = 0, OUT_OF_STOCK)');
    const adjZero = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: testProduct1.id,
        warehouseId: testWarehouse2.id,
        type: 'SET',
        quantity: 0,
        reason: 'Zero Stock Test Item',
      }),
    });
    assert(adjZero.status === 200, `Setup OUT_OF_STOCK inventory returns 200`);
    assert(adjZero.body.data?.stockStatus === 'OUT_OF_STOCK', `Stock status is OUT_OF_STOCK for 0 units`);

    // E. NEGATIVE STOCK PROTECTION
    console.log('\n--- TEST GROUP E: NEGATIVE STOCK PROTECTION ---');
    console.log('Attempting to REMOVE 100 units from inventory with currentStock = 20...');
    const negRemove = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'REMOVE',
        quantity: 100,
      }),
    });
    assert(negRemove.status === 400, `HTTP 400 returned for over-removal (Got ${negRemove.status})`);
    assert(negRemove.body.success === false, `Response success is false`);

    // Verify inventory remained unchanged in DB
    const checkInvAfterNeg = await request(`/inventory/${targetInventoryId}`);
    assert(checkInvAfterNeg.body.data?.currentStock === 20, `Inventory currentStock remained exactly 20 after rejected REMOVE`);

    // Attempt SET negative stock (-10)
    console.log('Attempting to SET negative stock (-10)...');
    const negSet = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'SET',
        quantity: -10,
      }),
    });
    assert(negSet.status === 400, `HTTP 400 returned for negative SET stock`);

    // Attempt invalid quantity (0 for ADD)
    const zeroAdd = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'ADD',
        quantity: 0,
      }),
    });
    assert(zeroAdd.status === 400, `HTTP 400 returned for ADD quantity = 0`);

    // G. TRANSACTION SAFETY & ROLLBACK VERIFICATION
    console.log('\n--- TEST GROUP G: TRANSACTION SAFETY & ROLLBACK ---');
    const movementsBeforeFailed = await prisma.stockMovement.count();
    
    // Attempt invalid adjustment with non-existent performedById (foreign key or service check)
    // or invalid type
    const invalidAdj = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        inventoryId: targetInventoryId,
        type: 'INVALID_TYPE',
        quantity: 15,
      }),
    });
    assert(invalidAdj.status === 400, `Invalid adjustment type returned 400`);

    const movementsAfterFailed = await prisma.stockMovement.count();
    assert(movementsAfterFailed === movementsBeforeFailed, `No phantom StockMovement was created (Count: ${movementsAfterFailed})`);

    const checkInvAfterFailed = await prisma.inventory.findUnique({ where: { id: targetInventoryId } });
    assert(checkInvAfterFailed.currentStock === 20, `Direct DB inventory unchanged at 20`);

    // A. INVENTORY LIST
    console.log('\n--- TEST GROUP A: INVENTORY LISTING & RELATIONS ---');
    const listRes = await request('/inventory');
    assert(listRes.status === 200, `GET /api/inventory returns 200`);
    assert(Array.isArray(listRes.body.data), `data is an array`);
    assert(listRes.body.pagination?.total >= 3, `Pagination total >= 3 (Got ${listRes.body.pagination?.total})`);
    
    const sample = listRes.body.data[0];
    assert(Boolean(sample.product), `Sample includes product relation`);
    assert(Boolean(sample.warehouse), `Sample includes warehouse relation`);
    assert(typeof sample.currentStock === 'number', `Sample has numeric currentStock`);
    assert(typeof sample.availableStock === 'number', `Sample has numeric availableStock`);
    assert(typeof sample.stockStatus === 'string', `Sample has calculated stockStatus`);

    // B. INVENTORY FILTERING
    console.log('\n--- TEST GROUP B: INVENTORY FILTERING, SEARCH & SORTING ---');
    
    // Filter by warehouseId
    const filterWh = await request(`/inventory?warehouseId=${testWarehouse1.id}`);
    assert(filterWh.status === 200, `Filter by warehouseId returns 200`);
    assert(filterWh.body.data.every(i => i.warehouseId === testWarehouse1.id), `All items belong to warehouse 1`);

    // Filter by productId
    const filterPr = await request(`/inventory?productId=${testProduct1.id}`);
    assert(filterPr.status === 200, `Filter by productId returns 200`);
    assert(filterPr.body.data.every(i => i.productId === testProduct1.id), `All items belong to product 1`);

    // Filter by stockStatus OUT_OF_STOCK
    const filterOos = await request('/inventory?stockStatus=OUT_OF_STOCK');
    assert(filterOos.status === 200, `Filter by OUT_OF_STOCK returns 200`);
    assert(filterOos.body.data.every(i => i.stockStatus === 'OUT_OF_STOCK'), `All returned items have stockStatus OUT_OF_STOCK`);

    // Filter by stockStatus LOW_STOCK
    const filterLow = await request('/inventory?stockStatus=LOW_STOCK');
    assert(filterLow.status === 200, `Filter by LOW_STOCK returns 200`);
    assert(filterLow.body.data.every(i => i.stockStatus === 'LOW_STOCK'), `All returned items have stockStatus LOW_STOCK`);

    // Filter by stockStatus IN_STOCK
    const filterIn = await request('/inventory?stockStatus=IN_STOCK');
    assert(filterIn.status === 200, `Filter by IN_STOCK returns 200`);
    assert(filterIn.body.data.every(i => i.stockStatus === 'IN_STOCK'), `All returned items have stockStatus IN_STOCK`);

    // Search by product name
    const searchPrName = testProduct1.name.slice(0, 5);
    const searchRes = await request(`/inventory?search=${encodeURIComponent(searchPrName)}`);
    assert(searchRes.status === 200, `Search by product name query returns 200`);
    assert(searchRes.body.data.length > 0, `Search returned matches for '${searchPrName}'`);

    // Sorting by currentStock asc and desc
    const sortAsc = await request('/inventory?sortBy=currentStock&sortOrder=asc');
    assert(sortAsc.status === 200, `Sort by currentStock asc returns 200`);
    const stocksAsc = sortAsc.body.data.map(i => i.currentStock);
    const isSortedAsc = stocksAsc.every((v, i, a) => !i || a[i - 1] <= v);
    assert(isSortedAsc, `Stocks properly ordered ascending: [${stocksAsc.join(', ')}]`);

    // Pagination
    const pageLimit = await request('/inventory?page=1&limit=2');
    assert(pageLimit.status === 200 && pageLimit.body.data.length <= 2, `Pagination limit=2 returned <= 2 items`);
    assert(pageLimit.body.pagination.limit === 2, `Pagination limit confirmed in response`);

    // C. INVENTORY DETAILS
    console.log('\n--- TEST GROUP C: INVENTORY DETAILS ---');
    const detailsRes = await request(`/inventory/${targetInventoryId}`);
    assert(detailsRes.status === 200, `GET /api/inventory/:id returns 200`);
    assert(detailsRes.body.data.id === targetInventoryId, `ID matches target`);
    assert(Boolean(detailsRes.body.data.product), `Product details present`);
    assert(Boolean(detailsRes.body.data.warehouse), `Warehouse details present`);

    const nonExistentInv = await request('/inventory/non-existent-id-999');
    assert(nonExistentInv.status === 404, `GET non-existent inventory ID returns 404 (Got ${nonExistentInv.status})`);

    // H. WAREHOUSE INVENTORY
    console.log('\n--- TEST GROUP H: WAREHOUSE INVENTORY ---');
    const whInvRes = await request(`/inventory/warehouse/${testWarehouse1.id}`);
    assert(whInvRes.status === 200, `GET /api/inventory/warehouse/:id returns 200`);
    assert(whInvRes.body.data.every(i => i.warehouseId === testWarehouse1.id), `All items match warehouseId`);

    const nonExistentWh = await request('/inventory/warehouse/wh-does-not-exist');
    assert(nonExistentWh.status === 404, `GET inventory for nonexistent warehouse returns 404`);

    // I. PRODUCT INVENTORY
    console.log('\n--- TEST GROUP I: PRODUCT INVENTORY ---');
    const prodInvRes = await request(`/inventory/product/${testProduct1.id}`);
    assert(prodInvRes.status === 200, `GET /api/inventory/product/:id returns 200`);
    assert(prodInvRes.body.data.every(i => i.productId === testProduct1.id), `All items match productId`);

    const nonExistentProd = await request('/inventory/product/prod-does-not-exist');
    assert(nonExistentProd.status === 404, `GET inventory for nonexistent product returns 404`);

    // J. STOCK MOVEMENTS API
    console.log('\n--- TEST GROUP J: STOCK MOVEMENTS API ---');
    const movementsRes = await request('/stock-movements');
    assert(movementsRes.status === 200, `GET /api/stock-movements returns 200`);
    assert(Array.isArray(movementsRes.body.data), `stock movements data is an array`);
    assert(movementsRes.body.data.length >= 4, `At least 4 movements logged (Got ${movementsRes.body.data.length})`);

    const sampleMovement = movementsRes.body.data[0];
    assert(Boolean(sampleMovement.id), `Movement has id`);
    assert(Boolean(sampleMovement.type), `Movement has type (${sampleMovement.type})`);
    assert(typeof sampleMovement.quantity === 'number', `Movement has numeric quantity (${sampleMovement.quantity})`);
    assert(Boolean(sampleMovement.product), `Movement has product relation`);
    assert(Boolean(sampleMovement.warehouse), `Movement has warehouse relation`);

    // Movement details by ID
    const movDetailRes = await request(`/stock-movements/${sampleMovement.id}`);
    assert(movDetailRes.status === 200, `GET /api/stock-movements/:id returns 200`);
    assert(movDetailRes.body.data.id === sampleMovement.id, `Movement ID matches`);

    const nonExistentMov = await request('/stock-movements/mov-does-not-exist');
    assert(nonExistentMov.status === 404, `GET nonexistent stock movement returns 404`);

    // Movement by warehouse
    const movWhRes = await request(`/stock-movements/warehouse/${testWarehouse1.id}`);
    assert(movWhRes.status === 200, `GET /api/stock-movements/warehouse/:id returns 200`);
    assert(movWhRes.body.data.every(m => m.warehouseId === testWarehouse1.id), `All movements belong to warehouse 1`);

    // Movement by product
    const movProdRes = await request(`/stock-movements/product/${testProduct1.id}`);
    assert(movProdRes.status === 200, `GET /api/stock-movements/product/:id returns 200`);
    assert(movProdRes.body.data.every(m => m.productId === testProduct1.id), `All movements belong to product 1`);

    // Movement filtering by movementType
    const movAdjRes = await request('/stock-movements?movementType=ADJUSTMENT');
    assert(movAdjRes.status === 200, `Filter movements by movementType=ADJUSTMENT returns 200`);
    assert(movAdjRes.body.data.every(m => m.type === 'ADJUSTMENT'), `All movements are ADJUSTMENT`);

    // DIRECT DATABASE PERSISTENCE CHECK VIA PRISMA
    console.log('\n--- DIRECT PRISMA / MYSQL PERSISTENCE VERIFICATION ---');
    const directInv = await prisma.inventory.findUnique({
      where: { id: targetInventoryId },
      include: { stockMovements: true },
    });
    assert(directInv !== null, `Direct DB query: Inventory record found in MySQL`);
    assert(directInv.currentStock === 20, `Direct DB query: currentStock is exactly 20`);
    assert(directInv.stockMovements.length >= 3, `Direct DB query: Stock movements recorded in MySQL (${directInv.stockMovements.length})`);

    // REGRESSION TESTS FOR PREVIOUS APIS
    console.log('\n--- TEST GROUP REGRESSION: EXISTING MODULES INTEGRITY ---');
    const regHealth = await request('/health');
    assert(regHealth.status === 200, `Regression: /api/health returns 200`);
    const regProd = await request('/products');
    assert(regProd.status === 200, `Regression: /api/products returns 200`);
    const regCat = await request('/categories');
    assert(regCat.status === 200, `Regression: /api/categories returns 200`);
    const regWh = await request('/warehouses');
    assert(regWh.status === 200, `Regression: /api/warehouses returns 200`);

  } catch (err) {
    console.error('Unexpected test suite error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log('\n====================================================');
    console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
