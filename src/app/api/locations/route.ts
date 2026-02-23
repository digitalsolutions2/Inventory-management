import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, sanitizePagination } from "@/lib/api-utils";
import { CreateLocationSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const tree = request.nextUrl.searchParams.get("tree") === "true";

    if (tree) {
      const locations = await prisma.location.findMany({
        where: { tenantId: user.tenantId, isActive: true },
        orderBy: { name: "asc" },
      });
      return apiSuccess(locations);
    }

    const { searchParams } = request.nextUrl;
    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );
    const search = searchParams.get("search") || "";

    const where = {
      tenantId: user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: { parent: { select: { id: true, name: true, code: true } } },
        orderBy: { code: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.location.count({ where }),
    ]);

    return apiSuccess({
      data: locations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/locations error:", e);
    return apiError("Failed to fetch locations", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "location:create")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateLocationSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { code, name, type, parentId } = parsed.data;

    const location = await prisma.location.create({
      data: {
        tenantId: user.tenantId,
        code: code.toUpperCase(),
        name,
        type,
        parentId: parentId || null,
      },
      include: { parent: { select: { id: true, name: true, code: true } } },
    });
    return apiSuccess(location, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Location code already exists");
    }
    console.error("POST /api/locations error:", e);
    return apiError("Failed to create location", 500);
  }
}
