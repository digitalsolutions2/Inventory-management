import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:edit")) return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!po) return apiError("Purchase order not found", 404);
    if (po.status !== "APPROVED")
      return apiError("Only approved POs can be marked as sent");

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "SENT" },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "po:send",
      entityType: "PurchaseOrder",
      entityId: id,
      beforeData: { status: "APPROVED" },
      afterData: { status: "SENT" },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("POST /api/purchase-orders/[id]/send error:", e);
    return apiError("Failed to mark PO as sent", 500);
  }
}
