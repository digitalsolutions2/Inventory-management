-- Migrate existing PENDING_APPROVAL POs to PENDING_QC_APPROVAL
UPDATE "purchase_orders" SET "status" = 'DRAFT' WHERE "status" = 'PENDING_APPROVAL';

-- AlterEnum
BEGIN;
CREATE TYPE "POStatus_new" AS ENUM ('DRAFT', 'PENDING_QC_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'PENDING_WAREHOUSE_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
ALTER TABLE "public"."purchase_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "POStatus_new" USING ("status"::text::"POStatus_new");
ALTER TYPE "POStatus" RENAME TO "POStatus_old";
ALTER TYPE "POStatus_new" RENAME TO "POStatus";
DROP TYPE "public"."POStatus_old";
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "finance_approved_at" TIMESTAMP(3),
ADD COLUMN     "finance_approved_by_id" UUID,
ADD COLUMN     "internal_request_id" UUID,
ADD COLUMN     "qc_approved_at" TIMESTAMP(3),
ADD COLUMN     "qc_approved_by_id" UUID,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by_id" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "warehouse_approved_at" TIMESTAMP(3),
ADD COLUMN     "warehouse_approved_by_id" UUID;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_qc_approved_by_id_fkey" FOREIGN KEY ("qc_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_finance_approved_by_id_fkey" FOREIGN KEY ("finance_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouse_approved_by_id_fkey" FOREIGN KEY ("warehouse_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_internal_request_id_fkey" FOREIGN KEY ("internal_request_id") REFERENCES "internal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
