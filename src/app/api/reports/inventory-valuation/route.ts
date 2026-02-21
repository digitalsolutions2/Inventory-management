import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const locationId = searchParams.get("locationId") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const items = await prisma.inventoryItem.findMany({
    where: {
      tenantId: user.tenantId,
      ...(locationId && { locationId }),
      ...(categoryId && { item: { categoryId } }),
    },
    include: {
      item: {
        select: {
          id: true, code: true, name: true, uom: true,
          category: { select: { id: true, name: true } },
        },
      },
      location: { select: { id: true, code: true, name: true, type: true } },
    },
    orderBy: { item: { name: "asc" } },
  });

  const rows = items.map((inv) => ({
    itemCode: inv.item.code,
    itemName: inv.item.name,
    uom: inv.item.uom,
    category: inv.item.category?.name || "Uncategorized",
    location: inv.location.name,
    locationType: inv.location.type,
    quantity: inv.quantity,
    avgCost: inv.avgCost,
    totalValue: inv.quantity * inv.avgCost,
  }));

  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);

  return apiSuccess({ rows, totalValue, totalQty });
}
