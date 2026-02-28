-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "foodics_api_token" TEXT,
    "foodics_default_location_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foodics_item_mappings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "foodics_product_id" TEXT NOT NULL,
    "foodics_product_name" TEXT NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity_per_sale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foodics_item_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foodics_webhook_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "foodics_order_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "items_deducted" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foodics_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key" ON "tenant_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "foodics_item_mappings_tenant_id_idx" ON "foodics_item_mappings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "foodics_item_mappings_tenant_id_foodics_product_id_key" ON "foodics_item_mappings"("tenant_id", "foodics_product_id");

-- CreateIndex
CREATE INDEX "foodics_webhook_logs_tenant_id_processed_at_idx" ON "foodics_webhook_logs"("tenant_id", "processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "foodics_webhook_logs_tenant_id_foodics_order_id_key" ON "foodics_webhook_logs"("tenant_id", "foodics_order_id");

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_foodics_default_location_id_fkey" FOREIGN KEY ("foodics_default_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foodics_item_mappings" ADD CONSTRAINT "foodics_item_mappings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foodics_item_mappings" ADD CONSTRAINT "foodics_item_mappings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foodics_webhook_logs" ADD CONSTRAINT "foodics_webhook_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
