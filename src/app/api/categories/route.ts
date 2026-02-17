import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const categories = await prisma.category.findMany({
    where: { tenantId: user.tenantId, isActive: true },
    include: { children: { where: { isActive: true } } },
    orderBy: { name: "asc" },
  });

  return apiSuccess(categories);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "item:create")) return apiError("Forbidden", 403);

  const body = await request.json();
  const { name, description, parentId } = body;

  if (!name) return apiError("Name is required");

  try {
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
    throw e;
  }
}
