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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "transfers:approve"))
    return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action || "approve";

  const transfer = await prisma.transfer.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!transfer) return apiError("Transfer not found", 404);
  if (transfer.status !== "PENDING")
    return apiError("Transfer must be in Pending status for approval");

  // Cannot approve own transfer
  if (transfer.createdById === user.id) {
    return apiError("You cannot approve a transfer you created");
  }

  if (action === "reject") {
    const updated = await prisma.transfer.update({
      where: { id },
      data: {
        status: "CANCELLED",
        approvedById: user.id,
        approvedAt: new Date(),
        notes: transfer.notes
          ? `${transfer.notes}\n\nRejected: ${body.reason || "No reason provided"}`
          : `Rejected: ${body.reason || "No reason provided"}`,
      },
      include: {
        fromLocation: { select: { id: true, code: true, name: true } },
        toLocation: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "transfer:reject",
      entityType: "Transfer",
      entityId: id,
      beforeData: { status: "PENDING" },
      afterData: { status: "CANCELLED", reason: body.reason },
    });

    return apiSuccess(updated);
  }

  const updated = await prisma.transfer.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
    },
    include: {
      fromLocation: { select: { id: true, code: true, name: true } },
      toLocation: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "transfer:approve",
    entityType: "Transfer",
    entityId: id,
    beforeData: { status: "PENDING" },
    afterData: { status: "APPROVED" },
  });

  return apiSuccess(updated);
}
