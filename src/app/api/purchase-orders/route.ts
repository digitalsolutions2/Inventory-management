import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const where = {
    tenantId: user.tenantId,
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { poNumber: { contains: search, mode: "insensitive" as const } },
        { supplier: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

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
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:create")) return apiError("Forbidden", 403);

  const body = await request.json();
  const { supplierId, expectedDate, notes, lines } = body;

  if (!supplierId) return apiError("Supplier is required");
  if (!lines || lines.length === 0) return apiError("At least one line item is required");

  // Generate PO number
  const count = await prisma.purchaseOrder.count({
    where: { tenantId: user.tenantId },
  });
  const poNumber = `PO-${String(count + 1).padStart(5, "0")}`;

  const totalAmount = lines.reduce(
    (sum: number, line: { quantity: number; unitCost: number }) =>
      sum + line.quantity * line.unitCost,
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
      lines: {
        create: lines.map(
          (line: { itemId: string; quantity: number; unitCost: number; notes?: string }) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            unitCost: line.unitCost,
            totalCost: line.quantity * line.unitCost,
            notes: line.notes,
          })
        ),
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

  return apiSuccess(po, 201);
}
