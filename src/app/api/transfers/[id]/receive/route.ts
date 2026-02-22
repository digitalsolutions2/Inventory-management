import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
  isNonNegativeNumber,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "transfers:receive"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json();
    const { lines, notes } = body as {
      lines: {
        id: string;
        receivedQty: number;
        notes?: string;
      }[];
      notes?: string;
    };

    if (!lines || !Array.isArray(lines) || lines.length === 0)
      return apiError("Line item receipt data is required");

    // Validate quantities
    for (const line of lines) {
      if (!isNonNegativeNumber(line.receivedQty))
        return apiError(
          "Received quantity must be a non-negative number"
        );
    }

    const transfer = await prisma.transfer.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { lines: { include: { item: true } } },
    });

    if (!transfer) return apiError("Transfer not found", 404);
    if (transfer.status !== "IN_TRANSIT")
      return apiError("Transfer must be In Transit for receiving");

    // Validate received quantities
    for (const line of lines) {
      const trfLine = transfer.lines.find((tl) => tl.id === line.id);
      if (!trfLine)
        return apiError(`Transfer line ${line.id} not found`);
      if (line.receivedQty > trfLine.quantity)
        return apiError(
          `Received qty (${line.receivedQty}) exceeds shipped qty (${trfLine.quantity})`
        );
    }

    // Add to destination in transaction
    const updated = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const trfLine = transfer.lines.find(
          (tl) => tl.id === line.id
        )!;

        // Update line receivedQty
        await tx.transferLine.update({
          where: { id: line.id },
          data: { receivedQty: line.receivedQty, notes: line.notes },
        });

        if (line.receivedQty <= 0) continue;

        // Upsert inventory at destination
        const existingInv = await tx.inventoryItem.findUnique({
          where: {
            tenantId_itemId_locationId: {
              tenantId: user.tenantId,
              itemId: trfLine.itemId,
              locationId: transfer.toLocationId,
            },
          },
        });

        if (existingInv) {
          await tx.inventoryItem.update({
            where: { id: existingInv.id },
            data: { quantity: { increment: line.receivedQty } },
          });
        } else {
          // Get avg cost from source or default to 0
          const sourceInv = await tx.inventoryItem.findUnique({
            where: {
              tenantId_itemId_locationId: {
                tenantId: user.tenantId,
                itemId: trfLine.itemId,
                locationId: transfer.fromLocationId,
              },
            },
          });
          await tx.inventoryItem.create({
            data: {
              tenantId: user.tenantId,
              itemId: trfLine.itemId,
              locationId: transfer.toLocationId,
              quantity: line.receivedQty,
              avgCost: sourceInv?.avgCost || 0,
            },
          });
        }

        // Create TRANSFER_IN transaction
        await tx.inventoryTransaction.create({
          data: {
            tenantId: user.tenantId,
            itemId: trfLine.itemId,
            locationId: transfer.toLocationId,
            type: "TRANSFER_IN",
            quantity: line.receivedQty,
            referenceType: "Transfer",
            referenceId: transfer.id,
            notes: `Transfer in from ${transfer.transferNumber}`,
          },
        });
      }

      return tx.transfer.update({
        where: { id },
        data: {
          status: "RECEIVED",
          receivedById: user.id,
          receivedAt: new Date(),
          notes: notes
            ? transfer.notes
              ? `${transfer.notes}\n\nReceipt: ${notes}`
              : `Receipt: ${notes}`
            : transfer.notes,
        },
        include: {
          fromLocation: {
            select: { id: true, code: true, name: true },
          },
          toLocation: {
            select: { id: true, code: true, name: true },
          },
          createdBy: { select: { id: true, fullName: true } },
          fulfilledBy: { select: { id: true, fullName: true } },
          receivedBy: { select: { id: true, fullName: true } },
          lines: {
            include: {
              item: {
                select: { id: true, code: true, name: true, uom: true },
              },
            },
          },
        },
      });
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "transfer:receive",
      entityType: "Transfer",
      entityId: id,
      beforeData: { status: "IN_TRANSIT" },
      afterData: { status: "RECEIVED" },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("POST /api/transfers/[id]/receive error:", e);
    return apiError("Failed to process transfer receipt", 500);
  }
}
