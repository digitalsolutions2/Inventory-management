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
import { CreatePOSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const { page, pageSize } = sanitizePagination(
    searchParams.get("page"),
    searchParams.get("pageSize")
  );
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const where = {
    tenantId: user.tenantId,
    ...(status && {
      status: { in: status.split(",") as never[] },
    }),
    ...(search && {
      OR: [
        { poNumber: { contains: search, mode: "insensitive" as const } },
        { supplier: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  try {
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } },
          approvedBy: { select: { id: true, fullName: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return apiSuccess({
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/purchase-orders error:", e);
    return apiError("Failed to fetch purchase orders", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:write")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreatePOSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { supplierId, expectedDate, notes, lines, internalRequestId } = parsed.data;

    // Validate supplier exists
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, tenantId: user.tenantId, isActive: true },
    });
    if (!supplier) return apiError("Supplier not found or inactive", 404);

    // Validate items exist
    const itemIds = lines.map((l) => l.itemId);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds }, tenantId: user.tenantId, isActive: true },
    });
    if (items.length !== itemIds.length) {
      return apiError("One or more items not found or inactive");
    }

    // Validate internal request if provided
    if (internalRequestId) {
      const request = await prisma.internalRequest.findFirst({
        where: { id: internalRequestId, tenantId: user.tenantId },
      });
      if (!request) return apiError("Internal request not found", 404);
    }

    // Generate PO number
    const count = await prisma.purchaseOrder.count({
      where: { tenantId: user.tenantId },
    });
    const poNumber = `PO-${String(count + 1).padStart(5, "0")}`;

    const totalAmount = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitCost,
      0
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: user.tenantId,
        poNumber,
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        totalAmount,
        createdById: user.id,
        ...(internalRequestId && { internalRequestId }),
        lines: {
          create: lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            unitCost: line.unitCost,
            totalCost: line.quantity * line.unitCost,
            notes: line.notes,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        lines: {
          include: { item: { select: { id: true, code: true, name: true, uom: true } } },
        },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "po:create",
      entityType: "PurchaseOrder",
      entityId: po.id,
      afterData: { poNumber, supplierId, totalAmount, lineCount: lines.length },
    });

    return apiSuccess(po, 201);
  } catch (e) {
    console.error("POST /api/purchase-orders error:", e);
    return apiError("Failed to create purchase order", 500);
  }
}
