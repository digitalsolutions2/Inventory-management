export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Items" value="--" subtitle="Active items in catalog" />
        <DashboardCard title="Low Stock Alerts" value="--" subtitle="Items below minimum" color="warning" />
        <DashboardCard title="Pending POs" value="--" subtitle="Awaiting approval" color="info" />
        <DashboardCard title="Pending Receipts" value="--" subtitle="Awaiting processing" color="info" />
      </div>
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-sm">No recent activity to display.</p>
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
