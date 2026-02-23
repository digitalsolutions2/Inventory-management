-- CreateIndex
CREATE INDEX "internal_requests_tenant_id_status_idx" ON "internal_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "internal_requests_tenant_id_created_at_idx" ON "internal_requests"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_item_id_idx" ON "inventory_items"("tenant_id", "item_id");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_location_id_idx" ON "inventory_items"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "items_tenant_id_category_id_idx" ON "items"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "items_tenant_id_is_active_idx" ON "items"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "locations_tenant_id_type_idx" ON "locations"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "locations_tenant_id_is_active_idx" ON "locations"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "payments_tenant_id_status_idx" ON "payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "payments_tenant_id_purchase_order_id_idx" ON "payments"("tenant_id", "purchase_order_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_due_date_idx" ON "payments"("tenant_id", "due_date");

-- CreateIndex
CREATE INDEX "purchase_order_lines_purchase_order_id_idx" ON "purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_lines_item_id_idx" ON "purchase_order_lines"("item_id");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_status_idx" ON "purchase_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_supplier_id_idx" ON "purchase_orders"("tenant_id", "supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_created_at_idx" ON "purchase_orders"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "receivings_tenant_id_status_idx" ON "receivings"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "receivings_tenant_id_purchase_order_id_idx" ON "receivings"("tenant_id", "purchase_order_id");

-- CreateIndex
CREATE INDEX "transfers_tenant_id_status_idx" ON "transfers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "transfers_tenant_id_from_location_id_idx" ON "transfers"("tenant_id", "from_location_id");

-- CreateIndex
CREATE INDEX "transfers_tenant_id_to_location_id_idx" ON "transfers"("tenant_id", "to_location_id");
