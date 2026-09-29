/**
 * User Accounts Mock Data for Retail Inventory Management System (Project ID: P_022)
 * Phase 2H: Administration & User Governance
 * 
 * NOTE: Mock user accounts with assigned enterprise role-based authorization levels.
 * (No authentication or password handling in this frontend-only sprint).
 */

export const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Alex Mercer',
    email: 'alex.mercer@retailims.in',
    role: 'ADMIN',
    department: 'Executive Administration',
    status: 'ACTIVE',
    lastLogin: '2026-09-29 09:30',
    createdAt: '2025-10-01',
  },
  {
    id: 'usr-2',
    name: 'Vikram Malhotra',
    email: 'vikram.m@retailims.in',
    role: 'PROCUREMENT_MANAGER',
    department: 'Supply Chain & Sourcing',
    status: 'ACTIVE',
    lastLogin: '2026-09-29 08:45',
    createdAt: '2025-10-15',
  },
  {
    id: 'usr-3',
    name: 'Amit Sharma',
    email: 'amit.sharma@retailims.in',
    role: 'WAREHOUSE_MANAGER',
    department: 'Delhi Central Hub',
    status: 'ACTIVE',
    lastLogin: '2026-09-29 07:15',
    createdAt: '2025-11-10',
  },
  {
    id: 'usr-4',
    name: 'Priya Deshmukh',
    email: 'priya.deshmukh@retailims.in',
    role: 'WAREHOUSE_MANAGER',
    department: 'Mumbai Distribution Center',
    status: 'ACTIVE',
    lastLogin: '2026-09-28 17:20',
    createdAt: '2025-11-15',
  },
  {
    id: 'usr-5',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@retailims.in',
    role: 'INVENTORY_MANAGER',
    department: 'Central Merchandising & Stock Control',
    status: 'ACTIVE',
    lastLogin: '2026-09-29 09:10',
    createdAt: '2025-12-05',
  },
  {
    id: 'usr-6',
    name: 'Sunil Verma',
    email: 'sunil.verma@retailims.in',
    role: 'SALES_MANAGER',
    department: 'Order Fulfillment & Retail Operations',
    status: 'ACTIVE',
    lastLogin: '2026-09-28 16:40',
    createdAt: '2026-01-12',
  },
  {
    id: 'usr-7',
    name: 'Ramesh Kumar',
    email: 'ramesh.k@retailims.in',
    role: 'STAFF',
    department: 'Inbound Warehouse Logistics',
    status: 'ACTIVE',
    lastLogin: '2026-09-29 06:50',
    createdAt: '2026-01-20',
  },
  {
    id: 'usr-8',
    name: 'Kavita Chawla',
    email: 'kavita.c@retailims.in',
    role: 'STAFF',
    department: 'Quality Inspection & Dispatch',
    status: 'INACTIVE',
    lastLogin: '2026-08-14 11:30',
    createdAt: '2026-02-01',
  },
];
