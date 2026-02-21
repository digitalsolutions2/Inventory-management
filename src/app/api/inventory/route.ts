import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const locationId = searchParams.get("locationId") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  const where = {
    tenantId: user.tenantId,
    ...(locationId && { locationId }),
    ...(search && {
      item: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        item: { select: { id: true, code: true, name: true, uom: true, minStock: true, maxStock: true, reorderPoint: true } },
        location: { select: { id: true, code: true, name: true, type: true } },
      },
      orderBy: { item: { name: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return apiSuccess({
    data: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
