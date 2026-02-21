import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

const APPROVAL_THRESHOLD = 1000; // Transfers > $1000 require approval

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

  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      where,
      include: {
        fromLocation: { select: { id: true, code: true, name: true, type: true } },
        toLocation: { select: { id: true, code: true, name: true, type: true } },
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
        fulfilledBy: { select: { id: true, fullName: true } },
        receivedBy: { select: { id: true, fullName: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transfer.count({ where }),
  ]);

  return apiSuccess({
    data: transfers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "transfers:write"))
    return apiError("Forbidden", 403);

  const body = await request.json();
  const { fromLocationId, toLocationId, lines, notes } = body;

  if (!fromLocationId) return apiError("Source location is required");
  if (!toLocationId) return apiError("Destination location is required");
  if (fromLocationId === toLocationId)
    return apiError("Source and destination must be different");
  if (!lines || lines.length === 0)
    return apiError("At least one line item is required");

  // Validate locations
  const [fromLoc, toLoc] = await Promise.all([
    prisma.location.findFirst({
      where: { id: fromLocationId, tenantId: user.tenantId, isActive: true },
    }),
    prisma.location.findFirst({
      where: { id: toLocationId, tenantId: user.tenantId, isActive: true },
    }),
  ]);
  if (!fromLoc) return apiError("Source location not found or inactive");
  if (!toLoc) return apiError("Destination location not found or inactive");

  // Validate stock at source for each item
  let totalValue = 0;
  for (const line of lines) {
    if (!line.itemId || !line.quantity || line.quantity <= 0) {
      return apiError("Each line must have an item and positive quantity");
    }

    const inv = await prisma.inventoryItem.findUnique({
      where: {
        tenantId_itemId_locationId: {
          tenantId: user.tenantId,
          itemId: line.itemId,
          locationId: fromLocationId,
        },
      },
    });

    if (!inv || inv.quantity < line.quantity) {
      const item = await prisma.item.findUnique({ where: { id: line.itemId } });
      return apiError(
        `Insufficient stock at source for ${item?.name || line.itemId}: available ${inv?.quantity || 0}, requested ${line.quantity}`
      );
    }

    totalValue += line.quantity * (inv.avgCost || 0);
  }

  // Generate transfer number
  const count = await prisma.transfer.count({
    where: { tenantId: user.tenantId },
  });
  const transferNumber = `TRF-${String(count + 1).padStart(5, "0")}`;

  // Determine if approval is required
  const needsApproval = totalValue > APPROVAL_THRESHOLD;
  const initialStatus = needsApproval ? "PENDING" : "APPROVED";

  const transfer = await prisma.transfer.create({
    data: {
      tenantId: user.tenantId,
      transferNumber,
      fromLocationId,
      toLocationId,
      status: initialStatus,
      notes: needsApproval
        ? `${notes || ""}\n[Auto: Requires approval - value $${totalValue.toFixed(2)} exceeds threshold $${APPROVAL_THRESHOLD}]`.trim()
        : notes,
      createdById: user.id,
      lines: {
        create: lines.map(
          (line: { itemId: string; quantity: number; notes?: string }) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            notes: line.notes,
          })
        ),
      },
    },
    include: {
      fromLocation: { select: { id: true, code: true, name: true, type: true } },
      toLocation: { select: { id: true, code: true, name: true, type: true } },
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
    action: "transfer:create",
    entityType: "Transfer",
    entityId: transfer.id,
    afterData: {
      transferNumber,
      status: initialStatus,
      totalValue,
      needsApproval,
    },
  });

  return apiSuccess(transfer, 201);
}
