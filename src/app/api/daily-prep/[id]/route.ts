import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "store:daily_prep"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const order = await prisma.dailyPrepOrder.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        location: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        transfer: {
          select: {
            id: true,
            transferNumber: true,
            status: true,
            fromLocation: { select: { id: true, name: true } },
            toLocation: { select: { id: true, name: true } },
            lines: {
              include: {
                item: {
                  select: { id: true, code: true, name: true, uom: true },
                },
              },
            },
          },
        },
        lines: {
          include: {
            recipe: {
              select: {
                id: true,
                code: true,
                name: true,
                yieldQty: true,
                yieldUom: true,
                lines: {
                  include: {
                    item: {
                      select: { id: true, code: true, name: true, uom: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return apiError("Prep order not found", 404);
    return apiSuccess(order);
  } catch (e) {
    console.error("GET /api/daily-prep/[id] error:", e);
    return apiError("Failed to fetch prep order", 500);
  }
}
