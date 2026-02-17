import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const tree = request.nextUrl.searchParams.get("tree") === "true";

  if (tree) {
    // Return flat list — client builds tree
    const locations = await prisma.location.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
    return apiSuccess(locations);
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
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
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "location:create")) return apiError("Forbidden", 403);

  const body = await request.json();
  const { code, name, type, parentId } = body;

  if (!code || !name || !type) return apiError("Code, name and type are required");

  try {
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
    throw e;
  }
}
