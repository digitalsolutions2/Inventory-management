import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const item = await prisma.item.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!item) return apiError("Item not found", 404);
  return apiSuccess(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:edit")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.item.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Item not found", 404);

  const body = await request.json();
  const { name, description, categoryId, uom, minStock, maxStock, reorderPoint, isActive } = body;

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(uom !== undefined && { uom }),
      ...(minStock !== undefined && { minStock }),
      ...(maxStock !== undefined && { maxStock }),
      ...(reorderPoint !== undefined && { reorderPoint }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return apiSuccess(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:delete")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.item.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Item not found", 404);

  // Soft delete
  await prisma.item.update({
    where: { id },
    data: { isActive: false },
  });

  return apiSuccess({ message: "Item deactivated" });
}
