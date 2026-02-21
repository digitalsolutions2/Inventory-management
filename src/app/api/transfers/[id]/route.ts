import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const transfer = await prisma.transfer.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      fromLocation: { select: { id: true, code: true, name: true, type: true } },
      toLocation: { select: { id: true, code: true, name: true, type: true } },
      createdBy: { select: { id: true, fullName: true, email: true } },
      approvedBy: { select: { id: true, fullName: true, email: true } },
      fulfilledBy: { select: { id: true, fullName: true, email: true } },
      receivedBy: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, name: true, uom: true } },
        },
      },
    },
  });

  if (!transfer) return apiError("Transfer not found", 404);
  return apiSuccess(transfer);
}
