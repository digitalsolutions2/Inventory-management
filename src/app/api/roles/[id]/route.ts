import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, createAuditLog } from "@/lib/api-utils";
import { UpdateRoleSchema, parseBody } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:read")) return apiError("Forbidden", 403);

  const { id } = await params;
  const role = await prisma.role.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { _count: { select: { users: true } } },
  });

  if (!role) return apiError("Role not found", 404);
  return apiSuccess(role);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:write")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.role.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Role not found", 404);

  try {
    const body = await request.json();
    const parsed = parseBody(UpdateRoleSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { name, description, permissions } = parsed.data;

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(permissions !== undefined && { permissions }),
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "role:update",
      entityType: "role",
      entityId: role.id,
      beforeData: { name: existing.name, permissions: existing.permissions },
      afterData: { name: role.name, permissions: role.permissions },
    });

    return apiSuccess(role);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Role name already exists");
    }
    console.error("PUT /api/roles error:", e);
    return apiError("Failed to update role", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:delete")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.role.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) return apiError("Role not found", 404);

  if (existing._count.users > 0) {
    return apiError("Cannot delete role with assigned users", 400);
  }

  await prisma.role.delete({ where: { id } });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "role:delete",
    entityType: "role",
    entityId: id,
    beforeData: { name: existing.name },
  });

  return apiSuccess({ message: "Role deleted" });
}
