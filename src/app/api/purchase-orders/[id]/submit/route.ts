import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:create")) return apiError("Forbidden", 403);

  const { id } = await params;
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { lines: true },
  });

  if (!po) return apiError("Purchase order not found", 404);
  if (po.status !== "DRAFT") return apiError("Only draft POs can be submitted");
  if (po.lines.length === 0) return apiError("PO must have at least one line item");

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "PENDING_APPROVAL" },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  return apiSuccess(updated);
}
