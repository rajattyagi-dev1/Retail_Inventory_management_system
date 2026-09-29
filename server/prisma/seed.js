/**
 * Minimal Deterministic Seed Script for Retail Inventory Management System (Project ID: P_022)
 * Seeds Core System Roles only.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CORE_ROLES = [
  {
    name: 'ADMIN',
    description: 'Full system access, configuration, governance, and administration',
  },
  {
    name: 'INVENTORY_MANAGER',
    description: 'Central stock control, audits, allocations, and reorder threshold management',
  },
  {
    name: 'WAREHOUSE_MANAGER',
    description: 'Regional facility management, dock operations, and bin storage',
  },
  {
    name: 'PROCUREMENT_MANAGER',
    description: 'Supplier onboarding, purchase orders, and inbound intake',
  },
  {
    name: 'SALES_MANAGER',
    description: 'Customer orders, fulfillment oversight, and shipment dispatch',
  },
  {
    name: 'STAFF',
    description: 'Operational warehouse tasks, picking, packing, and stock counting',
  },
];

async function main() {
  console.log('Seeding core system roles...');

  for (const role of CORE_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  console.log(`Successfully seeded ${CORE_ROLES.length} core roles.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
