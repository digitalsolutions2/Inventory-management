import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "store:dashboard"))
    return apiError("Forbidden", 403);
  if (!user.locationId)
    return apiError("You must be assigned to a location");

  try {
    const locationId = user.locationId;
    const tenantId = user.tenantId;

    const [
      inventory,
      pendingIncoming,
      pendingOutgoing,
      recentPreps,
    ] = await Promise.all([
      // Inventory at this location
      prisma.inventoryItem.findMany({
        where: { tenantId, locationId },
        include: {
          item: { select: { id: true, code: true, name: true, uom: true, minStock: true, reorderPoint: true } },
        },
      }),
      // Pending incoming transfers
      prisma.transfer.count({
        where: {
          tenantId,
          toLocationId: locationId,
          status: { in: ["PENDING", "APPROVED", "IN_TRANSIT"] },
        },
      }),
      // Pending outgoing transfers
      prisma.transfer.count({
        where: {
          tenantId,
          fromLocationId: locationId,
          status: { in: ["PENDING", "APPROVED", "IN_TRANSIT"] },
        },
      }),
      // Recent prep orders
      prisma.dailyPrepOrder.findMany({
        where: { tenantId, locationId },
        include: {
          transfer: { select: { transferNumber: true, status: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalItems = inventory.length;
    const totalValue = inventory.reduce(
      (sum, inv) => sum + inv.quantity * inv.avgCost,
      0
    );
    const lowStock = inventory.filter(
      (inv) =>
        inv.item.reorderPoint > 0 && inv.quantity <= inv.item.reorderPoint && inv.quantity > 0
    ).length;
    const outOfStock = inventory.filter((inv) => inv.quantity <= 0).length;

    return apiSuccess({
      totalItems,
      totalValue,
      lowStock,
      outOfStock,
      pendingIncoming,
      pendingOutgoing,
      recentPreps,
      lowStockItems: inventory
        .filter(
          (inv) =>
            inv.item.reorderPoint > 0 && inv.quantity <= inv.item.reorderPoint
        )
        .slice(0, 10)
        .map((inv) => ({
          itemId: inv.item.id,
          itemCode: inv.item.code,
          itemName: inv.item.name,
          uom: inv.item.uom,
          quantity: inv.quantity,
          reorderPoint: inv.item.reorderPoint,
        })),
    });
  } catch (e) {
    console.error("GET /api/store/dashboard error:", e);
    return apiError("Failed to load store dashboard", 500);
  }
}
