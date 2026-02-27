"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppstoreOutlined } from "@ant-design/icons";
import { useTranslation } from "@/lib/i18n";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    { label: t.reports.title, href: "/reports", exact: true, icon: <AppstoreOutlined /> },
    { label: t.reports.inventoryValuation, href: "/reports/inventory-valuation" },
    { label: t.reports.purchaseSummary, href: "/reports/purchase-summary" },
    { label: t.reports.paymentAging, href: "/reports/payment-aging" },
    { label: t.reports.transactionHistory, href: "/reports/transaction-history" },
    { label: t.reports.stockMovement, href: "/reports/stock-movement" },
    { label: t.reports.supplierPerformance, href: "/reports/supplier-performance" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.reports.title}</h1>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="border-b px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {"icon" in tab && tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
