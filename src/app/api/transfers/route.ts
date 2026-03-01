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
import { CreateTransferSchema, parseBody } from "@/lib/validations";

const APPROVAL_THRESHOLD = 1000; // Transfers > $1000 require approval

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

    const locationId = searchParams.get("locationId") || "";

    const where = {
      tenantId: user.tenantId,
      ...(status && { status: { in: status.split(",") as never[] } }),
      ...(locationId && {
        OR: [
          { fromLocationId: locationId },
          { toLocationId: locationId },
        ],
      }),
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
  } catch (e) {
    console.error("GET /api/transfers error:", e);
    return apiError("Failed to fetch transfers", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "transfers:write"))
    return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateTransferSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { fromLocationId, toLocationId, lines, notes } = parsed.data;

    if (fromLocationId === toLocationId)
      return apiError("Source and destination must be different");

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
    // Store-to-store transfers always require approval
    const storeTypes = ["STORE", "KITCHEN"];
    const isStoreToStore =
      storeTypes.includes(fromLoc.type) && storeTypes.includes(toLoc.type);
    const needsApproval = isStoreToStore || totalValue > APPROVAL_THRESHOLD;
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
          create: lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            notes: line.notes,
          })),
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
  } catch (e) {
    console.error("POST /api/transfers error:", e);
    return apiError("Failed to create transfer", 500);
  }
}
