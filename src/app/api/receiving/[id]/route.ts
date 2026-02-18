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
  const receiving = await prisma.receiving.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      purchaseOrder: {
        include: {
          supplier: true,
          createdBy: { select: { id: true, fullName: true, email: true } },
          lines: {
            include: {
              item: { select: { id: true, code: true, name: true, uom: true } },
            },
          },
        },
      },
      location: { select: { id: true, name: true, code: true, type: true } },
      procVerifiedBy: { select: { id: true, fullName: true, email: true } },
      qcInspectedBy: { select: { id: true, fullName: true, email: true } },
      warehouseReceivedBy: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, name: true, uom: true } },
        },
      },
    },
  });

  if (!receiving) return apiError("Receiving record not found", 404);
  return apiSuccess(receiving);
}
