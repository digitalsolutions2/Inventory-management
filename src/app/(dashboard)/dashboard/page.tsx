import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dayjs from "dayjs";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });
  if (!dbUser) redirect("/login");

  const tenantId = dbUser.tenantId;

  const [totalItems, lowStockItems, pendingPOs, pendingReceipts, recentPOs] =
    await Promise.all([
      prisma.item.count({ where: { tenantId, isActive: true } }),
      prisma.item.count({
        where: {
          tenantId,
          isActive: true,
          minStock: { gt: 0 },
          avgCost: { equals: 0 }, // Items with no stock yet but have minStock set
        },
      }),
      prisma.purchaseOrder.count({
        where: { tenantId, status: "PENDING_APPROVAL" },
      }),
      prisma.receiving.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.purchaseOrder.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          supplier: { select: { name: true } },
          createdBy: { select: { fullName: true } },
        },
      }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Items"
          value={String(totalItems)}
          subtitle="Active items in catalog"
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={String(lowStockItems)}
          subtitle="Items below minimum"
          color="warning"
        />
        <DashboardCard
          title="Pending POs"
          value={String(pendingPOs)}
          subtitle="Awaiting approval"
          color="info"
        />
        <DashboardCard
          title="Pending Receipts"
          value={String(pendingReceipts)}
          subtitle="Awaiting processing"
          color="info"
        />
      </div>
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Purchase Orders
        </h2>
        {recentPOs.length === 0 ? (
          <p className="text-gray-500 text-sm">No purchase orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentPOs.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <span className="font-medium text-gray-900">{po.poNumber}</span>
                  <span className="text-gray-500 mx-2">-</span>
                  <span className="text-gray-600">{po.supplier.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {po.currency} {po.totalAmount.toFixed(2)}
                  </span>
                  <StatusBadge status={po.status} />
                  <span className="text-xs text-gray-400">
                    {dayjs(po.createdAt).format("DD MMM")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  color = "default",
}: {
  title: string;
  value: string;
  subtitle: string;
  color?: "default" | "warning" | "info" | "success" | "error";
}) {
  const colorClasses = {
    default: "bg-white",
    warning: "bg-orange-50 border-orange-200",
    info: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
  };

  return (
    <div className={`rounded-lg shadow border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING_APPROVAL: "bg-orange-100 text-orange-700",
    APPROVED: "bg-green-100 text-green-700",
    SENT: "bg-blue-100 text-blue-700",
    PARTIALLY_RECEIVED: "bg-cyan-100 text-cyan-700",
    RECEIVED: "bg-indigo-100 text-indigo-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending",
    APPROVED: "Approved",
    SENT: "Sent",
    PARTIALLY_RECEIVED: "Partial",
    RECEIVED: "Received",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {labels[status] || status}
    </span>
  );
}
