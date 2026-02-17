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
  const all = searchParams.get("all") === "true";

  const where = {
    tenantId: user.tenantId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  if (all) {
    const suppliers = await prisma.supplier.findMany({
      where: { ...where, isActive: true },
      orderBy: { name: "asc" },
    });
    return apiSuccess(suppliers);
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return apiSuccess({
    data: suppliers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "supplier:create")) return apiError("Forbidden", 403);

  const body = await request.json();
  const { code, name, contactName, email, phone, address, paymentTerms, rating } = body;

  if (!code || !name) return apiError("Code and name are required");

  try {
    const supplier = await prisma.supplier.create({
      data: {
        tenantId: user.tenantId,
        code: code.toUpperCase(),
        name,
        contactName,
        email,
        phone,
        address,
        paymentTerms: paymentTerms || 30,
        rating: rating || 0,
      },
    });
    return apiSuccess(supplier, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Supplier code already exists");
    }
    throw e;
  }
}
