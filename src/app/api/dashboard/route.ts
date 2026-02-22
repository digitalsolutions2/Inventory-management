import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const tenantId = user.tenantId;
    const now = new Date();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Run all queries in parallel
    const [
      inventoryItems,
      pendingPOs,
      pendingTransfers,
      pendingRequests,
      lowStockItems,
      outstandingPayments,
      recentActivity,
      recentTransactions,
      posByStatus,
      overduePayments,
      topItemsByValue,
      supplierSpend,
    ] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { tenantId },
        select: { quantity: true, avgCost: true },
      }),
      prisma.purchaseOrder.count({
        where: { tenantId, status: "PENDING_APPROVAL" },
      }),
      prisma.transfer.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.internalRequest.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.inventoryItem.findMany({
        where: { tenantId },
        include: {
          item: {
            select: {
              id: true,
              code: true,
              name: true,
              uom: true,
              reorderPoint: true,
              minStock: true,
            },
          },
          location: { select: { id: true, name: true } },
        },
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.auditLog.findMany({
        where: { tenantId },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.inventoryTransaction.findMany({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        include: {
          item: { select: { code: true, name: true } },
          location: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.purchaseOrder.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.payment.findMany({
        where: {
          tenantId,
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { lt: now },
        },
        include: {
          purchaseOrder: {
            select: {
              poNumber: true,
              supplier: { select: { name: true } },
            },
          },
        },
        take: 5,
      }),
      prisma.inventoryItem.findMany({
        where: { tenantId, quantity: { gt: 0 } },
        include: {
          item: { select: { code: true, name: true } },
        },
        orderBy: { quantity: "desc" },
        take: 10,
      }),
      prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          status: {
            in: [
              "APPROVED",
              "SENT",
              "PARTIALLY_RECEIVED",
              "RECEIVED",
            ],
          },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          totalAmount: true,
          supplier: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Calculate KPIs
    const totalInventoryValue = inventoryItems.reduce(
      (s, i) => s + i.quantity * i.avgCost,
      0
    );

    const lowStock = lowStockItems.filter(
      (inv) =>
        inv.quantity <= inv.item.reorderPoint &&
        inv.item.reorderPoint > 0
    );

    // Aggregate supplier spend
    const supplierSpendMap: Record<
      string,
      { name: string; total: number }
    > = {};
    for (const po of supplierSpend) {
      const sid = po.supplier.id;
      if (!supplierSpendMap[sid]) {
        supplierSpendMap[sid] = { name: po.supplier.name, total: 0 };
      }
      supplierSpendMap[sid].total += po.totalAmount;
    }

    // Top items by value
    const topItems = topItemsByValue
      .map((inv) => ({
        name: inv.item.name,
        code: inv.item.code,
        value: inv.quantity * inv.avgCost,
        quantity: inv.quantity,
      }))
      .sort((a, b) => b.value - a.value);

    return apiSuccess({
      kpis: {
        totalInventoryValue,
        pendingApprovals: pendingPOs + pendingTransfers,
        pendingPOs,
        pendingTransfers,
        pendingRequests,
        lowStockCount: lowStock.length,
        outstandingPayables: outstandingPayments._sum.amount || 0,
        outstandingPaymentCount: outstandingPayments._count || 0,
      },
      charts: {
        posByStatus: posByStatus.map((g) => ({
          status: g.status,
          count: g._count,
          total: g._sum.totalAmount || 0,
        })),
        topItemsByValue: topItems,
        supplierSpend: Object.entries(supplierSpendMap)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10),
      },
      alerts: {
        lowStock: lowStock.slice(0, 10).map((inv) => ({
          itemCode: inv.item.code,
          itemName: inv.item.name,
          location: inv.location.name,
          quantity: inv.quantity,
          reorderPoint: inv.item.reorderPoint,
          minStock: inv.item.minStock,
        })),
        overduePayments: overduePayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          dueDate: p.dueDate,
          poNumber: p.purchaseOrder.poNumber,
          supplier: p.purchaseOrder.supplier.name,
        })),
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: log.user?.fullName || "System",
        createdAt: log.createdAt,
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        item: tx.item.name,
        itemCode: tx.item.code,
        location: tx.location.name,
        quantity: tx.quantity,
        createdAt: tx.createdAt,
      })),
    });
  } catch (e) {
    console.error("GET /api/dashboard error:", e);
    return apiError("Failed to load dashboard data", 500);
  }
}
