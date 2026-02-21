import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const type = searchParams.get("type") || "";
  const itemId = searchParams.get("itemId") || "";
  const locationId = searchParams.get("locationId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const where = {
    tenantId: user.tenantId,
    ...(type && { type: { in: type.split(",") as never[] } }),
    ...(itemId && { itemId }),
    ...(locationId && { locationId }),
    ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
    ...(dateTo && {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        lte: new Date(dateTo),
      },
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: {
        item: { select: { id: true, code: true, name: true, uom: true } },
        location: { select: { id: true, code: true, name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  const rows = transactions.map((tx) => ({
    id: tx.id,
    date: tx.createdAt,
    type: tx.type,
    itemCode: tx.item.code,
    itemName: tx.item.name,
    uom: tx.item.uom,
    location: tx.location.name,
    locationType: tx.location.type,
    quantity: tx.quantity,
    unitCost: tx.unitCost,
    referenceType: tx.referenceType,
    referenceId: tx.referenceId,
    notes: tx.notes,
  }));

  return apiSuccess({ rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
