import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, sanitizePagination } from "@/lib/api-utils";
import { CreateItemSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status");

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
  } catch (e) {
    console.error("GET /api/items error:", e);
    return apiError("Failed to fetch items", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:create")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateItemSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { code, name, description, categoryId, uom, minStock, maxStock, reorderPoint } = parsed.data;

    const item = await prisma.item.create({
      data: {
        tenantId: user.tenantId,
        code: code.toUpperCase(),
        name,
        description,
        categoryId: categoryId || null,
        uom,
        minStock,
        maxStock,
        reorderPoint,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return apiSuccess(item, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Item code already exists");
    }
    console.error("POST /api/items error:", e);
    return apiError("Failed to create item", 500);
  }
}
