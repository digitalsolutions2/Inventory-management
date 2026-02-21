"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, Radio, App } from "antd";
import { DownloadOutlined, DollarOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";

interface SupplierRow { id: string; name: string; orderCount: number; totalSpend: number; avgOrder: number; }
interface StatusRow { status: string; count: number; total: number; }
interface CategoryRow { id: string; name: string; total: number; }

interface Data {
  period: string; totalOrders: number; totalSpend: number; avgOrderValue: number;
  bySupplier: SupplierRow[]; byStatus: StatusRow[]; byCategory: CategoryRow[];
}

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

  useEffect(() => { fetch_(); }, [fetch_]);

  const supplierCols: ColumnsType<SupplierRow> = [
    { title: "Supplier", dataIndex: "name", ellipsis: true },
    { title: "Orders", dataIndex: "orderCount", width: 80, align: "right" },
    { title: "Total Spend", dataIndex: "totalSpend", width: 130, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
    { title: "Avg Order", dataIndex: "avgOrder", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Radio.Group value={period} onChange={(e) => setPeriod(e.target.value)}>
          <Radio.Button value="30">30 Days</Radio.Button>
          <Radio.Button value="90">90 Days</Radio.Button>
          <Radio.Button value="365">1 Year</Radio.Button>
          <Radio.Button value="9999">All Time</Radio.Button>
        </Radio.Group>
        <Button icon={<DownloadOutlined />} onClick={() => data && exportToExcel("Purchase Summary", [
          { header: "Supplier", key: "name", width: 30 }, { header: "Orders", key: "orderCount", width: 10 },
          { header: "Total Spend", key: "totalSpend", width: 15 }, { header: "Avg Order", key: "avgOrder", width: 15 },
        ], data.bySupplier)}>Export</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card size="small"><Statistic title="Total Orders" value={data?.totalOrders || 0} prefix={<ShoppingCartOutlined />} /></Card>
        <Card size="small"><Statistic title="Total Spend" value={data?.totalSpend || 0} precision={2} prefix={<DollarOutlined />} /></Card>
        <Card size="small"><Statistic title="Avg Order Value" value={data?.avgOrderValue || 0} precision={2} prefix={<DollarOutlined />} /></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-base font-semibold mb-2">By Supplier</h3>
          <Table rowKey="id" columns={supplierCols} dataSource={data?.bySupplier || []} loading={loading} pagination={false} size="small" />
        </div>
        <div>
          <h3 className="text-base font-semibold mb-2">By Category</h3>
          <Table rowKey="id" dataSource={data?.byCategory || []} loading={loading} pagination={false} size="small"
            columns={[
              { title: "Category", dataIndex: "name", ellipsis: true },
              { title: "Total", dataIndex: "total", width: 130, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
