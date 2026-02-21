import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const groupBy = searchParams.get("groupBy") || "location"; // location | category

  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { tenantId: user.tenantId },
    include: {
      item: {
        select: { id: true, code: true, name: true, uom: true, categoryId: true, category: { select: { id: true, name: true } } },
      },
      location: { select: { id: true, code: true, name: true, type: true } },
    },
  });

  const totalValue = inventoryItems.reduce(
    (s, i) => s + i.quantity * i.avgCost,
    0
  );
  const totalItems = inventoryItems.reduce((s, i) => s + i.quantity, 0);

  if (groupBy === "category") {
    const byCategory: Record<string, { name: string; quantity: number; value: number; items: number }> = {};
    for (const inv of inventoryItems) {
      const catName = inv.item.category?.name || "Uncategorized";
      const catId = inv.item.categoryId || "uncategorized";
      if (!byCategory[catId]) {
        byCategory[catId] = { name: catName, quantity: 0, value: 0, items: 0 };
      }
      byCategory[catId].quantity += inv.quantity;
      byCategory[catId].value += inv.quantity * inv.avgCost;
      byCategory[catId].items += 1;
    }

    return apiSuccess({
      totalValue,
      totalItems,
      breakdown: Object.entries(byCategory).map(([id, data]) => ({ id, ...data })),
    });
  }

  // Default: group by location
  const byLocation: Record<string, { code: string; name: string; type: string; quantity: number; value: number; items: number }> = {};
  for (const inv of inventoryItems) {
    const locId = inv.location.id;
    if (!byLocation[locId]) {
      byLocation[locId] = {
        code: inv.location.code,
        name: inv.location.name,
        type: inv.location.type,
        quantity: 0,
        value: 0,
        items: 0,
      };
    }
    byLocation[locId].quantity += inv.quantity;
    byLocation[locId].value += inv.quantity * inv.avgCost;
    byLocation[locId].items += 1;
  }

  return apiSuccess({
    totalValue,
    totalItems,
    breakdown: Object.entries(byLocation).map(([id, data]) => ({ id, ...data })),
  });
}
