import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Foodics order status 4 = completed
const FOODICS_COMPLETED_STATUS = 4;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ ok: true, message: "Missing tenantId" }, { status: 200 });
    }

    const payload = await request.json();
    const order = payload?.data || payload;
    const foodicsOrderId = order?.id || order?.reference;
    const eventType = payload?.event || "order.created";
    const orderStatus = order?.status;

    if (!foodicsOrderId) {
      return NextResponse.json({ ok: true, message: "No order ID" }, { status: 200 });
    }

    // Idempotency check
    const existing = await prisma.foodicsWebhookLog.findUnique({
      where: { tenantId_foodicsOrderId: { tenantId, foodicsOrderId: String(foodicsOrderId) } },
    });
    if (existing) {
      return NextResponse.json({ ok: true, message: "Already processed" }, { status: 200 });
    }

    // Only process completed orders
    if (orderStatus !== FOODICS_COMPLETED_STATUS) {
      await prisma.foodicsWebhookLog.create({
        data: {
          tenantId,
          foodicsOrderId: String(foodicsOrderId),
          eventType,
          status: "skipped",
          payload: payload as never,
          errorMessage: `Order status ${orderStatus} is not completed (${FOODICS_COMPLETED_STATUS})`,
        },
      });
      return NextResponse.json({ ok: true, message: "Skipped (not completed)" }, { status: 200 });
    }

    // Get tenant settings for default location
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.foodicsDefaultLocationId) {
      await prisma.foodicsWebhookLog.create({
        data: {
          tenantId,
          foodicsOrderId: String(foodicsOrderId),
          eventType,
          status: "failed",
          payload: payload as never,
          errorMessage: "No default location configured",
        },
      });
      return NextResponse.json({ ok: true, message: "No location configured" }, { status: 200 });
    }

    const locationId = settings.foodicsDefaultLocationId;
    const orderProducts = order?.products || order?.items || [];

    let itemsDeducted = 0;
    const errors: string[] = [];

    // Process in a transaction
    await prisma.$transaction(async (tx) => {
      for (const product of orderProducts) {
        const foodicsProductId = product?.product_id || product?.id;
        if (!foodicsProductId) continue;

        const orderLineQty = product?.quantity || 1;

        // Look up mapping
        const mapping = await tx.foodicsItemMapping.findUnique({
          where: {
            tenantId_foodicsProductId: {
              tenantId,
              foodicsProductId: String(foodicsProductId),
            },
          },
        });

        if (!mapping || !mapping.isActive) {
          errors.push(`Unmapped product: ${foodicsProductId}`);
          continue;
        }

        const deductQty = orderLineQty * mapping.quantityPerSale;
        if (deductQty <= 0) continue;

        // Atomic deduction with guard against going negative
        const result = await tx.inventoryItem.updateMany({
          where: {
            tenantId,
            itemId: mapping.itemId,
            locationId,
            quantity: { gte: deductQty },
          },
          data: { quantity: { decrement: deductQty } },
        });

        if (result.count === 0) {
          errors.push(`Insufficient stock for item ${mapping.itemId} (need ${deductQty})`);
          continue;
        }

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            itemId: mapping.itemId,
            locationId,
            type: "OUTBOUND",
            quantity: deductQty,
            referenceType: "FoodicsSale",
            referenceId: null,
            notes: `Foodics order ${foodicsOrderId}`,
          },
        });

        itemsDeducted++;
      }
    });

    // Log result
    await prisma.foodicsWebhookLog.create({
      data: {
        tenantId,
        foodicsOrderId: String(foodicsOrderId),
        eventType,
        status: errors.length > 0 && itemsDeducted === 0 ? "failed" : "processed",
        itemsDeducted,
        payload: payload as never,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    return NextResponse.json({ ok: true, itemsDeducted }, { status: 200 });
  } catch (err) {
    console.error("Foodics webhook error:", err);
    // Always return 200 to Foodics
    return NextResponse.json(
      { ok: true, message: "Internal error logged" },
      { status: 200 }
    );
  }
}
