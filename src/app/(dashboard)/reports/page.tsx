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

const reports = [
  {
    title: "Inventory Valuation",
    description:
      "View current inventory value by location and category with cost analysis",
    href: "/reports/inventory-valuation",
    icon: <DollarOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
    color: "#e6f7ff",
  },
  {
    title: "Purchase Summary",
    description:
      "Analyze purchase spending by supplier, category, and time period",
    href: "/reports/purchase-summary",
    icon: <ShoppingCartOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
    color: "#f6ffed",
  },
  {
    title: "Payment Aging",
    description:
      "Track outstanding payments with aging buckets and overdue alerts",
    href: "/reports/payment-aging",
    icon: <ClockCircleOutlined style={{ fontSize: 28, color: "#faad14" }} />,
    color: "#fffbe6",
  },
  {
    title: "Transaction History",
    description:
      "Complete log of all inventory movements with advanced filters",
    href: "/reports/transaction-history",
    icon: <SwapOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
    color: "#f9f0ff",
  },
  {
    title: "Stock Movement",
    description:
      "Identify slow-moving and fast-moving items with turnover analysis",
    href: "/reports/stock-movement",
    icon: <BarChartOutlined style={{ fontSize: 28, color: "#ff4d4f" }} />,
    color: "#fff1f0",
  },
  {
    title: "Supplier Performance",
    description:
      "Score suppliers on delivery, quality, and pricing performance",
    href: "/reports/supplier-performance",
    icon: <TeamOutlined style={{ fontSize: 28, color: "#13c2c2" }} />,
    color: "#e6fffb",
  },
];

export default function ReportsPage() {
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
                View Report
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
