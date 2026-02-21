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
          supplier: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const buckets = {
    current: [] as typeof payments,
    days31_60: [] as typeof payments,
    days61_90: [] as typeof payments,
    over90: [] as typeof payments,
  };

  for (const p of payments) {
    if (!p.dueDate) {
      buckets.current.push(p);
      continue;
    }
    const daysOverdue = Math.floor(
      (now.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOverdue <= 30) buckets.current.push(p);
    else if (daysOverdue <= 60) buckets.days31_60.push(p);
    else if (daysOverdue <= 90) buckets.days61_90.push(p);
    else buckets.over90.push(p);
  }

  const sumBucket = (items: typeof payments) =>
    items.reduce((s, p) => s + p.amount, 0);

  return apiSuccess({
    buckets: {
      current: { count: buckets.current.length, total: sumBucket(buckets.current), items: buckets.current },
      days31_60: { count: buckets.days31_60.length, total: sumBucket(buckets.days31_60), items: buckets.days31_60 },
      days61_90: { count: buckets.days61_90.length, total: sumBucket(buckets.days61_90), items: buckets.days61_90 },
      over90: { count: buckets.over90.length, total: sumBucket(buckets.over90), items: buckets.over90 },
    },
    totalOutstanding: sumBucket(payments),
  });
}
