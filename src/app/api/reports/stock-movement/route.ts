import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all items with their inventory
  const allItems = await prisma.item.findMany({
    where: { tenantId: user.tenantId, isActive: true },
    select: { id: true, code: true, name: true, uom: true },
  });

  // Get transactions in the period
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { tenantId: user.tenantId, createdAt: { gte: since } },
    select: { itemId: true, type: true, quantity: true },
  });

  // Aggregate by item
  const itemMovement: Record<
    string,
    { inbound: number; outbound: number; transferIn: number; transferOut: number; txCount: number }
  > = {};

  for (const tx of transactions) {
    if (!itemMovement[tx.itemId]) {
      itemMovement[tx.itemId] = { inbound: 0, outbound: 0, transferIn: 0, transferOut: 0, txCount: 0 };
    }
    itemMovement[tx.itemId].txCount += 1;
    switch (tx.type) {
      case "INBOUND":
        itemMovement[tx.itemId].inbound += tx.quantity;
        break;
      case "OUTBOUND":
        itemMovement[tx.itemId].outbound += tx.quantity;
        break;
      case "TRANSFER_IN":
        itemMovement[tx.itemId].transferIn += tx.quantity;
        break;
      case "TRANSFER_OUT":
        itemMovement[tx.itemId].transferOut += tx.quantity;
        break;
    }
  }

  // Build rows
  const rows = allItems.map((item) => {
    const mov = itemMovement[item.id] || {
      inbound: 0, outbound: 0, transferIn: 0, transferOut: 0, txCount: 0,
    };
    const totalMovement = mov.inbound + mov.outbound + mov.transferIn + mov.transferOut;
    const avgDailyConsumption = mov.outbound / days;
    const turnoverRatio = days > 0 ? (mov.outbound / Math.max(1, days)) * 30 : 0;

    return {
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      uom: item.uom,
      inbound: mov.inbound,
      outbound: mov.outbound,
      transferIn: mov.transferIn,
      transferOut: mov.transferOut,
      totalMovement,
      txCount: mov.txCount,
      avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
    };
  });

  // Sort: slow-moving first (least total movement)
  const slowMoving = [...rows].sort((a, b) => a.totalMovement - b.totalMovement);
  // Fast-moving (most outbound)
  const fastMoving = [...rows].sort((a, b) => b.outbound - a.outbound);

  return apiSuccess({
    period: `Last ${days} days`,
    rows,
    slowMoving: slowMoving.filter((r) => r.totalMovement === 0).slice(0, 20),
    fastMoving: fastMoving.filter((r) => r.outbound > 0).slice(0, 20),
  });
}
