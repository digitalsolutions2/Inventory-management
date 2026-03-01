import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  sanitizePagination,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );
    const locationId = searchParams.get("locationId") || user.locationId;
    const search = searchParams.get("search") || "";
    const stockFilter = searchParams.get("stockFilter") || "";

    if (!locationId) return apiError("No location specified");

    // If browsing other store, check permission
    if (locationId !== user.locationId) {
      if (!checkPermission(user, "store:browse"))
        return apiError("Forbidden", 403);
    } else {
      if (!checkPermission(user, "store:inventory"))
        return apiError("Forbidden", 403);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: user.tenantId,
      locationId,
    };

    if (search) {
      where.item = {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (stockFilter === "low") {
      where.quantity = { gt: 0 };
    } else if (stockFilter === "out") {
      where.quantity = { lte: 0 };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              code: true,
              name: true,
              uom: true,
              minStock: true,
              reorderPoint: true,
              category: { select: { name: true } },
            },
          },
          location: { select: { id: true, name: true, type: true } },
        },
        orderBy: { item: { name: "asc" } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Post-filter for low stock (need reorderPoint comparison)
    const data =
      stockFilter === "low"
        ? items.filter((i) => i.item.reorderPoint > 0 && i.quantity <= i.item.reorderPoint)
        : items;

    return apiSuccess({
      data,
      total: stockFilter === "low" ? data.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((stockFilter === "low" ? data.length : total) / pageSize),
    });
  } catch (e) {
    console.error("GET /api/store/inventory error:", e);
    return apiError("Failed to fetch store inventory", 500);
  }
}
