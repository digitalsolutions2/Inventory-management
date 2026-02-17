import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const status = searchParams.get("status"); // "active" | "inactive" | null (all)

  const where = {
    tenantId: user.tenantId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(status === "active" && { isActive: true }),
    ...(status === "inactive" && { isActive: false }),
  };

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.item.count({ where }),
  ]);

  return apiSuccess({
    data: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:create")) return apiError("Forbidden", 403);

  const body = await request.json();
  const { code, name, description, categoryId, uom, minStock, maxStock, reorderPoint } = body;

  if (!code || !name) return apiError("Code and name are required");

  try {
    const item = await prisma.item.create({
      data: {
        tenantId: user.tenantId,
        code: code.toUpperCase(),
        name,
        description,
        categoryId: categoryId || null,
        uom: uom || "EA",
        minStock: minStock || 0,
        maxStock: maxStock || 0,
        reorderPoint: reorderPoint || 0,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return apiSuccess(item, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Item code already exists");
    }
    throw e;
  }
}
