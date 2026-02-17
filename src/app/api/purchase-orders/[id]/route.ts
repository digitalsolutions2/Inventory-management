import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      supplier: true,
      createdBy: { select: { id: true, fullName: true, email: true } },
      approvedBy: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: { item: { select: { id: true, code: true, name: true, uom: true } } },
      },
    },
  });

  if (!po) return apiError("Purchase order not found", 404);
  return apiSuccess(po);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:edit")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Purchase order not found", 404);
  if (existing.status !== "DRAFT") return apiError("Only draft POs can be edited");

  const body = await request.json();
  const { supplierId, expectedDate, notes, lines } = body;

  const totalAmount = lines
    ? lines.reduce(
        (sum: number, line: { quantity: number; unitCost: number }) =>
          sum + line.quantity * line.unitCost,
        0
      )
    : undefined;

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(supplierId !== undefined && { supplierId }),
      ...(expectedDate !== undefined && {
        expectedDate: expectedDate ? new Date(expectedDate) : null,
      }),
      ...(notes !== undefined && { notes }),
      ...(totalAmount !== undefined && { totalAmount }),
      ...(lines && {
        lines: {
          deleteMany: {},
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
      }),
    },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, fullName: true } },
      lines: {
        include: { item: { select: { id: true, code: true, name: true, uom: true } } },
      },
    },
  });

  return apiSuccess(po);
}
