import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

const STEP_CONFIG = {
  qc: {
    permission: "po:approve_qc",
    requiredStatus: "PENDING_QC_APPROVAL" as const,
    nextStatus: "PENDING_FINANCE_APPROVAL" as const,
    approvedByField: "qcApprovedById",
    approvedAtField: "qcApprovedAt",
  },
  finance: {
    permission: "po:approve_finance",
    requiredStatus: "PENDING_FINANCE_APPROVAL" as const,
    nextStatus: "PENDING_WAREHOUSE_APPROVAL" as const,
    approvedByField: "financeApprovedById",
    approvedAtField: "financeApprovedAt",
  },
  warehouse: {
    permission: "po:approve_warehouse",
    requiredStatus: "PENDING_WAREHOUSE_APPROVAL" as const,
    nextStatus: "APPROVED" as const,
    approvedByField: "warehouseApprovedById",
    approvedAtField: "warehouseApprovedAt",
  },
} as const;

type StepKey = keyof typeof STEP_CONFIG;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "approve";
    const step = body.step as StepKey | undefined;

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!po) return apiError("Purchase order not found", 404);

    // Determine which step based on current PO status if step not provided
    let resolvedStep: StepKey | undefined = step;
    if (!resolvedStep) {
      if (po.status === "PENDING_QC_APPROVAL") resolvedStep = "qc";
      else if (po.status === "PENDING_FINANCE_APPROVAL") resolvedStep = "finance";
      else if (po.status === "PENDING_WAREHOUSE_APPROVAL") resolvedStep = "warehouse";
      else return apiError("PO is not in a pending approval state");
    }

    const config = STEP_CONFIG[resolvedStep];
    if (!config) return apiError("Invalid approval step");

    // Check permission
    if (!checkPermission(user, config.permission))
      return apiError("Forbidden - you don't have permission for this approval step", 403);

    // Check status matches expected
    if (po.status !== config.requiredStatus)
      return apiError(`PO is not in ${config.requiredStatus} status`);

    // Segregation of duties: creator cannot approve at any step
    if (po.createdById === user.id)
      return apiError("You cannot approve your own purchase order");

    if (action === "reject") {
      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: "CANCELLED",
          rejectedById: user.id,
          rejectedAt: new Date(),
          rejectionReason: body.reason || "No reason provided",
        },
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } },
          qcApprovedBy: { select: { id: true, fullName: true } },
          financeApprovedBy: { select: { id: true, fullName: true } },
          warehouseApprovedBy: { select: { id: true, fullName: true } },
          rejectedBy: { select: { id: true, fullName: true } },
        },
      });

      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: `po:reject_${resolvedStep}`,
        entityType: "PurchaseOrder",
        entityId: id,
        beforeData: { status: config.requiredStatus },
        afterData: { status: "CANCELLED", reason: body.reason, step: resolvedStep },
      });

      return apiSuccess(updated);
    }

    // Approve - advance to next status
    const now = new Date();

    // Warehouse step with locationId: approve AND receive into inventory in one transaction
    if (resolvedStep === "warehouse" && body.locationId) {
      const locationId = body.locationId as string;

      // Validate location
      const location = await prisma.location.findFirst({
        where: { id: locationId, tenantId: user.tenantId, isActive: true },
      });
      if (!location)
        return apiError("Location not found or inactive", 404);

      // Fetch PO lines with items
      const poWithLines = await prisma.purchaseOrder.findFirst({
        where: { id, tenantId: user.tenantId },
        include: { lines: { include: { item: true } } },
      });
      if (!poWithLines) return apiError("Purchase order not found", 404);

      await prisma.$transaction(async (tx) => {
        // Upsert inventory for each line
        for (const line of poWithLines.lines) {
          if (line.quantity <= 0) continue;

          const existingInv = await tx.inventoryItem.findUnique({
            where: {
              tenantId_itemId_locationId: {
                tenantId: user.tenantId,
                itemId: line.itemId,
                locationId,
              },
            },
          });

          if (existingInv) {
            const totalQty = existingInv.quantity + line.quantity;
            const newAvgCost =
              totalQty > 0
                ? (existingInv.quantity * existingInv.avgCost +
                    line.quantity * line.unitCost) /
                  totalQty
                : line.unitCost;

            await tx.inventoryItem.update({
              where: { id: existingInv.id },
              data: { quantity: totalQty, avgCost: newAvgCost },
            });
          } else {
            await tx.inventoryItem.create({
              data: {
                tenantId: user.tenantId,
                itemId: line.itemId,
                locationId,
                quantity: line.quantity,
                avgCost: line.unitCost,
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              tenantId: user.tenantId,
              itemId: line.itemId,
              locationId,
              type: "INBOUND",
              quantity: line.quantity,
              unitCost: line.unitCost,
              referenceType: "PurchaseOrder",
              referenceId: poWithLines.id,
              notes: body.notes || `Received from ${poWithLines.poNumber}`,
            },
          });

          await tx.purchaseOrderLine.update({
            where: { id: line.id },
            data: { receivedQty: line.quantity },
          });
        }

        // Set status directly to RECEIVED (skip APPROVED)
        await tx.purchaseOrder.update({
          where: { id },
          data: {
            status: "RECEIVED",
            warehouseApprovedById: user.id,
            warehouseApprovedAt: now,
            approvedById: user.id,
            approvedAt: now,
          },
        });
      });

      const updated = await prisma.purchaseOrder.findFirst({
        where: { id },
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } },
          qcApprovedBy: { select: { id: true, fullName: true } },
          financeApprovedBy: { select: { id: true, fullName: true } },
          warehouseApprovedBy: { select: { id: true, fullName: true } },
          rejectedBy: { select: { id: true, fullName: true } },
        },
      });

      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: "po:approve_warehouse_and_receive",
        entityType: "PurchaseOrder",
        entityId: id,
        beforeData: { status: config.requiredStatus },
        afterData: {
          status: "RECEIVED",
          locationId,
          inventoryUpdated: true,
          step: "warehouse",
        },
      });

      return apiSuccess(updated);
    }

    // Standard approval (QC, Finance, or warehouse without locationId)
    const updateData: Record<string, unknown> = {
      status: config.nextStatus,
      [config.approvedByField]: user.id,
      [config.approvedAtField]: now,
    };

    // If this is the final step (warehouse), also set legacy approvedBy/approvedAt
    if (resolvedStep === "warehouse") {
      updateData.approvedById = user.id;
      updateData.approvedAt = now;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        qcApprovedBy: { select: { id: true, fullName: true } },
        financeApprovedBy: { select: { id: true, fullName: true } },
        warehouseApprovedBy: { select: { id: true, fullName: true } },
        rejectedBy: { select: { id: true, fullName: true } },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: `po:approve_${resolvedStep}`,
      entityType: "PurchaseOrder",
      entityId: id,
      beforeData: { status: config.requiredStatus },
      afterData: { status: config.nextStatus, step: resolvedStep },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("POST /api/purchase-orders/[id]/approve error:", e);
    return apiError("Failed to process approval", 500);
  }
}
