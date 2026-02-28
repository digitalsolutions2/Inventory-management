import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (
    !checkPermission(user, "foodics:settings") &&
    !checkPermission(user, "foodics:logs")
  )
    return apiError("Forbidden", 403);

  const logs = await prisma.foodicsWebhookLog.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { processedAt: "desc" },
    take: 100,
  });

  return apiSuccess(logs);
}
