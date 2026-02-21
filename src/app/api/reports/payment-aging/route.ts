import { prisma } from "@/lib/prisma";
import { getCurrentUser, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const now = new Date();

  const payments = await prisma.payment.findMany({
    where: {
      tenantId: user.tenantId,
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    },
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          totalAmount: true,
          supplier: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const rows = payments.map((p) => {
    const daysOverdue = p.dueDate
      ? Math.floor((now.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    let bucket: string;
    if (daysOverdue <= 0) bucket = "Not Yet Due";
    else if (daysOverdue <= 30) bucket = "0-30 Days";
    else if (daysOverdue <= 60) bucket = "31-60 Days";
    else if (daysOverdue <= 90) bucket = "61-90 Days";
    else bucket = "90+ Days";

    return {
      id: p.id,
      poNumber: p.purchaseOrder.poNumber,
      supplier: p.purchaseOrder.supplier.name,
      supplierCode: p.purchaseOrder.supplier.code,
      amount: p.amount,
      dueDate: p.dueDate,
      daysOverdue: Math.max(0, daysOverdue),
      bucket,
      status: p.status,
    };
  });

  // Summary by supplier
  const bySupplier: Record<string, { name: string; total: number; count: number }> = {};
  for (const r of rows) {
    if (!bySupplier[r.supplierCode]) {
      bySupplier[r.supplierCode] = { name: r.supplier, total: 0, count: 0 };
    }
    bySupplier[r.supplierCode].total += r.amount;
    bySupplier[r.supplierCode].count += 1;
  }

  // Summary by bucket
  const byBucket: Record<string, { count: number; total: number }> = {};
  for (const r of rows) {
    if (!byBucket[r.bucket]) byBucket[r.bucket] = { count: 0, total: 0 };
    byBucket[r.bucket].count += 1;
    byBucket[r.bucket].total += r.amount;
  }

  const totalOutstanding = rows.reduce((s, r) => s + r.amount, 0);

  return apiSuccess({
    rows,
    totalOutstanding,
    bySupplier: Object.entries(bySupplier)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.total - a.total),
    byBucket: Object.entries(byBucket).map(([bucket, data]) => ({ bucket, ...data })),
  });
}
