import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError, sanitizePagination } from "@/lib/api-utils";
import { CreateSupplierSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { searchParams } = request.nextUrl;
    const all = searchParams.get("all") === "true";
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

    if (all) {
      const suppliers = await prisma.supplier.findMany({
        where: { ...where, isActive: true },
        orderBy: { name: "asc" },
      });
      return apiSuccess(suppliers);
    }

    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );

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
  } catch (e) {
    console.error("GET /api/suppliers error:", e);
    return apiError("Failed to fetch suppliers", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "supplier:create")) return apiError("Forbidden", 403);

  try {
    const body = await request.json();
    const parsed = parseBody(CreateSupplierSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { code, name, contactName, email, phone, address, paymentTerms, rating } = parsed.data;

    const supplier = await prisma.supplier.create({
      data: {
        tenantId: user.tenantId,
        code: code.toUpperCase(),
        name,
        contactName,
        email,
        phone,
        address,
        paymentTerms,
        rating: rating || 0,
      },
    });
    return apiSuccess(supplier, 201);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return apiError("Supplier code already exists");
    }
    console.error("POST /api/suppliers error:", e);
    return apiError("Failed to create supplier", 500);
  }
}
