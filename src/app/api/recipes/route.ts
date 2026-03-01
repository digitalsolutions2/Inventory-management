import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
  sanitizePagination,
} from "@/lib/api-utils";
import { CreateRecipeSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "recipes:read"))
    return apiError("Forbidden", 403);

  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where = {
      tenantId: user.tenantId,
      ...(activeOnly && { isActive: true }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recipe.count({ where }),
    ]);

    return apiSuccess({
      data: recipes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/recipes error:", e);
    return apiError("Failed to fetch recipes", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "recipes:write"))
    return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateRecipeSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { code, name, description, categoryId, yieldQty, yieldUom, lines } =
      parsed.data;

    // Check unique code
    const existing = await prisma.recipe.findUnique({
      where: { tenantId_code: { tenantId: user.tenantId, code } },
    });
    if (existing) return apiError("Recipe code already exists");

    const recipe = await prisma.recipe.create({
      data: {
        tenantId: user.tenantId,
        code,
        name,
        description: description || null,
        categoryId: categoryId || null,
        yieldQty,
        yieldUom,
        lines: {
          create: lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            notes: l.notes || null,
          })),
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true } },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "recipe:create",
      entityType: "Recipe",
      entityId: recipe.id,
      afterData: { code, name },
    });

    return apiSuccess(recipe, 201);
  } catch (e) {
    console.error("POST /api/recipes error:", e);
    return apiError("Failed to create recipe", 500);
  }
}
