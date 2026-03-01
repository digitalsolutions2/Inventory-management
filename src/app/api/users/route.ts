import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, sanitizePagination, createAuditLog } from "@/lib/api-utils";
import { CreateUserSchema, parseBody } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:read")) return apiError("Forbidden", 403);

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const where = {
      tenantId: user.tenantId,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          role: { include: { role: { select: { id: true, name: true } } } },
          location: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      roleId: u.role?.role.id || null,
      roleName: u.role?.role.name || null,
      locationId: u.locationId || null,
      locationName: u.location?.name || null,
      locationType: u.location?.type || null,
    }));

    return apiSuccess({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/users error:", e);
    return apiError("Failed to fetch users", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "users:write")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateUserSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { fullName, email, password, roleId, locationId } = parsed.data;

    // Verify role belongs to same tenant
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId: user.tenantId },
    });
    if (!role) return apiError("Role not found", 400);

    // Step 1: Create Supabase auth user
    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        return apiError("Email already registered");
      }
      console.error("Supabase createUser error:", authError);
      return apiError("Failed to create auth user", 500);
    }

    let dbUser;
    try {
      // Step 2: Create DB user
      dbUser = await prisma.user.create({
        data: {
          supabaseId: authData.user.id,
          tenantId: user.tenantId,
          email,
          fullName,
          locationId: locationId || null,
        },
      });

      // Step 3: Create user role assignment
      await prisma.userRole.create({
        data: {
          userId: dbUser.id,
          roleId,
        },
      });
    } catch (dbError: unknown) {
      // Cleanup Supabase auth user on DB failure
      await admin.auth.admin.deleteUser(authData.user.id);

      if (dbError && typeof dbError === "object" && "code" in dbError && dbError.code === "P2002") {
        return apiError("Email already exists in this tenant");
      }
      throw dbError;
    }

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "user:create",
      entityType: "user",
      entityId: dbUser.id,
      afterData: { fullName, email, roleName: role.name },
    });

    return apiSuccess({ id: dbUser.id, fullName, email, roleName: role.name }, 201);
  } catch (e) {
    console.error("POST /api/users error:", e);
    return apiError("Failed to create user", 500);
  }
}
