import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:approve")) return apiError("Forbidden", 403);

  const { id } = await params;
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!po) return apiError("Purchase order not found", 404);
  if (po.status !== "PENDING_APPROVAL")
    return apiError("Only pending POs can be approved/rejected");
  if (po.createdById === user.id)
    return apiError("You cannot approve your own purchase order");

  const body = await request.json().catch(() => ({}));
  const action = body.action || "approve"; // "approve" or "reject"

  if (action === "reject") {
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "CANCELLED",
        approvedById: user.id,
        approvedAt: new Date(),
        notes: po.notes
          ? `${po.notes}\n[Rejected: ${body.reason || "No reason provided"}]`
          : `[Rejected: ${body.reason || "No reason provided"}]`,
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    });
    return apiSuccess(updated);
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
    },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  return apiSuccess(updated);
}
