import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";
import { UpdateRecipeSchema, parseBody } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "recipes:read"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const recipe = await prisma.recipe.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        category: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true } },
          },
        },
      },
    });

    if (!recipe) return apiError("Recipe not found", 404);
    return apiSuccess(recipe);
  } catch (e) {
    console.error("GET /api/recipes/[id] error:", e);
    return apiError("Failed to fetch recipe", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "recipes:write"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = parseBody(UpdateRecipeSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const existing = await prisma.recipe.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) return apiError("Recipe not found", 404);

    const { lines, ...data } = parsed.data;

    // If code changed, check uniqueness
    if (data.code && data.code !== existing.code) {
      const dup = await prisma.recipe.findUnique({
        where: { tenantId_code: { tenantId: user.tenantId, code: data.code } },
      });
      if (dup) return apiError("Recipe code already exists");
    }

    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.yieldQty !== undefined) updateData.yieldQty = data.yieldQty;
    if (data.yieldUom !== undefined) updateData.yieldUom = data.yieldUom;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // If lines provided, delete old and recreate
    if (lines) {
      await prisma.recipeLine.deleteMany({ where: { recipeId: id } });
      updateData.lines = {
        create: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          notes: l.notes || null,
        })),
      };
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true } },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "recipe:update",
      entityType: "Recipe",
      entityId: recipe.id,
    });

    return apiSuccess(recipe);
  } catch (e) {
    console.error("PUT /api/recipes/[id] error:", e);
    return apiError("Failed to update recipe", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "recipes:delete"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const recipe = await prisma.recipe.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!recipe) return apiError("Recipe not found", 404);

    await prisma.recipe.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "recipe:deactivate",
      entityType: "Recipe",
      entityId: id,
    });

    return apiSuccess({ message: "Recipe deactivated" });
  } catch (e) {
    console.error("DELETE /api/recipes/[id] error:", e);
    return apiError("Failed to deactivate recipe", 500);
  }
}
