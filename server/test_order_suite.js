const prisma = require('./src/config/prisma');

const BASE_URL = 'http://localhost:5000/api';

async function runOrderTests() {
  console.log('====================================================');
  console.log('STARTING SALES ORDER & FULFILLMENT AUTOMATED TEST SUITE');
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
    // 0. BASELINES & TEST FIXTURES SETUP
    // ==========================================
    console.log('--- TEST GROUP 0: BASELINES & INVENTORY FIXTURES ---');

    const health = await request('/health');
    assert(health.status === 200 && health.body.database === 'connected', 'GET /api/health returns 200 & db connected');

    const productsRes = await request('/products');
    const warehousesRes = await request('/warehouses');

    assert(productsRes.status === 200 && productsRes.body.data.length >= 2, 'At least 2 products exist');
    assert(warehousesRes.status === 200 && warehousesRes.body.data.length >= 2, 'At least 2 warehouses exist');

    const productA = productsRes.body.data[0];
    const productB = productsRes.body.data[1];
    const warehouse1 = warehousesRes.body.data[0];
    const warehouse2 = warehousesRes.body.data[1];

    console.log(`Product A: ${productA.name} (${productA.id})`);
    console.log(`Product B: ${productB.name} (${productB.id})`);
    console.log(`Warehouse 1: ${warehouse1.name} (${warehouse1.id})`);
    console.log(`Warehouse 2: ${warehouse2.name} (${warehouse2.id})\n`);

    // Ensure Warehouse 1 has known physical inventory:
    // Set Product A currentStock = 50, reservedStock = 0
    await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: productA.id,
        warehouseId: warehouse1.id,
        type: 'SET',
        quantity: 50,
        reason: 'Order test baseline setup P1',
      }),
    });
    // Set Product B currentStock = 30, reservedStock = 0
    await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: productB.id,
        warehouseId: warehouse1.id,
        type: 'SET',
        quantity: 30,
        reason: 'Order test baseline setup P2',
      }),
    });

    // Reset reservedStock in DB for cleanliness
    await prisma.inventory.updateMany({
      where: { warehouseId: warehouse1.id },
      data: { reservedStock: 0 },
    });

    console.log('Stock fixtures configured: Product A = 50, Product B = 30 (available = 50, 30)\n');

    // ==========================================
    // 1. ORDER CRUD & VALIDATIONS
    // ==========================================
    console.log('--- TEST GROUP 1: ORDER CRUD & VALIDATIONS ---');

    // 1.1 List orders
    const listRes = await request('/orders');
    assert(listRes.status === 200, 'GET /api/orders returns 200');
    assert(Array.isArray(listRes.body.data), 'Orders is an array');
    assert(Boolean(listRes.body.pagination), 'Pagination metadata present in response');

    // 1.2 Creation validations
    console.log('Testing order creation validations:');
    const missingCustomer = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({ warehouseId: warehouse1.id, items: [{ productId: productA.id, quantity: 2 }] }),
    });
    assert(missingCustomer.status === 400, 'Missing customerName returns 400');

    const invalidEmail = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        customerEmail: 'not-valid-email',
        warehouseId: warehouse1.id,
        items: [{ productId: productA.id, quantity: 2 }],
      }),
    });
    assert(invalidEmail.status === 400, 'Invalid customerEmail returns 400');

    const missingWarehouse = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        items: [{ productId: productA.id, quantity: 2 }],
      }),
    });
    assert(missingWarehouse.status === 400, 'Missing warehouseId returns 400');

    const nonExistentWarehouse = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        warehouseId: 'non-existent-wh-id',
        items: [{ productId: productA.id, quantity: 2 }],
      }),
    });
    assert(nonExistentWarehouse.status === 404, 'Non-existent warehouseId returns 404');

    const emptyItems = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        warehouseId: warehouse1.id,
        items: [],
      }),
    });
    assert(emptyItems.status === 400, 'Empty items array returns 400');

    const nonExistentProduct = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        warehouseId: warehouse1.id,
        items: [{ productId: 'non-existent-prod-id', quantity: 2 }],
      }),
    });
    assert(nonExistentProduct.status === 404, 'Non-existent productId returns 404');

    const negativeQty = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        warehouseId: warehouse1.id,
        items: [{ productId: productA.id, quantity: -3 }],
      }),
    });
    assert(negativeQty.status === 400, 'Negative item quantity returns 400');

    const invalidPaymentStatus = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        warehouseId: warehouse1.id,
        paymentStatus: 'BITCOIN_UNSUPPORTED',
        items: [{ productId: productA.id, quantity: 1 }],
      }),
    });
    assert(invalidPaymentStatus.status === 400, 'Invalid paymentStatus returns 400');

    // 1.3 Create Order with status PENDING (Unreserved)
    console.log('Creating valid customer order with status PENDING:');
    const customOrderNum1 = `ORD-TEST-${Date.now().toString().slice(-6)}`;
    const createPendingRes = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: customOrderNum1,
        customerName: 'Rohan Mehra',
        customerEmail: 'rohan.mehra@example.com',
        customerPhone: '+91-9988776655',
        shippingAddress: {
          address: '42 MG Road, Indiranagar',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
        },
        warehouseId: warehouse1.id,
        status: 'PENDING',
        paymentStatus: 'PAID',
        items: [
          { productId: productA.id, quantity: 5, unitPrice: 35000 },
          { productId: productB.id, quantity: 2, unitPrice: 25000 },
        ],
      }),
    });

    assert(createPendingRes.status === 201, `POST /api/orders (PENDING) returns 201 (Got ${createPendingRes.status})`);
    const pendingOrder = createPendingRes.body.data;
    assert(pendingOrder.orderNumber === customOrderNum1, 'Order number matches');
    assert(pendingOrder.status === 'PENDING', 'Initial status is PENDING');
    assert(pendingOrder.subtotal === 225000, `Calculated subtotal matches: ${pendingOrder.subtotal}`);
    assert(pendingOrder.itemCount === 2, 'Item count matches (2 items)');
    assert(pendingOrder.shippingAddress?.city === 'Bangalore', 'Shipping address object normalized properly');

    // Verify stock was NOT reserved merely because order was created as PENDING
    const invA_afterPending = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(invA_afterPending.reservedStock === 0, 'PENDING order does NOT reserve stock (reservedStock is 0)');
    assert(invA_afterPending.currentStock === 50, 'currentStock remains 50');

    // 1.4 Get Order Details by ID
    const getOrderRes = await request(`/orders/${pendingOrder.id}`);
    assert(getOrderRes.status === 200, 'GET /api/orders/:id returns 200');
    assert(getOrderRes.body.data?.id === pendingOrder.id, 'Fetched order ID matches');
    assert(getOrderRes.body.data?.warehouseName === warehouse1.name, 'Enriched warehouseName present');
    assert(getOrderRes.body.data?.items?.length === 2, 'Items array populated with product details');

    // 1.5 Non-existent order returns 404
    const nonOrderRes = await request('/orders/non-existent-order-id-999');
    assert(nonOrderRes.status === 404, 'GET /api/orders/non-existent returns 404');

    // 1.6 Duplicate orderNumber returns 409
    const dupOrderRes = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: customOrderNum1,
        customerName: 'Duplicate Test Candidate',
        warehouseId: warehouse1.id,
        items: [{ productId: productA.id, quantity: 1 }],
      }),
    });
    assert(dupOrderRes.status === 409, 'Duplicate orderNumber returns 409');

    // ==========================================
    // 2. STOCK AVAILABILITY & RESERVATION
    // ==========================================
    console.log('\n--- TEST GROUP 2: STOCK AVAILABILITY & RESERVATION ---');

    // 2.1 Reserve stock on PENDING order via POST /api/orders/:id/reserve
    console.log(`Reserving stock for order ${pendingOrder.id}...`);
    const reserveRes = await request(`/orders/${pendingOrder.id}/reserve`, {
      method: 'POST',
    });
    assert(reserveRes.status === 200, `POST /api/orders/:id/reserve returns 200 (Got ${reserveRes.status})`);
    assert(reserveRes.body.data?.status === 'CONFIRMED', 'Order status transitioned to CONFIRMED');

    // Verify inventory reservedStock incremented atomically
    const invA_afterReserve = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    const invB_afterReserve = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productB.id, warehouseId: warehouse1.id } },
    });

    assert(invA_afterReserve.reservedStock === 5, `Product A reservedStock = 5 (Got ${invA_afterReserve.reservedStock})`);
    assert(invA_afterReserve.currentStock === 50, 'Product A currentStock unchanged at 50');
    assert(invB_afterReserve.reservedStock === 2, `Product B reservedStock = 2 (Got ${invB_afterReserve.reservedStock})`);
    assert(invB_afterReserve.currentStock === 30, 'Product B currentStock unchanged at 30');

    // 2.2 Duplicate reservation rejected
    console.log('Testing duplicate reservation rejection:');
    const dupReserve = await request(`/orders/${pendingOrder.id}/reserve`, { method: 'POST' });
    assert(dupReserve.status === 400, `Duplicate reservation returns 400 (Got ${dupReserve.status})`);

    // 2.3 Insufficient stock rejection
    console.log('Testing reservation rejection on insufficient available stock:');
    // Available stock for A is now 50 - 5 = 45. Try to order 100 units.
    const excessOrderRes = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Heavy Buyer',
        warehouseId: warehouse1.id,
        status: 'PENDING',
        items: [{ productId: productA.id, quantity: 100 }], // requires 100, available 45
      }),
    });
    assert(excessOrderRes.status === 201, 'Order created as PENDING');
    const excessOrder = excessOrderRes.body.data;

    const excessReserveRes = await request(`/orders/${excessOrder.id}/reserve`, { method: 'POST' });
    assert(excessReserveRes.status === 400, `Excess reservation rejected with 400 (Got ${excessReserveRes.status})`);

    // Verify inventory was NOT partially reserved
    const invA_afterFailedReserve = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(invA_afterFailedReserve.reservedStock === 5, 'Product A reservedStock remained exactly 5 after rejected reservation');

    // 2.4 Creating order with status: 'CONFIRMED' directly (as done by frontend CreateOrderPage)
    console.log('Testing direct CONFIRMED order creation with auto-reservation:');
    const directConfirmRes = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Direct Confirmed Buyer',
        warehouseId: warehouse1.id,
        status: 'CONFIRMED',
        items: [{ productId: productA.id, quantity: 10 }],
      }),
    });
    assert(directConfirmRes.status === 201, 'Direct CONFIRMED order created');
    assert(directConfirmRes.body.data?.status === 'CONFIRMED', 'Status is CONFIRMED');

    const invA_afterDirect = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(invA_afterDirect.reservedStock === 15, `Product A reservedStock incremented 5 + 10 = 15 (Got ${invA_afterDirect.reservedStock})`);

    // ==========================================
    // 3. ATOMIC ROLLBACK SAFETY TEST (PART T)
    // ==========================================
    console.log('\n--- TEST GROUP 3: MULTI-ITEM ATOMIC ROLLBACK SAFETY ---');
    console.log('Attempting multi-item reservation where Item 1 has stock (10 units), but Item 2 exceeds stock (999 units):');

    const multiItemOrderRes = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Rollback Test Candidate',
        warehouseId: warehouse1.id,
        status: 'PENDING',
        items: [
          { productId: productA.id, quantity: 10 },
          { productId: productB.id, quantity: 999 }, // IMPOSSIBLE: available is 28
        ],
      }),
    });
    const multiOrder = multiItemOrderRes.body.data;

    const rollbackReserveRes = await request(`/orders/${multiOrder.id}/reserve`, { method: 'POST' });
    assert(rollbackReserveRes.status === 400, 'Multi-item reservation with 1 invalid item returned 400');

    // Verify atomic rollback on Product A: reservedStock must NOT have increased!
    const invA_postRollback = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(
      invA_postRollback.reservedStock === 15,
      `Rollback Verified: Product A reservedStock was NOT modified (Remains ${invA_postRollback.reservedStock})`
    );

    const postRollbackOrder = await prisma.order.findUnique({ where: { id: multiOrder.id } });
    assert(postRollbackOrder.status === 'PENDING', 'Rollback Verified: Order status remains PENDING');

    // ==========================================
    // 4. RESERVATION CANCELLATION & RELEASE
    // ==========================================
    console.log('\n--- TEST GROUP 4: CANCELLATION & RESERVATION RELEASE ---');

    console.log(`Cancelling direct confirmed order (${directConfirmRes.body.data.id})...`);
    const cancelRes = await request(`/orders/${directConfirmRes.body.data.id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Customer changed delivery address' }),
    });

    assert(cancelRes.status === 200, `POST /api/orders/:id/cancel returns 200 (Got ${cancelRes.status})`);
    assert(cancelRes.body.data?.status === 'CANCELLED', 'Order status is CANCELLED');
    assert(cancelRes.body.data?.cancellationReason === 'Customer changed delivery address', 'Cancellation reason saved');

    // Verify reservedStock was released: 15 - 10 = 5
    const invA_afterCancel = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(
      invA_afterCancel.reservedStock === 5,
      `Reserved stock released back: 15 - 10 = 5 (Got ${invA_afterCancel.reservedStock})`
    );
    assert(invA_afterCancel.currentStock === 50, 'currentStock remains unchanged at 50');

    // ==========================================
    // 5. FULFILLMENT WORKFLOW & KANBAN TRANSITIONS
    // ==========================================
    console.log('\n--- TEST GROUP 5: FULFILLMENT WORKFLOW (KANBAN PIPELINE) ---');

    // We will advance our primary confirmed order: pendingOrder (5 of A, 2 of B)
    console.log(`Advancing order ${pendingOrder.id}: CONFIRMED -> PROCESSING`);
    const procRes = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PROCESSING' }),
    });
    assert(procRes.status === 200, 'PATCH /orders/:id/status (PROCESSING) returns 200');
    assert(procRes.body.data?.status === 'PROCESSING', 'Status is PROCESSING');

    console.log(`Advancing order ${pendingOrder.id}: PROCESSING -> PICKING`);
    const pickRes = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PICKING' }),
    });
    assert(pickRes.status === 200, 'PATCH /orders/:id/status (PICKING) returns 200');
    assert(pickRes.body.data?.status === 'PICKING', 'Status is PICKING');

    console.log(`Advancing order ${pendingOrder.id}: PICKING -> PACKED`);
    const packRes = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PACKED' }),
    });
    assert(packRes.status === 200, 'PATCH /orders/:id/status (PACKED) returns 200');
    assert(packRes.body.data?.status === 'PACKED', 'Status is PACKED');

    // Verify stock is still reserved through picking & packing
    const invA_duringFulfill = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(invA_duringFulfill.reservedStock === 5, 'Reserved stock intact at 5 during PACKED');
    assert(invA_duringFulfill.currentStock === 50, 'Physical currentStock intact at 50 during PACKED');

    // Test invalid backward transition (e.g. PACKED -> PENDING)
    const invalidBackward = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert(invalidBackward.status === 400, 'Invalid backward transition PACKED -> PENDING returns 400');

    // ==========================================
    // 6. SHIPPING (PHYSICAL INVENTORY CONSUMPTION & SALE MOVEMENTS)
    // ==========================================
    console.log('\n--- TEST GROUP 6: SHIPPING (INVENTORY CONSUMPTION & SALE MOVEMENTS) ---');

    console.log(`Shipping order ${pendingOrder.id} (Deducting 5 of A, 2 of B)...`);
    const shipRes = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'SHIPPED',
        performedBy: 'Head of Dispatch',
        notes: 'Out for BlueDart express delivery',
      }),
    });

    assert(shipRes.status === 200, `PATCH /orders/:id/status (SHIPPED) returns 200 (Got ${shipRes.status})`);
    assert(shipRes.body.data?.status === 'SHIPPED', 'Order status is SHIPPED');

    // Verify Inventory:
    // Product A: currentStock: 50 - 5 = 45, reservedStock: 5 - 5 = 0
    const invA_afterShip = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(invA_afterShip.currentStock === 45, `Product A currentStock deducted to 45 (Got ${invA_afterShip.currentStock})`);
    assert(invA_afterShip.reservedStock === 0, `Product A reservedStock cleared to 0 (Got ${invA_afterShip.reservedStock})`);

    // Product B: currentStock: 30 - 2 = 28, reservedStock: 2 - 2 = 0
    const invB_afterShip = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productB.id, warehouseId: warehouse1.id } },
    });
    assert(invB_afterShip.currentStock === 28, `Product B currentStock deducted to 28 (Got ${invB_afterShip.currentStock})`);
    assert(invB_afterShip.reservedStock === 0, `Product B reservedStock cleared to 0 (Got ${invB_afterShip.reservedStock})`);

    // Verify StockMovement SALE records created
    const saleMovements = await prisma.stockMovement.findMany({
      where: {
        reference: pendingOrder.orderNumber,
        type: 'SALE',
      },
    });
    assert(saleMovements.length === 2, `Exactly 2 SALE movements logged (Got ${saleMovements.length})`);
    const movA = saleMovements.find((m) => m.productId === productA.id);
    const movB = saleMovements.find((m) => m.productId === productB.id);

    assert(movA?.quantity === 5, `Movement A quantity is 5 (magnitude of sold items)`);
    assert(movA?.warehouseId === warehouse1.id, 'Movement A warehouse matches order warehouse');
    assert(movB?.quantity === 2, `Movement B quantity is 2 (magnitude of sold items)`);
    assert(movA?.performedBy === 'Head of Dispatch', 'Movement performedBy matches');

    // 6.2 Cannot ship twice
    console.log('Testing duplicate shipping rejection:');
    const doubleShip = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    // SHIPPED -> SHIPPED returns same or 400
    assert(doubleShip.status === 200 || doubleShip.status === 400, 'Duplicate ship handled gracefully');

    // 6.3 Cannot cancel shipped order
    console.log('Testing cancellation rejection on shipped order:');
    const cancelShipped = await request(`/orders/${pendingOrder.id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Want refund' }),
    });
    assert(cancelShipped.status === 400, `Cannot cancel shipped order returns 400 (Got ${cancelShipped.status})`);

    // ==========================================
    // 7. DELIVERY (FINAL TERMINAL MILESTONE)
    // ==========================================
    console.log('\n--- TEST GROUP 7: DELIVERY (FINAL STATE) ---');

    console.log(`Delivering order ${pendingOrder.id}: SHIPPED -> DELIVERED`);
    const deliverRes = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'DELIVERED' }),
    });

    assert(deliverRes.status === 200, `PATCH /orders/:id/status (DELIVERED) returns 200`);
    assert(deliverRes.body.data?.status === 'DELIVERED', 'Order status is DELIVERED');

    // Verify NO additional inventory deduction occurred
    const invA_afterDelivery = await prisma.inventory.findUnique({
      where: { unique_product_warehouse_inventory: { productId: productA.id, warehouseId: warehouse1.id } },
    });
    assert(invA_afterDelivery.currentStock === 45, 'No extra inventory deduction on DELIVERED (currentStock remains 45)');

    // Verify NO duplicate SALE movements created
    const postDeliverySalesCount = await prisma.stockMovement.count({
      where: { reference: pendingOrder.orderNumber, type: 'SALE' },
    });
    assert(postDeliverySalesCount === 2, 'No duplicate SALE movements created on DELIVERED (still exactly 2)');

    // 7.2 Terminal state checks
    const deliverToCancel = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    assert(deliverToCancel.status === 400, 'DELIVERED -> CANCELLED returns 400');

    const deliverToPending = await request(`/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert(deliverToPending.status === 400, 'DELIVERED -> PENDING returns 400');

    // ==========================================
    // 8. SEARCH & FILTERING APIs
    // ==========================================
    console.log('\n--- TEST GROUP 8: SEARCH & FILTERING APIS ---');

    // Search by orderNumber
    const searchRes = await request(`/orders?search=${customOrderNum1.slice(-4)}`);
    assert(searchRes.status === 200, 'Search orders returns 200');
    assert(searchRes.body.data.some((o) => o.id === pendingOrder.id), 'Search returned matching order');

    // Filter by status DELIVERED
    const filterDelivered = await request('/orders?status=DELIVERED');
    assert(filterDelivered.status === 200, 'Filter by status DELIVERED returns 200');
    assert(filterDelivered.body.data.every((o) => o.status === 'DELIVERED'), 'All returned orders have status DELIVERED');

    // Filter by warehouseId
    const filterWarehouse = await request(`/orders?warehouseId=${warehouse1.id}`);
    assert(filterWarehouse.status === 200, 'Filter by warehouseId returns 200');
    assert(filterWarehouse.body.data.every((o) => o.warehouseId === warehouse1.id), 'All orders match warehouse');

    // Filter by paymentStatus PAID
    const filterPayment = await request('/orders?paymentStatus=PAID');
    assert(filterPayment.status === 200, 'Filter by paymentStatus PAID returns 200');
    assert(filterPayment.body.data.every((o) => o.paymentStatus === 'PAID'), 'All orders have paymentStatus PAID');

    // ==========================================
    // 9. REGRESSION CHECKS OF ALL PREVIOUS MODULES
    // ==========================================
    console.log('\n--- TEST GROUP 9: REGRESSION TESTING (ALL MODULES) ---');

    const regHealth = await request('/health');
    assert(regHealth.status === 200 && regHealth.body.database === 'connected', 'Regression: Health check 200');

    const regProducts = await request('/products');
    assert(regProducts.status === 200, 'Regression: Products API 200');

    const regWarehouses = await request('/warehouses');
    assert(regWarehouses.status === 200, 'Regression: Warehouses API 200');

    const regInventory = await request('/inventory');
    assert(regInventory.status === 200, 'Regression: Inventory API 200');

    const regMovements = await request('/stock-movements');
    assert(regMovements.status === 200, 'Regression: Stock movements API 200');

    const regSuppliers = await request('/suppliers');
    assert(regSuppliers.status === 200, 'Regression: Suppliers API 200');

    const regPO = await request('/purchase-orders');
    assert(regPO.status === 200, 'Regression: Purchase Orders API 200');

    console.log('\n====================================================');
    console.log(`ORDER SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unexpected test suite error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOrderTests();
