import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status") || "";

  const where = {
    tenantId: user.tenantId,
    ...(status && { status: { in: status.split(",") as never[] } }),
  };

  const [requests, total] = await Promise.all([
    prisma.internalRequest.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        fulfilledBy: { select: { id: true, fullName: true } },
        confirmedBy: { select: { id: true, fullName: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.internalRequest.count({ where }),
  ]);

  return apiSuccess({
    data: requests,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "requests:write"))
    return apiError("Forbidden", 403);

  const body = await request.json();
  const { lines, notes } = body;

  if (!lines || lines.length === 0)
    return apiError("At least one line item is required");

  // Validate stock availability for each item
  for (const line of lines) {
    if (!line.itemId || !line.requestedQty || line.requestedQty <= 0) {
      return apiError("Each line must have an item and positive quantity");
    }

    // Check total available inventory across all locations
    const totalStock = await prisma.inventoryItem.aggregate({
      where: { tenantId: user.tenantId, itemId: line.itemId },
      _sum: { quantity: true },
    });

    const available = totalStock._sum.quantity || 0;
    if (line.requestedQty > available) {
      const item = await prisma.item.findUnique({ where: { id: line.itemId } });
      return apiError(
        `Insufficient stock for ${item?.name || line.itemId}: requested ${line.requestedQty}, available ${available}`
      );
    }
  }

  // Generate request number
  const count = await prisma.internalRequest.count({
    where: { tenantId: user.tenantId },
  });
  const requestNumber = `REQ-${String(count + 1).padStart(5, "0")}`;

  const req = await prisma.internalRequest.create({
    data: {
      tenantId: user.tenantId,
      requestNumber,
      status: "PENDING",
      notes,
      createdById: user.id,
      lines: {
        create: lines.map(
          (line: { itemId: string; requestedQty: number; notes?: string }) => ({
            itemId: line.itemId,
            requestedQty: line.requestedQty,
            notes: line.notes,
          })
        ),
      },
    },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, name: true, uom: true } },
        },
      },
    },
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "request:create",
    entityType: "InternalRequest",
    entityId: req.id,
    afterData: { requestNumber, status: "PENDING" },
  });

  return apiSuccess(req, 201);
}
