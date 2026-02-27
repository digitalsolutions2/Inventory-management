"use client";

import { Card, Button } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  BarChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function ReportsPage() {
  const { t } = useTranslation();

  const reports = [
    {
      title: t.reports.inventoryValuation,
      description: t.reports.inventoryValuationDesc,
      href: "/reports/inventory-valuation",
      icon: <DollarOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
      color: "#e6f7ff",
    },
    {
      title: t.reports.purchaseSummary,
      description: t.reports.purchaseSummaryDesc,
      href: "/reports/purchase-summary",
      icon: <ShoppingCartOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
      color: "#f6ffed",
    },
    {
      title: t.reports.paymentAging,
      description: t.reports.paymentAgingDesc,
      href: "/reports/payment-aging",
      icon: <ClockCircleOutlined style={{ fontSize: 28, color: "#faad14" }} />,
      color: "#fffbe6",
    },
    {
      title: t.reports.transactionHistory,
      description: t.reports.transactionHistoryDesc,
      href: "/reports/transaction-history",
      icon: <SwapOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
      color: "#f9f0ff",
    },
    {
      title: t.reports.stockMovement,
      description: t.reports.stockMovementDesc,
      href: "/reports/stock-movement",
      icon: <BarChartOutlined style={{ fontSize: 28, color: "#ff4d4f" }} />,
      color: "#fff1f0",
    },
    {
      title: t.reports.supplierPerformance,
      description: t.reports.supplierPerformanceDesc,
      href: "/reports/supplier-performance",
      icon: <TeamOutlined style={{ fontSize: 28, color: "#13c2c2" }} />,
      color: "#e6fffb",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {reports.map((report) => (
        <Card
          key={report.href}
          hoverable
          size="small"
          styles={{ body: { padding: 20 } }}
        >
          <div className="flex flex-col h-full">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: report.color }}
            >
              {report.icon}
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              {report.description}
            </p>
            <Link href={report.href}>
              <Button type="primary" block>
                {t.common.viewReport}
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
