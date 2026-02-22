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
  if (!checkPermission(user, "audit:read"))
    return apiError("Forbidden", 403);

  const { searchParams } = request.nextUrl;
  const { page, pageSize } = sanitizePagination(
    searchParams.get("page"),
    searchParams.get("pageSize")
  );
  const userId = searchParams.get("userId") || "";
  const entityType = searchParams.get("entityType") || "";
  const action = searchParams.get("action") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  // Build date filter correctly - combine gte and lte in one object
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const where = {
    tenantId: user.tenantId,
    ...(userId && { userId }),
    ...(entityType && { entityType }),
    ...(action && {
      action: { contains: action, mode: "insensitive" as const },
    }),
    ...(Object.keys(dateFilter).length > 0 && {
      createdAt: dateFilter,
    }),
  };

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return apiSuccess({
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/audit-logs error:", e);
    return apiError("Failed to fetch audit logs", 500);
  }
}
