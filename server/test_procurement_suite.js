const prisma = require('./src/config/prisma');

const BASE_URL = 'http://localhost:5000/api';

async function runProcurementTests() {
  console.log('====================================================');
  console.log('STARTING PROCUREMENT & RECEIVING AUTOMATED TEST SUITE');
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
    // 0. HEALTH CHECK & BASELINES
    // ==========================================
    console.log('--- TEST GROUP 0: BASELINE HEALTH & REGRESSION ---');
    const health = await request('/health');
    assert(health.status === 200 && health.body.database === 'connected', 'GET /api/health returns 200 & db connected');

    const productsRes = await request('/products');
    assert(productsRes.status === 200 && Array.isArray(productsRes.body.data), 'GET /api/products returns 200');
    const products = productsRes.body.data;
    assert(products.length >= 2, `At least 2 products exist (found ${products.length})`);

    const warehousesRes = await request('/warehouses');
    assert(warehousesRes.status === 200 && Array.isArray(warehousesRes.body.data), 'GET /api/warehouses returns 200');
    const warehouses = warehousesRes.body.data;
    assert(warehouses.length >= 2, `At least 2 warehouses exist (found ${warehouses.length})`);

    const product1 = products[0];
    const product2 = products[1];
    const warehouse1 = warehouses[0];
    const warehouse2 = warehouses[1];

    console.log(`Test Product 1: ${product1.name} (${product1.id})`);
    console.log(`Test Product 2: ${product2.name} (${product2.id})`);
    console.log(`Test Warehouse 1: ${warehouse1.name} (${warehouse1.id})`);
    console.log(`Test Warehouse 2: ${warehouse2.name} (${warehouse2.id})\n`);

    // ==========================================
    // 1. PART A — SUPPLIER MANAGEMENT
    // ==========================================
    console.log('--- TEST GROUP 1: SUPPLIER MANAGEMENT ---');

    // 1.1 List suppliers
    const listSup1 = await request('/suppliers');
    assert(listSup1.status === 200, 'GET /api/suppliers returns 200');
    assert(Array.isArray(listSup1.body.data), 'Supplier data is an array');
    assert(Boolean(listSup1.body.pagination), 'Pagination metadata present in supplier response');

    // 1.2 Validation on create
    console.log('Testing supplier creation validations:');
    const supMissingName = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@vendor.com' }),
    });
    assert(supMissingName.status === 400, 'POST /api/suppliers without name returns 400');

    const supInvalidEmail = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Invalid Email Vendor', email: 'not-an-email' }),
    });
    assert(supInvalidEmail.status === 400, 'POST /api/suppliers with invalid email returns 400');

    const supInvalidStatus = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Invalid Status Vendor', status: 'UNKNOWN_STATUS' }),
    });
    assert(supInvalidStatus.status === 400, 'POST /api/suppliers with invalid status returns 400');

    // 1.3 Create supplier with custom code
    const uniqueCode = `SUP-TEST-${Date.now().toString().slice(-5)}`;
    console.log(`Creating test supplier with code: ${uniqueCode}`);
    const createSupRes1 = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Apex Precision Logistics & Supplies',
        supplierCode: uniqueCode,
        companyName: 'Apex Precision Ltd',
        category: 'Electronics',
        contactPerson: 'Vikramaditya Roy',
        email: 'vikram@apexprecision.com',
        phone: '+91-9876543210',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        gstNumber: '27AABCA1234A1Z5',
        paymentTerms: 'Net 30',
        status: 'ACTIVE',
      }),
    });
    assert(createSupRes1.status === 201, `POST /api/suppliers returns 201 (Got ${createSupRes1.status})`);
    assert(createSupRes1.body.data?.name === 'Apex Precision Logistics & Supplies', 'Created supplier name matches');
    assert(createSupRes1.body.data?.supplierCode === uniqueCode, 'Created supplierCode matches');
    const createdSupplierId1 = createSupRes1.body.data?.id;
    assert(Boolean(createdSupplierId1), `Supplier ID returned: ${createdSupplierId1}`);

    // 1.4 Duplicate supplier code rejection
    console.log('Testing duplicate supplier code rejection:');
    const createDupSup = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Vendor Candidate',
        supplierCode: uniqueCode,
      }),
    });
    assert(createDupSup.status === 409, `Duplicate supplierCode returns 409 (Got ${createDupSup.status})`);

    // 1.5 Create supplier with auto-generated code
    const createSupAuto = await request('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Delta Auto-Coded Electronics',
        city: 'Delhi',
      }),
    });
    assert(createSupAuto.status === 201, 'POST /api/suppliers auto-generates supplierCode with 201');
    assert(Boolean(createSupAuto.body.data?.supplierCode), `Generated code: ${createSupAuto.body.data?.supplierCode}`);

    // 1.6 Get supplier by ID
    const getSupRes = await request(`/suppliers/${createdSupplierId1}`);
    assert(getSupRes.status === 200, `GET /api/suppliers/:id returns 200`);
    assert(getSupRes.body.data?.id === createdSupplierId1, 'Fetched supplier ID matches');
    assert(getSupRes.body.data?.contactPerson === 'Vikramaditya Roy', 'Supplier contact person matches');

    // 1.7 Non-existent supplier returns 404
    const getNonExistentSup = await request('/suppliers/non-existent-sup-id-999');
    assert(getNonExistentSup.status === 404, 'GET /api/suppliers/non-existent returns 404');

    // 1.8 Update supplier
    console.log('Updating supplier details:');
    const updateSupRes = await request(`/suppliers/${createdSupplierId1}`, {
      method: 'PUT',
      body: JSON.stringify({
        contactPerson: 'Vikramaditya Roy (Updated)',
        paymentTerms: 'Net 45',
      }),
    });
    assert(updateSupRes.status === 200, `PUT /api/suppliers/:id returns 200`);
    assert(updateSupRes.body.data?.contactPerson === 'Vikramaditya Roy (Updated)', 'Updated contact person saved');
    assert(updateSupRes.body.data?.paymentTerms === 'Net 45', 'Updated paymentTerms saved');

    // 1.9 Change supplier status
    console.log('Updating supplier status:');
    const patchStatusRes = await request(`/suppliers/${createdSupplierId1}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    assert(patchStatusRes.status === 200, 'PATCH /api/suppliers/:id/status returns 200');
    assert(patchStatusRes.body.data?.status === 'INACTIVE', 'Supplier status changed to INACTIVE');

    // Reactivate for further tests
    await request(`/suppliers/${createdSupplierId1}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    // 1.10 Search & Filter suppliers
    const searchSup = await request('/suppliers?search=Apex');
    assert(searchSup.status === 200, 'GET /api/suppliers?search=Apex returns 200');
    assert(searchSup.body.data.some((s) => s.id === createdSupplierId1), 'Search returned created supplier');

    const filterStatusSup = await request('/suppliers?status=ACTIVE');
    assert(filterStatusSup.status === 200, 'GET /api/suppliers?status=ACTIVE returns 200');
    assert(filterStatusSup.body.data.every((s) => s.status === 'ACTIVE'), 'All returned suppliers are ACTIVE');

    // ==========================================
    // 2. PART B — SUPPLIER PRODUCTS
    // ==========================================
    console.log('\n--- TEST GROUP 2: SUPPLIER ↔ PRODUCT ASSOCIATIONS ---');

    // 2.1 Associate Product 1 to Supplier 1
    console.log(`Associating Product ${product1.id} to Supplier ${createdSupplierId1}`);
    const addSupProdRes = await request(`/suppliers/${createdSupplierId1}/products`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product1.id,
        supplierSku: 'APEX-SKU-P1-900',
        costPrice: 24500.5,
        leadTimeDays: 5,
        isPrimary: true,
      }),
    });
    assert(addSupProdRes.status === 201, `POST /api/suppliers/:id/products returns 201 (Got ${addSupProdRes.status})`);
    assert(addSupProdRes.body.data?.productId === product1.id, 'Associated product ID matches');
    assert(addSupProdRes.body.data?.costPrice === 24500.5, 'Supplier product cost price matches');
    assert(addSupProdRes.body.data?.isPrimary === true, 'Supplier product isPrimary matches');

    // 2.2 Reject duplicate association
    console.log('Testing duplicate supplier product relationship:');
    const dupSupProd = await request(`/suppliers/${createdSupplierId1}/products`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product1.id,
      }),
    });
    assert(dupSupProd.status === 409, `Duplicate supplier product returns 409 (Got ${dupSupProd.status})`);

    // 2.3 Non-existent product / supplier handling
    const nonProdRes = await request(`/suppliers/${createdSupplierId1}/products`, {
      method: 'POST',
      body: JSON.stringify({ productId: 'non-existent-prod-id' }),
    });
    assert(nonProdRes.status === 404, 'Associate non-existent product returns 404');

    const nonSupRes = await request('/suppliers/non-existent-sup/products', {
      method: 'POST',
      body: JSON.stringify({ productId: product1.id }),
    });
    assert(nonSupRes.status === 404, 'Associate on non-existent supplier returns 404');

    // 2.4 Retrieve supplier products
    const getSupProdsRes = await request(`/suppliers/${createdSupplierId1}/products`);
    assert(getSupProdsRes.status === 200, 'GET /api/suppliers/:id/products returns 200');
    assert(Array.isArray(getSupProdsRes.body.data), 'Supplier products is an array');
    assert(getSupProdsRes.body.data.length >= 1, 'Contains at least 1 associated product');
    assert(getSupProdsRes.body.data[0].product?.name === product1.name, 'Included product details populated');

    // 2.5 Associate Product 2 as well
    await request(`/suppliers/${createdSupplierId1}/products`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product2.id,
        supplierSku: 'APEX-SKU-P2-800',
        costPrice: 19500.0,
        leadTimeDays: 7,
      }),
    });

    // 2.6 Delete association test
    console.log('Testing remove supplier-product association:');
    const delSupProdRes = await request(`/suppliers/${createdSupplierId1}/products/${product2.id}`, {
      method: 'DELETE',
    });
    assert(delSupProdRes.status === 200, 'DELETE /api/suppliers/:id/products/:productId returns 200');

    // Re-associate Product 2 for purchase orders
    await request(`/suppliers/${createdSupplierId1}/products`, {
      method: 'POST',
      body: JSON.stringify({
        productId: product2.id,
        supplierSku: 'APEX-SKU-P2-800',
        costPrice: 19500.0,
      }),
    });

    // ==========================================
    // 3. PART C & D — PURCHASE ORDER MANAGEMENT & APPROVAL
    // ==========================================
    console.log('\n--- TEST GROUP 3: PURCHASE ORDER CREATION & WORKFLOW ---');

    // 3.1 List purchase orders
    const listPORes = await request('/purchase-orders');
    assert(listPORes.status === 200, 'GET /api/purchase-orders returns 200');
    assert(Array.isArray(listPORes.body.data), 'Purchase orders is an array');
    assert(Boolean(listPORes.body.pagination), 'Pagination metadata present');

    // 3.2 Create PO validation errors
    console.log('Testing purchase order creation validations:');
    const poMissingSupplier = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ warehouseId: warehouse1.id, items: [{ productId: product1.id, quantity: 10 }] }),
    });
    assert(poMissingSupplier.status === 400, 'Missing supplierId returns 400');

    const poNonExistentSup = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: 'non-existent-sup-id',
        warehouseId: warehouse1.id,
        items: [{ productId: product1.id, quantity: 10 }],
      }),
    });
    assert(poNonExistentSup.status === 404, 'Non-existent supplierId returns 404');

    const poMissingWarehouse = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ supplierId: createdSupplierId1, items: [{ productId: product1.id, quantity: 10 }] }),
    });
    assert(poMissingWarehouse.status === 400, 'Missing warehouseId returns 400');

    const poEmptyItems = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ supplierId: createdSupplierId1, warehouseId: warehouse1.id, items: [] }),
    });
    assert(poEmptyItems.status === 400, 'Empty items array returns 400');

    const poInvalidQty = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: createdSupplierId1,
        warehouseId: warehouse1.id,
        items: [{ productId: product1.id, quantity: -5 }],
      }),
    });
    assert(poInvalidQty.status === 400, 'Negative quantity item returns 400');

    // 3.3 Create valid Purchase Order with 2 line items
    console.log('Creating valid purchase order with 2 line items:');
    const customPONumber = `PO-TEST-${Date.now().toString().slice(-6)}`;
    const createPORes = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        poNumber: customPONumber,
        supplierId: createdSupplierId1,
        warehouseId: warehouse1.id,
        status: 'PENDING',
        expectedDate: '2026-10-15',
        notes: 'Priority procurement for Q4 stock replenishment',
        createdBy: 'Senior Procurement Officer',
        items: [
          {
            productId: product1.id,
            quantity: 20,
            unitPrice: 20000,
            tax: 72000, // 20 * 20000 = 400000, tax 72000 -> line total 472000
          },
          {
            productId: product2.id,
            quantity: 10,
            unitPrice: 15000,
            tax: 27000, // 10 * 15000 = 150000, tax 27000 -> line total 177000
          },
        ],
      }),
    });

    assert(createPORes.status === 201, `POST /api/purchase-orders returns 201 (Got ${createPORes.status})`);
    assert(createPORes.body.data?.poNumber === customPONumber, 'PO number matches');
    assert(createPORes.body.data?.status === 'PENDING', 'PO initial status is PENDING');
    assert(createPORes.body.data?.items?.length === 2, 'PO has 2 items');
    assert(createPORes.body.data?.total === 649000, `Calculated total matches: ${createPORes.body.data?.total}`);

    const createdPOId = createPORes.body.data?.id;
    const poItem1 = createPORes.body.data?.items?.find((i) => i.productId === product1.id);
    const poItem2 = createPORes.body.data?.items?.find((i) => i.productId === product2.id);

    assert(Boolean(poItem1), `Line item 1 created with ID: ${poItem1?.id}`);
    assert(Boolean(poItem2), `Line item 2 created with ID: ${poItem2?.id}`);

    // 3.4 Duplicate PO number rejection
    const dupPORes = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        poNumber: customPONumber,
        supplierId: createdSupplierId1,
        warehouseId: warehouse1.id,
        items: [{ productId: product1.id, quantity: 5 }],
      }),
    });
    assert(dupPORes.status === 409, 'Duplicate poNumber returns 409');

    // 3.5 Get PO details by ID
    const getPODetails = await request(`/purchase-orders/${createdPOId}`);
    assert(getPODetails.status === 200, 'GET /api/purchase-orders/:id returns 200');
    assert(getPODetails.body.data?.supplierName === 'Apex Precision Logistics & Supplies', 'Enriched supplier name present');
    assert(getPODetails.body.data?.warehouseName === warehouse1.name, 'Enriched warehouse name present');
    assert(getPODetails.body.data?.itemCount === 2, 'itemCount matches');

    // 3.6 Update PO
    const updatePORes = await request(`/purchase-orders/${createdPOId}`, {
      method: 'PUT',
      body: JSON.stringify({
        notes: 'Priority procurement for Q4 stock replenishment (Updated instructions)',
      }),
    });
    assert(updatePORes.status === 200, 'PUT /api/purchase-orders/:id returns 200');
    assert(
      updatePORes.body.data?.notes?.includes('(Updated instructions)'),
      'Updated PO notes saved'
    );

    // 3.7 Cannot receive on PENDING order
    console.log('Testing receiving goods rejection on unapproved PO:');
    const prematureReceive = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ purchaseOrderItemId: poItem1.id, quantity: 5 }],
      }),
    });
    assert(
      prematureReceive.status === 400,
      `Receive on unapproved PENDING order returns 400 (Got ${prematureReceive.status})`
    );

    // 3.8 Approval Workflow: Approve Purchase Order
    console.log('Approving purchase order:');
    const approveRes = await request(`/purchase-orders/${createdPOId}/approve`, {
      method: 'PATCH',
    });
    assert(approveRes.status === 200, `PATCH /api/purchase-orders/:id/approve returns 200`);
    assert(approveRes.body.data?.status === 'APPROVED', 'PO status transitioned to APPROVED');

    // 3.9 Double approval rejection
    const doubleApprove = await request(`/purchase-orders/${createdPOId}/approve`, {
      method: 'PATCH',
    });
    assert(doubleApprove.status === 400, 'Approving already approved PO returns 400');

    // 3.10 Invalid status transition check
    const invalidTransition = await request(`/purchase-orders/${createdPOId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert(invalidTransition.status === 400, 'Invalid transition APPROVED -> PENDING returns 400');

    // ==========================================
    // 4. PART E, F, G, H, I — RECEIVING GOODS & INVENTORY/STOCK MOVEMENT INTEGRATION
    // ==========================================
    console.log('\n--- TEST GROUP 4: GOODS RECEIVING & ATOMIC INVENTORY INTEGRATION ---');

    // Record pre-receive inventory levels
    const preInv1 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product1.id,
          warehouseId: warehouse1.id,
        },
      },
    });
    const preStockProduct1 = preInv1 ? preInv1.currentStock : 0;
    const preReservedProduct1 = preInv1 ? preInv1.reservedStock : 0;

    const preInv2 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product2.id,
          warehouseId: warehouse1.id,
        },
      },
    });
    const preStockProduct2 = preInv2 ? preInv2.currentStock : 0;
    const preReservedProduct2 = preInv2 ? preInv2.reservedStock : 0;

    console.log(`Pre-receive stock P1: ${preStockProduct1}, P2: ${preStockProduct2}`);

    // 4.1 Validation: Over-receiving rejected
    console.log('Testing over-receiving rejection:');
    const overReceive = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ purchaseOrderItemId: poItem1.id, quantity: 25 }], // ordered 20
      }),
    });
    assert(overReceive.status === 400, `Over-receiving returns 400 (Got ${overReceive.status})`);

    // 4.2 Validation: Item belonging to another PO
    const foreignItemReceive = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ purchaseOrderItemId: 'non-existent-item-id', quantity: 5 }],
      }),
    });
    assert(foreignItemReceive.status === 400, 'Receiving foreign item returns 400');

    // 4.3 Validation: Zero or negative quantity
    const zeroReceive = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ purchaseOrderItemId: poItem1.id, quantity: -2 }],
      }),
    });
    assert(zeroReceive.status === 400, 'Negative quantity receipt returns 400');

    // 4.4 First Partial Receive: 10 units of Product 1 (Ordered: 20)
    console.log('Executing partial receipt (10 units of Product 1):');
    const receive1 = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            purchaseOrderItemId: poItem1.id,
            quantity: 10,
          },
        ],
        reference: `GRN-${customPONumber}-1`,
        notes: 'Dock 3 initial consignment received',
        performedBy: 'Receiving Dock Lead',
      }),
    });

    assert(receive1.status === 200, `POST /receive (Partial) returns 200 (Got ${receive1.status})`);
    assert(
      receive1.body.data?.status === 'PARTIALLY_RECEIVED',
      `PO status changed to PARTIALLY_RECEIVED (Got ${receive1.body.data?.status})`
    );

    const updatedItem1AfterRecv1 = receive1.body.data?.items?.find((i) => i.id === poItem1.id);
    assert(updatedItem1AfterRecv1?.receivedQuantity === 10, 'Item 1 receivedQuantity is 10');
    assert(updatedItem1AfterRecv1?.remaining === 10, 'Item 1 remaining quantity is 10');

    // Verify Inventory integration
    const postInv1 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product1.id,
          warehouseId: warehouse1.id,
        },
      },
    });
    assert(
      postInv1.currentStock === preStockProduct1 + 10,
      `Inventory stock incremented by 10 (Before: ${preStockProduct1}, Now: ${postInv1.currentStock})`
    );
    assert(
      postInv1.reservedStock === preReservedProduct1,
      `reservedStock unchanged (Remains ${postInv1.reservedStock})`
    );

    // Verify StockMovement integration
    const latestMovement1 = await prisma.stockMovement.findFirst({
      where: {
        productId: product1.id,
        warehouseId: warehouse1.id,
        reference: `GRN-${customPONumber}-1`,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(Boolean(latestMovement1), 'StockMovement record created in database');
    assert(latestMovement1?.type === 'RECEIPT', 'StockMovement type is RECEIPT');
    assert(latestMovement1?.quantity === 10, 'StockMovement quantity is 10');
    assert(latestMovement1?.performedBy === 'Receiving Dock Lead', 'StockMovement performedBy matches');

    // 4.5 Second Receipt: Remaining 10 of Product 1 AND 5 of Product 2
    console.log('Executing second receipt (remaining 10 of P1 + 5 of P2):');
    const receive2 = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            purchaseOrderItemId: poItem1.id,
            quantity: 10, // Completes P1 (total 20/20)
          },
          {
            purchaseOrderItemId: poItem2.id,
            quantity: 5,  // Partial P2 (5/10)
          },
        ],
        reference: `GRN-${customPONumber}-2`,
        notes: 'Second intake batch',
        performedBy: 'Dock Lead B',
      }),
    });

    assert(receive2.status === 200, `POST /receive (Batch 2) returns 200`);
    assert(
      receive2.body.data?.status === 'PARTIALLY_RECEIVED',
      'PO status remains PARTIALLY_RECEIVED as Product 2 still has 5 remaining'
    );

    const updatedItem1AfterRecv2 = receive2.body.data?.items?.find((i) => i.id === poItem1.id);
    const updatedItem2AfterRecv2 = receive2.body.data?.items?.find((i) => i.id === poItem2.id);

    assert(updatedItem1AfterRecv2?.receivedQuantity === 20, 'Item 1 fully received (20/20)');
    assert(updatedItem1AfterRecv2?.remaining === 0, 'Item 1 remaining is 0');
    assert(updatedItem2AfterRecv2?.receivedQuantity === 5, 'Item 2 receivedQuantity is 5/10');
    assert(updatedItem2AfterRecv2?.remaining === 5, 'Item 2 remaining is 5');

    // Verify Product 2 Inventory incremented by 5
    const postInv2 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product2.id,
          warehouseId: warehouse1.id,
        },
      },
    });
    assert(
      postInv2.currentStock === preStockProduct2 + 5,
      `Inventory stock for Product 2 incremented by 5 (Before: ${preStockProduct2}, Now: ${postInv2.currentStock})`
    );

    // 4.6 Final Receipt: Complete remaining 5 of Product 2
    console.log('Executing final receipt (completing order):');
    const receiveFinal = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            purchaseOrderItemId: poItem2.id,
            quantity: 5,
          },
        ],
        reference: `GRN-${customPONumber}-3`,
        notes: 'Final batch received, order fulfilled',
      }),
    });

    assert(receiveFinal.status === 200, 'POST /receive (Final) returns 200');
    assert(
      receiveFinal.body.data?.status === 'RECEIVED',
      `PO status transitioned to fully RECEIVED (Got ${receiveFinal.body.data?.status})`
    );

    // 4.7 Rejection when receiving against fully received PO
    console.log('Testing rejection of receipts on fully RECEIVED order:');
    const postCompleteReceive = await request(`/purchase-orders/${createdPOId}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ purchaseOrderItemId: poItem2.id, quantity: 1 }],
      }),
    });
    assert(
      postCompleteReceive.status === 400,
      `Attempting to receive on fully RECEIVED order returns 400 (Got ${postCompleteReceive.status})`
    );

    // 4.8 Automatic Inventory Creation when none exists
    console.log('\nTesting automatic inventory creation upon PO receipt:');
    // Ensure Product 2 has no inventory in Warehouse 2
    const existingP2W2 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product2.id,
          warehouseId: warehouse2.id,
        },
      },
    });
    if (existingP2W2) {
      await prisma.inventory.delete({ where: { id: existingP2W2.id } });
    }

    const poAutoInvRes = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: createdSupplierId1,
        warehouseId: warehouse2.id,
        status: 'APPROVED', // Direct approved
        items: [{ productId: product2.id, quantity: 15, unitPrice: 18000 }],
      }),
    });
    assert(poAutoInvRes.status === 201, 'Created PO for warehouse without prior inventory record');
    const autoPO = poAutoInvRes.body.data;
    const autoPOItem = autoPO.items[0];

    const autoRecvRes = await request(`/purchase-orders/${autoPO.id}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ purchaseOrderItemId: autoPOItem.id, quantity: 15 }],
        reference: `GRN-AUTO-INV-${Date.now().toString().slice(-4)}`,
      }),
    });
    assert(autoRecvRes.status === 200, 'Goods received for item without prior inventory');

    const createdAutoInv = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product2.id,
          warehouseId: warehouse2.id,
        },
      },
    });
    assert(Boolean(createdAutoInv), 'New Inventory record automatically created in database');
    assert(createdAutoInv?.currentStock === 15, 'Auto-created inventory has currentStock = 15');
    assert(createdAutoInv?.reservedStock === 0, 'Auto-created inventory has reservedStock = 0');
    assert(createdAutoInv?.reorderLevel === 10, 'Auto-created inventory has default reorderLevel = 10');

    // 4.9 Atomic Rollback Safety Verification
    console.log('\nTesting transaction rollback safety on receiving error:');
    const poRollbackTest = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: createdSupplierId1,
        warehouseId: warehouse1.id,
        status: 'APPROVED',
        items: [
          { productId: product1.id, quantity: 10, unitPrice: 20000 },
          { productId: product2.id, quantity: 10, unitPrice: 15000 },
        ],
      }),
    });
    const rollbackPO = poRollbackTest.body.data;
    const rbItem1 = rollbackPO.items[0];
    const rbItem2 = rollbackPO.items[1];

    const preRollbackInv1 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product1.id,
          warehouseId: warehouse1.id,
        },
      },
    });
    const preRollbackMovementsCount = await prisma.stockMovement.count();

    // Send payload where Item 1 is valid (5 units), but Item 2 exceeds ordered (99 units)
    const failedBatchReceive = await request(`/purchase-orders/${rollbackPO.id}/receive`, {
      method: 'POST',
      body: JSON.stringify({
        items: [
          { purchaseOrderItemId: rbItem1.id, quantity: 5 },
          { purchaseOrderItemId: rbItem2.id, quantity: 99 }, // INVALID: exceeds remaining 10
        ],
      }),
    });
    assert(failedBatchReceive.status === 400, 'Multi-item receipt with 1 invalid item returned 400');

    // Check rollback integrity
    const postRollbackPO = await prisma.purchaseOrder.findUnique({
      where: { id: rollbackPO.id },
      include: { items: true },
    });
    const postRollbackInv1 = await prisma.inventory.findUnique({
      where: {
        unique_product_warehouse_inventory: {
          productId: product1.id,
          warehouseId: warehouse1.id,
        },
      },
    });
    const postRollbackMovementsCount = await prisma.stockMovement.count();

    assert(
      postRollbackPO.status === 'APPROVED',
      'Rollback verified: PO status remains unchanged at APPROVED'
    );
    assert(
      postRollbackPO.items[0].receivedQuantity === 0,
      'Rollback verified: Item 1 receivedQuantity remains 0'
    );
    assert(
      postRollbackInv1.currentStock === preRollbackInv1.currentStock,
      'Rollback verified: Inventory stock was NOT modified'
    );
    assert(
      postRollbackMovementsCount === preRollbackMovementsCount,
      'Rollback verified: No phantom StockMovement was created'
    );

    // ==========================================
    // 5. REGRESSION TESTING OF ALL PREVIOUS MODULES
    // ==========================================
    console.log('\n--- TEST GROUP 5: REGRESSION TESTING (EXISTING MODULES) ---');

    // Health
    const regHealth = await request('/health');
    assert(regHealth.status === 200 && regHealth.body.database === 'connected', 'Regression: Health check 200 & db connected');

    // Products
    const regProd = await request('/products');
    assert(regProd.status === 200 && Array.isArray(regProd.body.data), 'Regression: Products listing returns 200');

    // Categories
    const regCat = await request('/categories');
    assert(regCat.status === 200 && Array.isArray(regCat.body.data), 'Regression: Categories listing returns 200');

    // Warehouses
    const regWh = await request('/warehouses');
    assert(regWh.status === 200 && Array.isArray(regWh.body.data), 'Regression: Warehouses listing returns 200');

    // Inventory listing
    const regInv = await request('/inventory');
    assert(regInv.status === 200 && Array.isArray(regInv.body.data), 'Regression: Inventory listing returns 200');

    // Inventory adjustments
    const regAdj = await request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: product1.id,
        warehouseId: warehouse1.id,
        type: 'ADD',
        quantity: 2,
        reason: 'Regression verification adjustment',
      }),
    });
    assert(regAdj.status === 200, 'Regression: Inventory stock adjustment returns 200');

    // Stock movements
    const regSm = await request('/stock-movements');
    assert(regSm.status === 200 && Array.isArray(regSm.body.data), 'Regression: Stock movements listing returns 200');

    // Movement filter by type=RECEIPT
    const regReceiptMovements = await request('/stock-movements?type=RECEIPT');
    assert(regReceiptMovements.status === 200, 'Regression: Filter stock movements by type=RECEIPT returns 200');
    assert(regReceiptMovements.body.data.length >= 1, 'RECEIPT movements logged in ledger');

    console.log('\n====================================================');
    console.log(`PROCUREMENT TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unexpected test suite error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runProcurementTests();
