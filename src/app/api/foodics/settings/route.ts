import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";
import { FoodicsSettingsSchema, parseBody } from "@/lib/validations";
import { testFoodicsConnection } from "@/lib/foodics";
import { NextRequest } from "next/server";

function maskToken(token: string | null | undefined): string | null {
  if (!token) return null;
  if (token.length <= 4) return "****";
  return "****" + token.slice(-4);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "foodics:settings"))
    return apiError("Forbidden", 403);

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: user.tenantId },
  });

  return apiSuccess({
    foodicsApiToken: maskToken(settings?.foodicsApiToken),
    foodicsDefaultLocationId: settings?.foodicsDefaultLocationId || null,
    isConnected: !!settings?.foodicsApiToken,
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "foodics:settings"))
    return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(FoodicsSettingsSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { foodicsApiToken, foodicsDefaultLocationId } = parsed.data;

    // If a new token is provided, test the connection first
    if (foodicsApiToken) {
      const testResult = await testFoodicsConnection(foodicsApiToken);
      if (!testResult.success) {
        return apiError(testResult.error);
      }
    }

    // Validate location if provided
    if (foodicsDefaultLocationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: foodicsDefaultLocationId,
          tenantId: user.tenantId,
          isActive: true,
        },
      });
      if (!location) return apiError("Location not found or inactive", 404);
    }

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        foodicsApiToken: foodicsApiToken || null,
        foodicsDefaultLocationId: foodicsDefaultLocationId || null,
      },
      update: {
        ...(foodicsApiToken !== undefined && { foodicsApiToken }),
        ...(foodicsDefaultLocationId !== undefined && {
          foodicsDefaultLocationId: foodicsDefaultLocationId || null,
        }),
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "foodics:settings_update",
      entityType: "TenantSettings",
      entityId: settings.id,
    });

    return apiSuccess({
      foodicsApiToken: maskToken(settings.foodicsApiToken),
      foodicsDefaultLocationId: settings.foodicsDefaultLocationId,
      isConnected: !!settings.foodicsApiToken,
    });
  } catch (err) {
    console.error("Foodics settings update error:", err);
    return apiError("Failed to update settings");
  }
}
