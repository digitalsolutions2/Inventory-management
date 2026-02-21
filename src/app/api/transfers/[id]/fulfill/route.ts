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
  if (!checkPermission(user, "transfers:fulfill"))
    return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await request.json();
  const { notes } = body;

  const transfer = await prisma.transfer.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { lines: { include: { item: true } } },
  });

  if (!transfer) return apiError("Transfer not found", 404);
  if (transfer.status !== "APPROVED")
    return apiError("Transfer must be Approved for fulfillment");

  // Validate stock at source for each line
  for (const line of transfer.lines) {
    const inv = await prisma.inventoryItem.findUnique({
      where: {
        tenantId_itemId_locationId: {
          tenantId: user.tenantId,
          itemId: line.itemId,
          locationId: transfer.fromLocationId,
        },
      },
    });

    if (!inv || inv.quantity < line.quantity) {
      return apiError(
        `Insufficient stock for ${line.item.name}: available ${inv?.quantity || 0}, needed ${line.quantity}`
      );
    }
  }

  // Deduct from source in transaction
  const updated = await prisma.$transaction(async (tx) => {
    for (const line of transfer.lines) {
      // Deduct from source location
      await tx.inventoryItem.update({
        where: {
          tenantId_itemId_locationId: {
            tenantId: user.tenantId,
            itemId: line.itemId,
            locationId: transfer.fromLocationId,
          },
        },
        data: { quantity: { decrement: line.quantity } },
      });

      // Create TRANSFER_OUT transaction
      await tx.inventoryTransaction.create({
        data: {
          tenantId: user.tenantId,
          itemId: line.itemId,
          locationId: transfer.fromLocationId,
          type: "TRANSFER_OUT",
          quantity: line.quantity,
          referenceType: "Transfer",
          referenceId: transfer.id,
          notes: `Transfer out for ${transfer.transferNumber}`,
        },
      });
    }

    return tx.transfer.update({
      where: { id },
      data: {
        status: "IN_TRANSIT",
        fulfilledById: user.id,
        fulfilledAt: new Date(),
        notes: notes
          ? transfer.notes
            ? `${transfer.notes}\n\nFulfillment: ${notes}`
            : `Fulfillment: ${notes}`
          : transfer.notes,
      },
      include: {
        fromLocation: { select: { id: true, code: true, name: true } },
        toLocation: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        fulfilledBy: { select: { id: true, fullName: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true } },
          },
        },
      },
    });
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "transfer:fulfill",
    entityType: "Transfer",
    entityId: id,
    beforeData: { status: "APPROVED" },
    afterData: { status: "IN_TRANSIT" },
  });

  return apiSuccess(updated);
}
