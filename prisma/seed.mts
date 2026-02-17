import { config } from "dotenv";
config({ path: ".env.local" });

// Override DATABASE_URL with DIRECT_URL for seed script (direct connection, not pooler)
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// @ts-expect-error - tsx runtime handles .ts imports
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
import { createClient } from "@supabase/supabase-js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_USERS = [
  { email: "admin@demo.com", password: "Admin123!", fullName: "Admin User", role: "admin" },
  { email: "procurement@demo.com", password: "Proc123!", fullName: "Sarah Ahmed", role: "procurement" },
  { email: "qc@demo.com", password: "QC123456!", fullName: "Ali Hassan", role: "qc_inspector" },
  { email: "warehouse@demo.com", password: "Wh123456!", fullName: "Omar Khalil", role: "warehouse" },
  { email: "store@demo.com", password: "Store123!", fullName: "Fatima Noor", role: "store_manager" },
  { email: "finance@demo.com", password: "Fin123456!", fullName: "Yusuf Ibrahim", role: "finance" },
];

const ROLES = [
  {
    name: "admin",
    description: "Full system access",
    permissions: [
      "items:read", "items:write", "items:delete",
      "locations:read", "locations:write", "locations:delete",
      "suppliers:read", "suppliers:write", "suppliers:delete",
      "po:read", "po:write", "po:approve", "po:delete",
      "receiving:read", "receiving:proc_verify", "receiving:qc_inspect", "receiving:warehouse_receive",
      "inventory:read", "inventory:write", "inventory:adjust",
      "requests:read", "requests:write", "requests:fulfill", "requests:confirm",
      "transfers:read", "transfers:write", "transfers:approve", "transfers:fulfill", "transfers:receive",
      "payments:read", "payments:write",
      "reports:read", "reports:export",
      "users:read", "users:write", "users:delete",
      "settings:read", "settings:write",
      "audit:read",
    ],
  },
  {
    name: "procurement",
    description: "Manages suppliers and purchase orders",
    permissions: [
      "items:read", "suppliers:read", "suppliers:write",
      "po:read", "po:write",
      "receiving:read", "receiving:proc_verify",
      "reports:read",
    ],
  },
  {
    name: "qc_inspector",
    description: "Quality control inspections",
    permissions: [
      "items:read", "receiving:read", "receiving:qc_inspect",
      "reports:read",
    ],
  },
  {
    name: "warehouse",
    description: "Warehouse operations",
    permissions: [
      "items:read", "locations:read", "locations:write",
      "inventory:read", "inventory:write", "inventory:adjust",
      "receiving:read", "receiving:warehouse_receive",
      "requests:read", "requests:fulfill",
      "transfers:read", "transfers:fulfill", "transfers:receive",
      "reports:read",
    ],
  },
  {
    name: "store_manager",
    description: "Store management and ordering",
    permissions: [
      "items:read", "inventory:read",
      "requests:read", "requests:write", "requests:confirm",
      "transfers:read", "transfers:write",
      "reports:read",
    ],
  },
  {
    name: "finance",
    description: "Financial operations and reporting",
    permissions: [
      "items:read", "suppliers:read",
      "po:read", "po:approve",
      "payments:read", "payments:write",
      "reports:read", "reports:export",
    ],
  },
];

const CATEGORIES = [
  { name: "Proteins", description: "Meat, poultry, seafood" },
  { name: "Dairy", description: "Milk, cheese, butter, cream" },
  { name: "Produce", description: "Fresh fruits and vegetables" },
  { name: "Dry Goods", description: "Rice, pasta, flour, sugar" },
  { name: "Beverages", description: "Drinks, juices, water" },
  { name: "Spices & Seasonings", description: "Herbs, spices, sauces" },
  { name: "Frozen", description: "Frozen foods and ingredients" },
  { name: "Bakery", description: "Bread, pastries, baking supplies" },
  { name: "Oils & Fats", description: "Cooking oils, butter, ghee" },
  { name: "Packaging", description: "Containers, wraps, bags" },
];

async function main() {
  console.log("Seeding database...");

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-company" },
    update: {},
    create: {
      name: "Demo F&B Company",
      slug: "demo-company",
    },
  });
  console.log("Created tenant:", tenant.name);

  // Create roles
  const roleMap: Record<string, string> = {};
  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleData.name } },
      update: { permissions: roleData.permissions },
      create: {
        tenantId: tenant.id,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      },
    });
    roleMap[roleData.name] = role.id;
    console.log("Created role:", role.name);
  }

  // Create users in Supabase Auth and local DB
  for (const userData of DEMO_USERS) {
    let supabaseId: string | undefined;

    // Create in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // User exists, find them
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users?.find((u) => u.email === userData.email);
        if (existing) {
          supabaseId = existing.id;
        } else {
          console.error(`Could not find existing user ${userData.email}`);
          continue;
        }
      } else {
        console.error(`Error creating auth user ${userData.email}:`, authError.message);
        continue;
      }
    } else {
      supabaseId = authUser.user.id;
    }

    if (!supabaseId) continue;

    const dbUser = await prisma.user.upsert({
      where: { supabaseId },
      update: {},
      create: {
        supabaseId,
        tenantId: tenant.id,
        email: userData.email,
        fullName: userData.fullName,
      },
    });

    await prisma.userRole.upsert({
      where: { userId: dbUser.id },
      update: { roleId: roleMap[userData.role] },
      create: { userId: dbUser.id, roleId: roleMap[userData.role] },
    });

    console.log(`Created user: ${userData.email} with role: ${userData.role}`);
  }

  // Create categories
  for (const catData of CATEGORIES) {
    await prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: catData.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: catData.name,
        description: catData.description,
      },
    });
  }
  console.log(`Created ${CATEGORIES.length} categories`);

  // Create sample items
  const categories = await prisma.category.findMany({ where: { tenantId: tenant.id } });
  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c.name] = c.id;

  const ITEMS = [
    { code: "PRO-001", name: "Chicken Breast (1kg)", categoryName: "Proteins", uom: "KG", minStock: 50, maxStock: 200, reorderPoint: 75, avgCost: 25 },
    { code: "PRO-002", name: "Beef Tenderloin (1kg)", categoryName: "Proteins", uom: "KG", minStock: 30, maxStock: 100, reorderPoint: 45, avgCost: 85 },
    { code: "PRO-003", name: "Salmon Fillet (1kg)", categoryName: "Proteins", uom: "KG", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 95 },
    { code: "PRO-004", name: "Shrimp (1kg)", categoryName: "Proteins", uom: "KG", minStock: 15, maxStock: 60, reorderPoint: 25, avgCost: 75 },
    { code: "DAI-001", name: "Fresh Milk (1L)", categoryName: "Dairy", uom: "L", minStock: 100, maxStock: 500, reorderPoint: 150, avgCost: 5 },
    { code: "DAI-002", name: "Mozzarella Cheese (1kg)", categoryName: "Dairy", uom: "KG", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 35 },
    { code: "DAI-003", name: "Butter (500g)", categoryName: "Dairy", uom: "EA", minStock: 40, maxStock: 150, reorderPoint: 60, avgCost: 12 },
    { code: "DAI-004", name: "Heavy Cream (1L)", categoryName: "Dairy", uom: "L", minStock: 30, maxStock: 120, reorderPoint: 45, avgCost: 15 },
    { code: "VEG-001", name: "Tomatoes (1kg)", categoryName: "Produce", uom: "KG", minStock: 50, maxStock: 200, reorderPoint: 75, avgCost: 8 },
    { code: "VEG-002", name: "Onions (1kg)", categoryName: "Produce", uom: "KG", minStock: 50, maxStock: 200, reorderPoint: 75, avgCost: 5 },
    { code: "VEG-003", name: "Lettuce (head)", categoryName: "Produce", uom: "EA", minStock: 30, maxStock: 100, reorderPoint: 40, avgCost: 4 },
    { code: "VEG-004", name: "Bell Peppers (1kg)", categoryName: "Produce", uom: "KG", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 12 },
    { code: "DRY-001", name: "Basmati Rice (5kg)", categoryName: "Dry Goods", uom: "BAG", minStock: 30, maxStock: 100, reorderPoint: 40, avgCost: 25 },
    { code: "DRY-002", name: "All-Purpose Flour (10kg)", categoryName: "Dry Goods", uom: "BAG", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 18 },
    { code: "DRY-003", name: "Spaghetti Pasta (500g)", categoryName: "Dry Goods", uom: "EA", minStock: 50, maxStock: 200, reorderPoint: 75, avgCost: 6 },
    { code: "DRY-004", name: "White Sugar (1kg)", categoryName: "Dry Goods", uom: "KG", minStock: 40, maxStock: 150, reorderPoint: 60, avgCost: 4 },
    { code: "BEV-001", name: "Still Water (500ml)", categoryName: "Beverages", uom: "EA", minStock: 200, maxStock: 1000, reorderPoint: 300, avgCost: 1 },
    { code: "BEV-002", name: "Orange Juice (1L)", categoryName: "Beverages", uom: "EA", minStock: 50, maxStock: 200, reorderPoint: 75, avgCost: 8 },
    { code: "SPI-001", name: "Black Pepper (100g)", categoryName: "Spices & Seasonings", uom: "EA", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 10 },
    { code: "SPI-002", name: "Cumin Powder (100g)", categoryName: "Spices & Seasonings", uom: "EA", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 8 },
    { code: "OIL-001", name: "Olive Oil (1L)", categoryName: "Oils & Fats", uom: "EA", minStock: 30, maxStock: 100, reorderPoint: 40, avgCost: 30 },
    { code: "OIL-002", name: "Vegetable Oil (5L)", categoryName: "Oils & Fats", uom: "EA", minStock: 15, maxStock: 60, reorderPoint: 25, avgCost: 22 },
    { code: "FRZ-001", name: "Frozen French Fries (2.5kg)", categoryName: "Frozen", uom: "BAG", minStock: 30, maxStock: 120, reorderPoint: 45, avgCost: 18 },
    { code: "FRZ-002", name: "Frozen Mixed Vegetables (1kg)", categoryName: "Frozen", uom: "BAG", minStock: 20, maxStock: 80, reorderPoint: 30, avgCost: 12 },
    { code: "PKG-001", name: "Takeaway Container (pack of 50)", categoryName: "Packaging", uom: "PACK", minStock: 20, maxStock: 100, reorderPoint: 30, avgCost: 15 },
  ];

  for (const itemData of ITEMS) {
    await prisma.item.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: itemData.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: itemData.code,
        name: itemData.name,
        categoryId: catMap[itemData.categoryName],
        uom: itemData.uom,
        minStock: itemData.minStock,
        maxStock: itemData.maxStock,
        reorderPoint: itemData.reorderPoint,
        avgCost: itemData.avgCost,
      },
    });
  }
  console.log(`Created ${ITEMS.length} items`);

  // Create locations
  const mainWarehouse = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-001" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-001", name: "Main Warehouse", type: "WAREHOUSE" },
  });

  const coldStorage = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-002" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-002", name: "Cold Storage", type: "WAREHOUSE" },
  });

  // Zones for Main Warehouse
  const dryZone = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-001-DRY" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-001-DRY", name: "Dry Storage Zone", type: "ZONE", parentId: mainWarehouse.id },
  });

  const freshZone = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-001-FRESH" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-001-FRESH", name: "Fresh Produce Zone", type: "ZONE", parentId: mainWarehouse.id },
  });

  // Aisles and shelves
  for (let i = 1; i <= 3; i++) {
    const aisle = await prisma.location.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: `WH-001-DRY-A${i}` } },
      update: {},
      create: { tenantId: tenant.id, code: `WH-001-DRY-A${i}`, name: `Aisle ${i}`, type: "AISLE", parentId: dryZone.id },
    });
    for (let j = 1; j <= 4; j++) {
      await prisma.location.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: `WH-001-DRY-A${i}-S${j}` } },
        update: {},
        create: { tenantId: tenant.id, code: `WH-001-DRY-A${i}-S${j}`, name: `Shelf ${j}`, type: "SHELF", parentId: aisle.id },
      });
    }
  }

  // Cold storage zones
  await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-002-FRIDGE" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-002-FRIDGE", name: "Refrigerator Section", type: "ZONE", parentId: coldStorage.id },
  });
  await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-002-FREEZER" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-002-FREEZER", name: "Freezer Section", type: "ZONE", parentId: coldStorage.id },
  });

  // Stores
  await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "STORE-001" } },
    update: {},
    create: { tenantId: tenant.id, code: "STORE-001", name: "Main Restaurant", type: "STORE" },
  });
  await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "STORE-002" } },
    update: {},
    create: { tenantId: tenant.id, code: "STORE-002", name: "Branch - Mall", type: "STORE" },
  });
  await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "KITCHEN-001" } },
    update: {},
    create: { tenantId: tenant.id, code: "KITCHEN-001", name: "Central Kitchen", type: "KITCHEN" },
  });

  console.log("Created locations with hierarchy");

  // Create suppliers
  const SUPPLIERS = [
    { code: "SUP-001", name: "Al-Safi Foods", contactName: "Mohammed Al-Safi", email: "info@alsafi.com", phone: "+966501234567", paymentTerms: 30 },
    { code: "SUP-002", name: "Fresh Farms Co.", contactName: "Ahmed Hassan", email: "orders@freshfarms.com", phone: "+966502345678", paymentTerms: 15 },
    { code: "SUP-003", name: "Gulf Seafood Trading", contactName: "Khalid Nasser", email: "sales@gulfseafood.com", phone: "+966503456789", paymentTerms: 45 },
    { code: "SUP-004", name: "MENA Dry Goods", contactName: "Tariq Ibrahim", email: "orders@menadrygoods.com", phone: "+966504567890", paymentTerms: 30 },
    { code: "SUP-005", name: "Premium Packaging", contactName: "Layla Mansour", email: "sales@prempack.com", phone: "+966505678901", paymentTerms: 60 },
  ];

  for (const supData of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: supData.code } },
      update: {},
      create: { tenantId: tenant.id, ...supData },
    });
  }
  console.log(`Created ${SUPPLIERS.length} suppliers`);

  console.log("\n=== SEED COMPLETE ===");
  console.log("\nDemo login credentials:");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(15)} -> ${u.email} / ${u.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
