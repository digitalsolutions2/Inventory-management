import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const period = searchParams.get("period") || "30"; // days
  const daysAgo = parseInt(period);
  const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      tenantId: user.tenantId,
      createdAt: { gte: since },
    },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      lines: { include: { item: { select: { categoryId: true, category: { select: { name: true } } } } } },
    },
  });

  // By supplier
  const bySupplier: Record<string, { name: string; orderCount: number; totalSpend: number }> = {};
  for (const po of orders) {
    const sid = po.supplier.id;
    if (!bySupplier[sid]) {
      bySupplier[sid] = { name: po.supplier.name, orderCount: 0, totalSpend: 0 };
    }
    bySupplier[sid].orderCount += 1;
    bySupplier[sid].totalSpend += po.totalAmount;
  }

  // By status
  const byStatus: Record<string, { count: number; total: number }> = {};
  for (const po of orders) {
    if (!byStatus[po.status]) byStatus[po.status] = { count: 0, total: 0 };
    byStatus[po.status].count += 1;
    byStatus[po.status].total += po.totalAmount;
  }

  // By category
  const byCategory: Record<string, { name: string; total: number }> = {};
  for (const po of orders) {
    for (const line of po.lines) {
      const catName = line.item.category?.name || "Uncategorized";
      const catId = line.item.categoryId || "uncategorized";
      if (!byCategory[catId]) byCategory[catId] = { name: catName, total: 0 };
      byCategory[catId].total += line.totalCost;
    }
  }

  const totalSpend = orders.reduce((s, po) => s + po.totalAmount, 0);

  return apiSuccess({
    period: `Last ${daysAgo} days`,
    totalOrders: orders.length,
    totalSpend,
    avgOrderValue: orders.length > 0 ? totalSpend / orders.length : 0,
    bySupplier: Object.entries(bySupplier)
      .map(([id, data]) => ({ id, ...data, avgOrder: data.totalSpend / data.orderCount }))
      .sort((a, b) => b.totalSpend - a.totalSpend),
    byStatus: Object.entries(byStatus).map(([status, data]) => ({ status, ...data })),
    byCategory: Object.entries(byCategory)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total),
  });
}
