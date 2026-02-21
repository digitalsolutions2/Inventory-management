import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "audit:read"))
    return apiError("Forbidden", 403);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const userId = searchParams.get("userId") || "";
  const entityType = searchParams.get("entityType") || "";
  const action = searchParams.get("action") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const where = {
    tenantId: user.tenantId,
    ...(userId && { userId }),
    ...(entityType && { entityType }),
    ...(action && { action: { contains: action, mode: "insensitive" as const } }),
    ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
    ...(dateTo && {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        lte: new Date(dateTo),
      },
    }),
  };

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
}
