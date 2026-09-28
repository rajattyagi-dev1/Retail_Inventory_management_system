/**
 * Mock Data for Retail Inventory Management System (Project ID: P_022)
 * Phase 2A: Frontend Application Shell & Dashboard UI
 * 
 * NOTE: This is TEMPORARY static mock data used strictly for visual representation 
 * and frontend architecture development. It will be replaced with real backend 
 * API responses in subsequent phases. No real database or backend logic is attached.
 */

export const MOCK_SUMMARY_STATS = [
  {
    id: 'total-products',
    title: 'Total Products',
    value: '1,482',
    change: '+5.4%',
    changeType: 'positive',
    subtext: 'across 14 categories',
    icon: 'Package',
  },
  {
    id: 'total-inventory',
    title: 'Total Inventory Units',
    value: '94,820',
    change: '+2.1%',
    changeType: 'positive',
    subtext: 'valued at $1,842,500',
    icon: 'Boxes',
  },
  {
    id: 'low-stock',
    title: 'Low Stock Items',
    value: '18',
    change: '+4 new',
    changeType: 'negative',
    subtext: '6 items out of stock',
    icon: 'AlertTriangle',
  },
  {
    id: 'pending-orders',
    title: 'Pending Orders',
    value: '42',
    change: '-12%',
    changeType: 'neutral',
    subtext: '14 awaiting pick & pack',
    icon: 'Clock',
  },
];

export const MOCK_WAREHOUSE_DATA = [
  {
    id: 'wh-delhi',
    name: 'Delhi Central Hub',
    location: 'Delhi NCR (North)',
    totalStock: 38400,
    capacity: 45000,
    utilization: 85,
    lowStockCount: 5,
    skusCount: 620,
    manager: 'Rajesh Verma',
    status: 'Operational',
  },
  {
    id: 'wh-mumbai',
    name: 'Mumbai Distribution Center',
    location: 'Bhiwandi, Mumbai (West)',
    totalStock: 32150,
    capacity: 42000,
    utilization: 76,
    lowStockCount: 8,
    skusCount: 540,
    manager: 'Priya Deshmukh',
    status: 'Operational',
  },
  {
    id: 'wh-bangalore',
    name: 'Bangalore Fulfillment Hub',
    location: 'Electronic City, BLR (South)',
    totalStock: 24270,
    capacity: 38000,
    utilization: 64,
    lowStockCount: 5,
    skusCount: 480,
    manager: 'Karthik Raman',
    status: 'Operational',
  },
];

export const MOCK_ORDER_STATUS = {
  total: 1136,
  breakdown: [
    { label: 'Pending', count: 42, percentage: 3.7, status: 'Pending', color: '#f59e0b' },
    { label: 'Processing', count: 68, percentage: 6.0, status: 'Processing', color: '#3b82f6' },
    { label: 'Shipped', count: 184, percentage: 16.2, status: 'Shipped', color: '#8b5cf6' },
    { label: 'Delivered', count: 842, percentage: 74.1, status: 'Delivered', color: '#10b981' },
  ],
};

export const MOCK_LOW_STOCK_PRODUCTS = [
  {
    id: 'lsp-1',
    sku: 'SKU-8841',
    name: 'Industrial Handheld Barcode Scanner',
    category: 'Hardware & Tools',
    warehouse: 'Delhi Central Hub',
    currentStock: 8,
    reorderLevel: 30,
    status: 'Low Stock',
  },
  {
    id: 'lsp-2',
    sku: 'SKU-9214',
    name: 'Heavy Duty Thermal Paper Rolls (50-Pack)',
    category: 'Packaging',
    warehouse: 'Mumbai Distribution Center',
    currentStock: 0,
    reorderLevel: 100,
    status: 'Out of Stock',
  },
  {
    id: 'lsp-3',
    sku: 'SKU-4412',
    name: 'Ergonomic Anti-Fatigue Workstation Mat',
    category: 'Facility & Safety',
    warehouse: 'Bangalore Fulfillment Hub',
    currentStock: 6,
    reorderLevel: 25,
    status: 'Low Stock',
  },
  {
    id: 'lsp-4',
    sku: 'SKU-7309',
    name: 'Wireless RFID Asset Tracking Terminal',
    category: 'Electronics',
    warehouse: 'Delhi Central Hub',
    currentStock: 3,
    reorderLevel: 15,
    status: 'Low Stock',
  },
  {
    id: 'lsp-5',
    sku: 'SKU-6650',
    name: 'Industrial Poly Strapping Band (12mm x 1000m)',
    category: 'Packaging',
    warehouse: 'Mumbai Distribution Center',
    currentStock: 0,
    reorderLevel: 50,
    status: 'Out of Stock',
  },
  {
    id: 'lsp-6',
    sku: 'SKU-1092',
    name: 'Heavy-Duty Reinforced Carton Tape 50mm',
    category: 'Packaging',
    warehouse: 'Bangalore Fulfillment Hub',
    currentStock: 14,
    reorderLevel: 80,
    status: 'Low Stock',
  },
];

export const MOCK_RECENT_ORDERS = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-2026-9841',
    customer: 'Metro Logistics Corp',
    amount: '$4,850.00',
    status: 'Processing',
    date: '2026-09-28',
    itemsCount: 14,
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-2026-9840',
    customer: 'Apex Retail Distribution',
    amount: '$12,400.00',
    status: 'Shipped',
    date: '2026-09-28',
    itemsCount: 48,
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-2026-9839',
    customer: 'Zenith Hypermarket Ltd',
    amount: '$2,180.50',
    status: 'Pending',
    date: '2026-09-27',
    itemsCount: 6,
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-2026-9838',
    customer: 'Horizon Tech Warehousing',
    amount: '$7,920.00',
    status: 'Delivered',
    date: '2026-09-27',
    itemsCount: 22,
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-2026-9837',
    customer: 'QuickCart Multi-Store Hub',
    amount: '$1,450.00',
    status: 'Processing',
    date: '2026-09-27',
    itemsCount: 9,
  },
  {
    id: 'ord-6',
    orderNumber: 'ORD-2026-9836',
    customer: 'Reliance Supply Solutions',
    amount: '$18,320.00',
    status: 'Delivered',
    date: '2026-09-26',
    itemsCount: 65,
  },
];

export const MOCK_STOCK_MOVEMENTS = [
  {
    id: 'sm-1',
    product: 'Industrial Handheld Barcode Scanner',
    warehouse: 'Delhi Central Hub',
    type: 'Inbound',
    quantity: '+150 units',
    date: '2026-09-28 14:15',
    reference: 'PO-2026-081',
  },
  {
    id: 'sm-2',
    product: 'Heavy Duty Thermal Paper Rolls',
    warehouse: 'Mumbai Distribution Center',
    type: 'Outbound',
    quantity: '-450 units',
    date: '2026-09-28 11:30',
    reference: 'ORD-2026-9840',
  },
  {
    id: 'sm-3',
    product: 'Wireless RFID Asset Tracking Terminal',
    warehouse: 'Delhi → Bangalore',
    type: 'Transfer',
    quantity: '25 units',
    date: '2026-09-28 09:45',
    reference: 'TR-2026-014',
  },
  {
    id: 'sm-4',
    product: 'High-Speed Thermal Label Printer',
    warehouse: 'Bangalore Fulfillment Hub',
    type: 'Inbound',
    quantity: '+80 units',
    date: '2026-09-27 16:20',
    reference: 'PO-2026-079',
  },
  {
    id: 'sm-5',
    product: 'Safety Protective Work Gloves (Pack)',
    warehouse: 'Mumbai Distribution Center',
    type: 'Adjustment',
    quantity: '-12 units',
    date: '2026-09-27 12:10',
    reference: 'AUD-2026-003',
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Critical Stock Depletion',
    message: 'SKU-9214 (Thermal Paper Rolls) is completely out of stock at Mumbai Distribution Center.',
    time: '12 minutes ago',
    type: 'critical',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'High-Value Order Received',
    message: 'New purchase order ORD-2026-9840 ($12,400.00) requires verification before dispatch.',
    time: '42 minutes ago',
    type: 'info',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Inter-Warehouse Transfer Completed',
    message: 'Transfer TR-2026-014 (25 RFID Terminals) has safely arrived at Bangalore Hub.',
    time: '3 hours ago',
    type: 'success',
    unread: false,
  },
  {
    id: 'notif-4',
    title: 'Purchase Order Approved',
    message: 'PO-2026-081 for Delhi Central Hub has been approved by Finance.',
    time: '6 hours ago',
    type: 'info',
    unread: false,
  },
  {
    id: 'notif-5',
    title: 'Scheduled Audit Notice',
    message: 'Quarterly stock verification scheduled for Mumbai Hub this Saturday at 08:00 AM.',
    time: '1 day ago',
    type: 'warning',
    unread: false,
  },
];

export const MOCK_CURRENT_USER = {
  name: 'Alex Mercer',
  email: 'a.mercer@retail-ims.internal',
  role: 'Inventory Director',
  avatarUrl: null, // fallback initials 'AM'
  department: 'Supply Chain Operations',
};
