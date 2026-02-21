"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, Radio, Select, Empty, Skeleton, App } from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";

interface SupplierRow {
  id: string;
  name: string;
  orderCount: number;
  totalSpend: number;
  avgOrder: number;
}
interface StatusRow { status: string; count: number; total: number }
interface CategoryRow { id: string; name: string; total: number }

interface Data {
  period: string;
  totalOrders: number;
  totalSpend: number;
  avgOrderValue: number;
  bySupplier: SupplierRow[];
  byStatus: StatusRow[];
  byCategory: CategoryRow[];
}

const PIE_COLORS = ["#1890ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#d9d9d9",
  PENDING_APPROVAL: "#faad14",
  APPROVED: "#52c41a",
  SENT: "#1890ff",
  PARTIALLY_RECEIVED: "#722ed1",
  RECEIVED: "#13c2c2",
  CANCELLED: "#ff4d4f",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SENT: "Sent to Supplier",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export default function PurchaseSummaryReport() {
  const { message } = App.useApp();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/purchase-summary?period=${period}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    else message.error("Failed to load report");
    setLoading(false);
  }, [period, message]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="small"><Skeleton active paragraph={{ rows: 1 }} /></Card>
          ))}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const supplierCols: ColumnsType<SupplierRow> = [
    { title: "Supplier", dataIndex: "name", ellipsis: true },
    { title: "Orders", dataIndex: "orderCount", width: 80, align: "right", sorter: (a, b) => a.orderCount - b.orderCount },
    {
      title: "Total Spend",
      dataIndex: "totalSpend",
      width: 130,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
      sorter: (a, b) => a.totalSpend - b.totalSpend,
      defaultSortOrder: "descend",
    },
    { title: "Avg Order", dataIndex: "avgOrder", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
    {
      title: "% of Spend",
      width: 100,
      align: "right",
      render: (_, r) => {
        const pct = (data?.totalSpend || 0) > 0 ? ((r.totalSpend / (data?.totalSpend || 1)) * 100) : 0;
        return (
          <div className="flex items-center gap-1 justify-end">
            <div className="w-12 bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Radio.Group value={period} onChange={(e) => setPeriod(e.target.value)}>
          <Radio.Button value="30">30 Days</Radio.Button>
          <Radio.Button value="90">90 Days</Radio.Button>
          <Radio.Button value="365">1 Year</Radio.Button>
          <Radio.Button value="9999">All Time</Radio.Button>
        </Radio.Group>
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          onClick={() =>
            data &&
            exportToExcel("Purchase Summary", [
              { header: "Supplier", key: "name", width: 30 },
              { header: "Orders", key: "orderCount", width: 10 },
              { header: "Total Spend", key: "totalSpend", width: 15 },
              { header: "Avg Order", key: "avgOrder", width: 15 },
            ], data.bySupplier)
          }
        >
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#1890ff" }}>
          <Statistic title="Total Orders" value={data?.totalOrders || 0} prefix={<ShoppingCartOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#52c41a" }}>
          <Statistic title="Total Spend" value={data?.totalSpend || 0} precision={2} prefix={<DollarOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#722ed1" }}>
          <Statistic title="Avg Order Value" value={data?.avgOrderValue || 0} precision={2} prefix={<DollarOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#faad14" }}>
          <Statistic title="Suppliers" value={data?.bySupplier.length || 0} prefix={<TeamOutlined />} />
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Spend by Supplier" size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          {!data?.bySupplier.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.bySupplier.slice(0, 8)}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={100} fontSize={10} tick={{ fill: "#6b7280" }} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Spend"]} />
                <Bar dataKey="totalSpend" fill="#1890ff" radius={[0, 4, 4, 0]}>
                  {data.bySupplier.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Orders by Status" size="small" styles={{ body: { padding: "12px" } }}>
          {!data?.byStatus.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.byStatus.map((s) => ({
                    ...s,
                    label: STATUS_LABELS[s.status] || s.status,
                  }))}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(entry: Record<string, any>) => `${entry.label ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                  fontSize={10}
                >
                  {data.byStatus.map((s, i) => (
                    <Cell key={i} fill={STATUS_COLORS[s.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="By Supplier" size="small">
          <Table
            rowKey="id"
            columns={supplierCols}
            dataSource={data?.bySupplier || []}
            pagination={false}
            size="small"
            scroll={{ x: 500 }}
          />
        </Card>
        <Card title="By Category" size="small">
          <Table
            rowKey="id"
            dataSource={data?.byCategory || []}
            pagination={false}
            size="small"
            columns={[
              { title: "Category", dataIndex: "name", ellipsis: true },
              {
                title: "Total",
                dataIndex: "total",
                width: 130,
                align: "right",
                render: (v: number) => `$${v.toFixed(2)}`,
                sorter: (a: CategoryRow, b: CategoryRow) => a.total - b.total,
                defaultSortOrder: "descend" as const,
              },
              {
                title: "% of Spend",
                width: 100,
                align: "right" as const,
                render: (_: unknown, r: CategoryRow) => {
                  const pct = (data?.totalSpend || 0) > 0 ? ((r.total / (data?.totalSpend || 1)) * 100) : 0;
                  return (
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-12 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs">{pct.toFixed(1)}%</span>
                    </div>
                  );
                },
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
