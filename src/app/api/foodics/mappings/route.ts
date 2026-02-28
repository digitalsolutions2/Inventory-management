import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";
import { FoodicsItemMappingSchema, parseBody } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "foodics:settings"))
    return apiError("Forbidden", 403);

  const mappings = await prisma.foodicsItemMapping.findMany({
    where: { tenantId: user.tenantId },
    include: {
      item: { select: { id: true, code: true, name: true, uom: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(mappings);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "foodics:settings"))
    return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(FoodicsItemMappingSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { foodicsProductId, foodicsProductName, itemId, quantityPerSale } =
      parsed.data;

    // Validate item exists
    const item = await prisma.item.findFirst({
      where: { id: itemId, tenantId: user.tenantId, isActive: true },
    });
    if (!item) return apiError("Item not found or inactive", 404);

    const mapping = await prisma.foodicsItemMapping.create({
      data: {
        tenantId: user.tenantId,
        foodicsProductId,
        foodicsProductName,
        itemId,
        quantityPerSale,
      },
      include: {
        item: { select: { id: true, code: true, name: true, uom: true } },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "foodics:mapping_create",
      entityType: "FoodicsItemMapping",
      entityId: mapping.id,
      afterData: { foodicsProductId, foodicsProductName, itemId, quantityPerSale },
    });

    return apiSuccess(mapping);
  } catch (err: unknown) {
    // Handle unique constraint violation (already mapped)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return apiError("This Foodics product is already mapped");
    }
    console.error("Foodics mapping create error:", err);
    return apiError("Failed to create mapping");
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "foodics:settings"))
    return apiError("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return apiError("Missing mapping id");

  try {
    const mapping = await prisma.foodicsItemMapping.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!mapping) return apiError("Mapping not found", 404);

    await prisma.foodicsItemMapping.delete({ where: { id } });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "foodics:mapping_delete",
      entityType: "FoodicsItemMapping",
      entityId: id,
      beforeData: mapping,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error("Foodics mapping delete error:", err);
    return apiError("Failed to delete mapping");
  }
}
