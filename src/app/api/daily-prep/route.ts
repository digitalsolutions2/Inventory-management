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
import { CreatePrepOrderSchema, parseBody } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "store:daily_prep"))
    return apiError("Forbidden", 403);

  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize } = sanitizePagination(
      searchParams.get("page"),
      searchParams.get("pageSize")
    );
    const locationId = searchParams.get("locationId") || user.locationId;

    const where = {
      tenantId: user.tenantId,
      ...(locationId && { locationId }),
    };

    const [orders, total] = await Promise.all([
      prisma.dailyPrepOrder.findMany({
        where,
        include: {
          location: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
          transfer: {
            select: { id: true, transferNumber: true, status: true },
          },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dailyPrepOrder.count({ where }),
    ]);

    return apiSuccess({
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("GET /api/daily-prep error:", e);
    return apiError("Failed to fetch prep orders", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "store:daily_prep"))
    return apiError("Forbidden", 403);
  if (!user.locationId)
    return apiError("You must be assigned to a location to create prep orders");

  try {
    const body = await request.json();
    const parsed = parseBody(CreatePrepOrderSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { prepDate, lines, notes } = parsed.data;

    // Fetch all recipes with their ingredients
    const recipeIds = lines.map((l) => l.recipeId);
    const recipes = await prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
        tenantId: user.tenantId,
        isActive: true,
      },
      include: {
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true } },
          },
        },
      },
    });

    if (recipes.length !== recipeIds.length) {
      return apiError("One or more recipes not found or inactive");
    }

    // Calculate aggregated raw materials
    const materialMap = new Map<
      string,
      { itemId: string; quantity: number }
    >();

    for (const line of lines) {
      const recipe = recipes.find((r) => r.id === line.recipeId)!;
      for (const ingredient of recipe.lines) {
        const qty = ingredient.quantity * line.quantity;
        const existing = materialMap.get(ingredient.itemId);
        if (existing) {
          existing.quantity += qty;
        } else {
          materialMap.set(ingredient.itemId, {
            itemId: ingredient.itemId,
            quantity: qty,
          });
        }
      }
    }

    const materials = Array.from(materialMap.values());
    if (materials.length === 0) {
      return apiError("Recipes have no ingredients");
    }

    // Find warehouse location (first WAREHOUSE type or tenant settings default)
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    let warehouseId = settings?.foodicsDefaultLocationId;
    if (!warehouseId) {
      const warehouse = await prisma.location.findFirst({
        where: {
          tenantId: user.tenantId,
          type: "WAREHOUSE",
          isActive: true,
        },
      });
      if (!warehouse) return apiError("No warehouse location found");
      warehouseId = warehouse.id;
    }

    // Generate order number
    const count = await prisma.dailyPrepOrder.count({
      where: { tenantId: user.tenantId },
    });
    const orderNumber = `PREP-${String(count + 1).padStart(5, "0")}`;

    // Generate transfer number
    const transferCount = await prisma.transfer.count({
      where: { tenantId: user.tenantId },
    });
    const transferNumber = `TRF-${String(transferCount + 1).padStart(5, "0")}`;

    // Create prep order + transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transfer (warehouse → store), always PENDING
      const transfer = await tx.transfer.create({
        data: {
          tenantId: user.tenantId,
          transferNumber,
          fromLocationId: warehouseId!,
          toLocationId: user.locationId!,
          status: "PENDING",
          notes: `Auto-generated from daily prep order ${orderNumber}`,
          createdById: user.id,
          lines: {
            create: materials.map((m) => ({
              itemId: m.itemId,
              quantity: m.quantity,
            })),
          },
        },
      });

      // Create the prep order
      const prepOrder = await tx.dailyPrepOrder.create({
        data: {
          tenantId: user.tenantId,
          orderNumber,
          locationId: user.locationId!,
          status: "SUBMITTED",
          prepDate: new Date(prepDate),
          notes: notes || null,
          createdById: user.id,
          transferId: transfer.id,
          lines: {
            create: lines.map((l) => ({
              recipeId: l.recipeId,
              quantity: l.quantity,
              notes: l.notes || null,
            })),
          },
        },
        include: {
          location: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
          transfer: {
            select: { id: true, transferNumber: true, status: true },
          },
          lines: {
            include: {
              recipe: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      return prepOrder;
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "prep_order:create",
      entityType: "DailyPrepOrder",
      entityId: result.id,
      afterData: {
        orderNumber,
        transferNumber,
        recipeCount: lines.length,
        materialCount: materials.length,
      },
    });

    return apiSuccess(result, 201);
  } catch (e) {
    console.error("POST /api/daily-prep error:", e);
    return apiError("Failed to create prep order", 500);
  }
}
