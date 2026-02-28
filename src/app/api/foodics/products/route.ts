import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
} from "@/lib/api-utils";
import { fetchFoodicsProducts } from "@/lib/foodics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "foodics:settings"))
    return apiError("Forbidden", 403);

  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!settings?.foodicsApiToken) {
      return apiError("Foodics API token not configured. Please set it in Settings first.");
    }

    const products = await fetchFoodicsProducts(settings.foodicsApiToken);
    return apiSuccess(products);
  } catch (err) {
    console.error("Foodics products fetch error:", err);
    return apiError(err instanceof Error ? err.message : "Failed to fetch products");
  }
}
