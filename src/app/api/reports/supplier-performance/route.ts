import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: user.tenantId, isActive: true },
    select: { id: true, code: true, name: true, rating: true },
  });

  const results = await Promise.all(
    suppliers.map(async (supplier) => {
      // All POs for this supplier
      const pos = await prisma.purchaseOrder.findMany({
        where: { tenantId: user.tenantId, supplierId: supplier.id },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          expectedDate: true,
          createdAt: true,
        },
      });

      // Receivings for this supplier's POs
      const poIds = pos.map((p) => p.id);
      const receivings = await prisma.receiving.findMany({
        where: {
          tenantId: user.tenantId,
          purchaseOrderId: { in: poIds },
          status: "RECEIVED",
        },
        select: {
          warehouseReceivedAt: true,
          qcResult: true,
          purchaseOrderId: true,
          lines: { select: { acceptedQty: true, rejectedQty: true } },
        },
      });

      const totalPOs = pos.length;
      const totalSpend = pos.reduce((s, p) => s + p.totalAmount, 0);
      const receivedPOs = pos.filter((p) =>
        ["PARTIALLY_RECEIVED", "RECEIVED"].includes(p.status)
      ).length;

      // On-time delivery: received before expectedDate
      let onTimeCount = 0;
      let totalLeadTimeDays = 0;
      let leadTimeCount = 0;

      for (const rcv of receivings) {
        const po = pos.find((p) => p.id === rcv.purchaseOrderId);
        if (po && rcv.warehouseReceivedAt) {
          // Lead time
          const leadDays = Math.floor(
            (rcv.warehouseReceivedAt.getTime() - po.createdAt.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          totalLeadTimeDays += leadDays;
          leadTimeCount += 1;

          // On-time check
          if (po.expectedDate && rcv.warehouseReceivedAt <= po.expectedDate) {
            onTimeCount += 1;
          }
        }
      }

      // QC acceptance rate
      let totalAccepted = 0;
      let totalInspected = 0;
      for (const rcv of receivings) {
        for (const line of rcv.lines) {
          totalAccepted += line.acceptedQty;
          totalInspected += line.acceptedQty + line.rejectedQty;
        }
      }

      const onTimeRate = receivedPOs > 0 ? (onTimeCount / receivedPOs) * 100 : 0;
      const qualityRate = totalInspected > 0 ? (totalAccepted / totalInspected) * 100 : 0;
      const avgLeadTime = leadTimeCount > 0 ? totalLeadTimeDays / leadTimeCount : 0;

      return {
        supplierId: supplier.id,
        supplierCode: supplier.code,
        supplierName: supplier.name,
        rating: supplier.rating || 0,
        totalPOs,
        totalSpend,
        receivedPOs,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        qualityRate: Math.round(qualityRate * 10) / 10,
        avgLeadTimeDays: Math.round(avgLeadTime * 10) / 10,
        avgOrderValue: totalPOs > 0 ? Math.round((totalSpend / totalPOs) * 100) / 100 : 0,
      };
    })
  );

  return apiSuccess({
    suppliers: results.sort((a, b) => b.totalSpend - a.totalSpend),
  });
}
