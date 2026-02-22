import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
  isPositiveNumber,
  sanitizePagination,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const { page, pageSize } = sanitizePagination(
    searchParams.get("page"),
    searchParams.get("pageSize")
  );
  const status = searchParams.get("status") || "";

  const where = {
    tenantId: user.tenantId,
    ...(status && {
      status: { in: status.split(",") as never[] },
    }),
  };

  try {
    const [receivings, total] = await Promise.all([
      prisma.receiving.findMany({
        where,
        include: {
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true,
              supplier: { select: { id: true, name: true, code: true } },
            },
          },
          procVerifiedBy: { select: { id: true, fullName: true } },
          qcInspectedBy: { select: { id: true, fullName: true } },
          warehouseReceivedBy: { select: { id: true, fullName: true } },
          location: { select: { id: true, name: true, code: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.receiving.count({ where }),
    ]);

    return apiSuccess({
      data: receivings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/receiving error:", e);
    return apiError("Failed to fetch receiving records", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "receiving:proc_verify"))
    return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const { purchaseOrderId, lines, notes } = body;

    if (!purchaseOrderId) return apiError("Purchase order is required");
    if (!lines || !Array.isArray(lines) || lines.length === 0)
      return apiError("At least one line item is required");

    // Validate line quantities
    for (const line of lines) {
      if (!line.itemId) return apiError("Each line must have an itemId");
      if (!isPositiveNumber(line.receivedQty))
        return apiError(
          `Received quantity must be a positive number for item ${line.itemId}`
        );
    }

    // Fetch the PO with lines
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, tenantId: user.tenantId },
      include: {
        lines: { include: { item: true } },
      },
    });

    if (!po) return apiError("Purchase order not found", 404);

    // PO must be APPROVED or SENT
    if (po.status !== "APPROVED" && po.status !== "SENT") {
      return apiError(
        "Purchase order must be Approved or Sent to start receiving"
      );
    }

    // Segregation of duties: user must NOT be the PO creator
    if (po.createdById === user.id) {
      return apiError(
        "You cannot verify a PO that you created (segregation of duties)"
      );
    }

    // Validate all line item IDs exist in the PO
    const poLineMap = new Map(po.lines.map((l) => [l.itemId, l]));
    for (const line of lines) {
      if (!poLineMap.has(line.itemId)) {
        return apiError(
          `Item ${line.itemId} is not part of this purchase order`
        );
      }
    }

    // Generate receiving number: RCV-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await prisma.receiving.count({
      where: {
        tenantId: user.tenantId,
        receivingNumber: { startsWith: `RCV-${dateStr}` },
      },
    });
    const receivingNumber = `RCV-${dateStr}-${String(countToday + 1).padStart(3, "0")}`;

    // Create the receiving record with lines
    const receiving = await prisma.receiving.create({
      data: {
        tenantId: user.tenantId,
        receivingNumber,
        purchaseOrderId,
        status: "PROC_VERIFIED",
        procVerifiedById: user.id,
        procVerifiedAt: new Date(),
        procNotes: notes,
        lines: {
          create: lines.map(
            (line: {
              itemId: string;
              receivedQty: number;
              notes?: string;
            }) => {
              const poLine = poLineMap.get(line.itemId);
              if (!poLine) throw new Error(`PO line not found for item ${line.itemId}`);
              return {
                itemId: line.itemId,
                expectedQty: poLine.quantity,
                receivedQty: line.receivedQty,
                unitCost: poLine.unitCost,
                notes: line.notes,
              };
            }
          ),
        },
      },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            supplier: { select: { id: true, name: true, code: true } },
          },
        },
        procVerifiedBy: { select: { id: true, fullName: true } },
        lines: {
          include: {
            item: {
              select: { id: true, code: true, name: true, uom: true },
            },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "receiving:proc_verify",
      entityType: "Receiving",
      entityId: receiving.id,
      afterData: {
        receivingNumber,
        purchaseOrderId,
        status: "PROC_VERIFIED",
      },
    });

    return apiSuccess(receiving, 201);
  } catch (e) {
    console.error("POST /api/receiving error:", e);
    return apiError("Failed to create receiving record", 500);
  }
}
