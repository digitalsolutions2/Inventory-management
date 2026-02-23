import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
  sanitizePagination,
} from "@/lib/api-utils";
import { CreateRequestSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );
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
  } catch (e) {
    console.error("GET /api/internal-requests error:", e);
    return apiError("Failed to fetch requests", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "requests:write"))
    return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateRequestSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { lines, notes } = parsed.data;

    // Validate stock availability for each item
    for (const line of lines) {
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
          create: lines.map((line) => ({
            itemId: line.itemId,
            requestedQty: line.requestedQty,
            notes: line.notes,
          })),
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
  } catch (e) {
    console.error("POST /api/internal-requests error:", e);
    return apiError("Failed to create request", 500);
  }
}
