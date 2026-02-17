import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:edit")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.category.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Category not found", 404);

  const body = await request.json();
  const { name, description, parentId, isActive } = body;

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return apiSuccess(category);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:delete")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.category.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Category not found", 404);

  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  return apiSuccess({ message: "Category deactivated" });
}
