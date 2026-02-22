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
  if (!checkPermission(user, "requests:fulfill"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json();
    const { lines, locationId, notes } = body as {
      lines: { id: string; issuedQty: number; notes?: string }[];
      locationId: string;
      notes?: string;
    };

    if (!lines || !Array.isArray(lines) || lines.length === 0)
      return apiError("Line item fulfillment data is required");
    if (!locationId) return apiError("Source location is required");

    // Validate quantities are non-negative numbers
    for (const line of lines) {
      if (!isNonNegativeNumber(line.issuedQty))
        return apiError("Issued quantity must be a non-negative number");
    }

    // Fetch the request
    const req = await prisma.internalRequest.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { lines: true },
    });

    if (!req) return apiError("Request not found", 404);
    if (req.status !== "PENDING")
      return apiError(
        "Request must be in Pending status for fulfillment"
      );

    // Segregation of duties: fulfiller cannot be the requester
    if (req.createdById === user.id) {
      return apiError(
        "You cannot fulfill a request you created (segregation of duties)"
      );
    }

    // Validate location
    const location = await prisma.location.findFirst({
      where: { id: locationId, tenantId: user.tenantId, isActive: true },
    });
    if (!location)
      return apiError("Location not found or inactive", 404);

    // Validate stock and quantities
    for (const line of lines) {
      const reqLine = req.lines.find((rl) => rl.id === line.id);
      if (!reqLine) return apiError(`Request line ${line.id} not found`);
      if (line.issuedQty > reqLine.requestedQty)
        return apiError(
          `Issued qty (${line.issuedQty}) exceeds requested qty (${reqLine.requestedQty})`
        );

      if (line.issuedQty <= 0) continue;

      // Check inventory at source location
      const inv = await prisma.inventoryItem.findUnique({
        where: {
          tenantId_itemId_locationId: {
            tenantId: user.tenantId,
            itemId: reqLine.itemId,
            locationId,
          },
        },
      });
      if (!inv || inv.quantity < line.issuedQty) {
        return apiError(
          `Insufficient stock at location for item. Available: ${inv?.quantity || 0}, requested: ${line.issuedQty}`
        );
      }
    }

    // Perform fulfillment in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update each line's issuedQty
      for (const line of lines) {
        const reqLine = req.lines.find((rl) => rl.id === line.id)!;

        await tx.internalRequestLine.update({
          where: { id: line.id },
          data: { issuedQty: line.issuedQty, notes: line.notes },
        });

        if (line.issuedQty <= 0) continue;

        // Atomically deduct from inventory with guard against going negative
        const result = await tx.inventoryItem.updateMany({
          where: {
            tenantId: user.tenantId,
            itemId: reqLine.itemId,
            locationId,
            quantity: { gte: line.issuedQty },
          },
          data: { quantity: { decrement: line.issuedQty } },
        });

        if (result.count === 0) {
          throw new Error(
            `Insufficient stock for item ${reqLine.itemId} (concurrent modification)`
          );
        }

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            tenantId: user.tenantId,
            itemId: reqLine.itemId,
            locationId,
            type: "OUTBOUND",
            quantity: line.issuedQty,
            referenceType: "InternalRequest",
            referenceId: req.id,
            notes: `Issued for ${req.requestNumber}`,
          },
        });
      }

      // Update request status
      return tx.internalRequest.update({
        where: { id },
        data: {
          status: "ISSUED",
          fulfilledById: user.id,
          fulfilledAt: new Date(),
          notes: notes
            ? req.notes
              ? `${req.notes}\n\nFulfillment: ${notes}`
              : `Fulfillment: ${notes}`
            : req.notes,
        },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          fulfilledBy: { select: { id: true, fullName: true } },
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
      action: "request:fulfill",
      entityType: "InternalRequest",
      entityId: id,
      beforeData: { status: "PENDING" },
      afterData: { status: "ISSUED", locationId },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error(
      "POST /api/internal-requests/[id]/fulfill error:",
      e
    );
    const message =
      e instanceof Error && e.message.includes("Insufficient stock")
        ? e.message
        : "Failed to fulfill request";
    return apiError(message, 500);
  }
}
