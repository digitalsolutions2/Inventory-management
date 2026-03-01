import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, sanitizePagination, createAuditLog } from "@/lib/api-utils";
import { CreateRoleSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:read")) return apiError("Forbidden", 403);

  try {
    const { searchParams } = request.nextUrl;
    const all = searchParams.get("all") === "true";
    const search = searchParams.get("search") || "";

    const where = {
      tenantId: user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    if (all) {
      const roles = await prisma.role.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { name: "asc" },
        include: { _count: { select: { users: true } } },
      });
      return apiSuccess(roles);
    }

    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { users: true } } },
      }),
      prisma.role.count({ where }),
    ]);

    return apiSuccess({
      data: roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/roles error:", e);
    return apiError("Failed to fetch roles", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:write")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateRoleSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { name, description, permissions } = parsed.data;

    const role = await prisma.role.create({
      data: {
        tenantId: user.tenantId,
        name,
        description: description || null,
        permissions,
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "role:create",
      entityType: "role",
      entityId: role.id,
      afterData: { name, permissions },
    });

    return apiSuccess(role, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Role name already exists");
    }
    console.error("POST /api/roles error:", e);
    return apiError("Failed to create role", 500);
  }
}
