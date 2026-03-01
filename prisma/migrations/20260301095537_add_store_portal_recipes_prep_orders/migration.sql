-- CreateEnum
CREATE TYPE "PrepOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'TRANSFER_CREATED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "location_id" UUID;

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" UUID,
    "yield_qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "yield_uom" TEXT NOT NULL DEFAULT 'EA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_lines" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "recipe_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_prep_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "PrepOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "prep_date" DATE NOT NULL,
    "notes" TEXT,
    "created_by_id" UUID NOT NULL,
    "transfer_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_prep_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_prep_order_lines" (
    "id" UUID NOT NULL,
    "prep_order_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "daily_prep_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_tenant_id_is_active_idx" ON "recipes"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_tenant_id_code_key" ON "recipes"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "daily_prep_orders_tenant_id_status_idx" ON "daily_prep_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "daily_prep_orders_tenant_id_location_id_idx" ON "daily_prep_orders"("tenant_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_prep_orders_tenant_id_order_number_key" ON "daily_prep_orders"("tenant_id", "order_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prep_orders" ADD CONSTRAINT "daily_prep_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prep_orders" ADD CONSTRAINT "daily_prep_orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prep_orders" ADD CONSTRAINT "daily_prep_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prep_orders" ADD CONSTRAINT "daily_prep_orders_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prep_order_lines" ADD CONSTRAINT "daily_prep_order_lines_prep_order_id_fkey" FOREIGN KEY ("prep_order_id") REFERENCES "daily_prep_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prep_order_lines" ADD CONSTRAINT "daily_prep_order_lines_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
