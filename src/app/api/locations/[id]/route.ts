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
  const location = await prisma.location.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      parent: { select: { id: true, name: true, code: true } },
      children: { where: { isActive: true }, orderBy: { code: "asc" } },
    },
  });

  if (!location) return apiError("Location not found", 404);
  return apiSuccess(location);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "location:edit")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.location.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Location not found", 404);

  const body = await request.json();
  const { name, type, parentId, isActive } = body;

  if (parentId === id) return apiError("Location cannot be its own parent");

  const location = await prisma.location.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { parent: { select: { id: true, name: true, code: true } } },
  });

  return apiSuccess(location);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "location:delete")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.location.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Location not found", 404);

  await prisma.location.update({
    where: { id },
    data: { isActive: false },
  });

  return apiSuccess({ message: "Location deactivated" });
}
