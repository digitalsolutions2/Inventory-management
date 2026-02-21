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
  const req = await prisma.internalRequest.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      fulfilledBy: { select: { id: true, fullName: true, email: true } },
      confirmedBy: { select: { id: true, fullName: true, email: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, name: true, uom: true } },
        },
      },
    },
  });

  if (!req) return apiError("Request not found", 404);
  return apiSuccess(req);
}
