import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, createAuditLog } from "@/lib/api-utils";
import { UpdateUserSchema, parseBody } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:read")) return apiError("Forbidden", 403);

  const { id } = await params;
  const dbUser = await prisma.user.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      role: { include: { role: { select: { id: true, name: true } } } },
      location: { select: { id: true, name: true, type: true } },
    },
  });

  if (!dbUser) return apiError("User not found", 404);

  return apiSuccess({
    id: dbUser.id,
    fullName: dbUser.fullName,
    email: dbUser.email,
    isActive: dbUser.isActive,
    createdAt: dbUser.createdAt,
    roleId: dbUser.role?.role.id || null,
    roleName: dbUser.role?.role.name || null,
    locationId: dbUser.locationId || null,
    locationName: dbUser.location?.name || null,
    locationType: dbUser.location?.type || null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:write")) return apiError("Forbidden", 403);

  const { id } = await params;

  // Prevent self-deactivation
  const body = await request.json();
  if (id === user.id && body.isActive === false) {
    return apiError("You cannot deactivate your own account", 400);
  }

  const existing = await prisma.user.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { role: { include: { role: { select: { id: true, name: true } } } } },
  });
  if (!existing) return apiError("User not found", 404);

  const parsed = parseBody(UpdateUserSchema, body);
  if (!parsed.success) return apiError(parsed.error);

  const { fullName, roleId, isActive, locationId } = parsed.data;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(isActive !== undefined && { isActive }),
      ...(locationId !== undefined && { locationId: locationId || null }),
    },
  });

  // Upsert UserRole if roleId changed
  if (roleId !== undefined) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId: user.tenantId },
    });
    if (!role) return apiError("Role not found", 400);

    await prisma.userRole.upsert({
      where: { userId: id },
      create: { userId: id, roleId },
      update: { roleId },
    });
  }

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "user:update",
    entityType: "user",
    entityId: id,
    beforeData: {
      fullName: existing.fullName,
      isActive: existing.isActive,
      roleName: existing.role?.role.name,
    },
    afterData: {
      fullName: fullName ?? existing.fullName,
      isActive: isActive ?? existing.isActive,
      roleId,
    },
  });

  return apiSuccess(updatedUser);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:delete")) return apiError("Forbidden", 403);

  const { id } = await params;

  // Prevent self-deactivation
  if (id === user.id) {
    return apiError("You cannot deactivate your own account", 400);
  }

  const existing = await prisma.user.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("User not found", 404);

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "user:deactivate",
    entityType: "user",
    entityId: id,
    beforeData: { fullName: existing.fullName, isActive: true },
    afterData: { isActive: false },
  });

  return apiSuccess({ message: "User deactivated" });
}
