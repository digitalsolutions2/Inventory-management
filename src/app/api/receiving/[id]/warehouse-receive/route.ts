import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "receiving:warehouse_receive"))
    return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await request.json();
  const { locationId, batchNumber, notes } = body;

  if (!locationId) return apiError("Location is required");

  // Fetch the receiving record with lines
  const receiving = await prisma.receiving.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      lines: { include: { item: true } },
      purchaseOrder: { include: { lines: true } },
    },
  });

  if (!receiving) return apiError("Receiving record not found", 404);
  if (receiving.status !== "QC_APPROVED") {
    return apiError("Receiving must be QC Approved for warehouse receiving");
  }

  // Segregation of duties: must be a different user from both Step 1 and Step 2
  if (receiving.procVerifiedById === user.id) {
    return apiError(
      "You cannot receive items that you verified (segregation of duties)"
    );
  }
  if (receiving.qcInspectedById === user.id) {
    return apiError(
      "You cannot receive items that you inspected (segregation of duties)"
    );
  }

  // Validate location exists and is active
  const location = await prisma.location.findFirst({
    where: { id: locationId, tenantId: user.tenantId, isActive: true },
  });
  if (!location) return apiError("Location not found or inactive", 404);

  // Perform all updates in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update receiving header
    const updatedReceiving = await tx.receiving.update({
      where: { id },
      data: {
        status: "RECEIVED",
        warehouseReceivedById: user.id,
        warehouseReceivedAt: new Date(),
        warehouseNotes: notes,
        locationId,
        batchNumber,
      },
    });

    // 2. For each receiving line with acceptedQty > 0: upsert inventory + create transaction
    for (const line of receiving.lines) {
      if (line.acceptedQty <= 0) continue;

      // Upsert InventoryItem
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
        // Weighted average cost
        const totalQty = existingInv.quantity + line.acceptedQty;
        const newAvgCost =
          totalQty > 0
            ? (existingInv.quantity * existingInv.avgCost +
                line.acceptedQty * line.unitCost) /
              totalQty
            : line.unitCost;

        await tx.inventoryItem.update({
          where: { id: existingInv.id },
          data: {
            quantity: totalQty,
            avgCost: newAvgCost,
          },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            tenantId: user.tenantId,
            itemId: line.itemId,
            locationId,
            quantity: line.acceptedQty,
            avgCost: line.unitCost,
          },
        });
      }

      // Create InventoryTransaction
      await tx.inventoryTransaction.create({
        data: {
          tenantId: user.tenantId,
          itemId: line.itemId,
          locationId,
          type: "INBOUND",
          quantity: line.acceptedQty,
          unitCost: line.unitCost,
          referenceType: "Receiving",
          referenceId: receiving.id,
          notes: `Received from ${receiving.receivingNumber}`,
        },
      });
    }

    // 3. Update PurchaseOrderLine receivedQty
    for (const recLine of receiving.lines) {
      const poLine = receiving.purchaseOrder.lines.find(
        (pl) => pl.itemId === recLine.itemId
      );
      if (poLine) {
        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: { receivedQty: poLine.receivedQty + recLine.acceptedQty },
        });
      }
    }

    // 4. Determine PO status based on total received vs ordered
    const updatedPoLines = await tx.purchaseOrderLine.findMany({
      where: { purchaseOrderId: receiving.purchaseOrderId },
    });

    const allFullyReceived = updatedPoLines.every(
      (l) => l.receivedQty >= l.quantity
    );
    const anyReceived = updatedPoLines.some((l) => l.receivedQty > 0);

    if (allFullyReceived) {
      await tx.purchaseOrder.update({
        where: { id: receiving.purchaseOrderId },
        data: { status: "RECEIVED" },
      });
    } else if (anyReceived) {
      await tx.purchaseOrder.update({
        where: { id: receiving.purchaseOrderId },
        data: { status: "PARTIALLY_RECEIVED" },
      });
    }

    return updatedReceiving;
  });

  // Fetch the full updated record for response
  const result = await prisma.receiving.findFirst({
    where: { id },
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          status: true,
          supplier: { select: { id: true, name: true, code: true } },
        },
      },
      location: { select: { id: true, name: true, code: true } },
      procVerifiedBy: { select: { id: true, fullName: true } },
      qcInspectedBy: { select: { id: true, fullName: true } },
      warehouseReceivedBy: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, name: true, uom: true } },
        },
      },
    },
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "receiving:warehouse_receive",
    entityType: "Receiving",
    entityId: id,
    beforeData: { status: "QC_APPROVED" },
    afterData: {
      status: "RECEIVED",
      locationId,
      batchNumber,
      inventoryUpdated: true,
    },
  });

  return apiSuccess(result);
}
