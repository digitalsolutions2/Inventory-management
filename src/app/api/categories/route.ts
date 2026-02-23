import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";
import { CreateCategorySchema, parseBody } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { name: "asc" },
    });

    return apiSuccess(categories);
  } catch (e) {
    console.error("GET /api/categories error:", e);
    return apiError("Failed to fetch categories", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:create")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateCategorySchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { name, description, parentId } = parsed.data;

    const category = await prisma.category.create({
      data: {
        tenantId: user.tenantId,
        name,
        description,
        parentId: parentId || null,
      },
    });
    return apiSuccess(category, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Category name already exists");
    }
    console.error("POST /api/categories error:", e);
    return apiError("Failed to create category", 500);
  }
}
