"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, Tag, App } from "antd";
import { DownloadOutlined, DollarOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Row {
  id: string; poNumber: string; supplier: string; supplierCode: string;
  amount: number; dueDate: string | null; daysOverdue: number; bucket: string; status: string;
}
interface BucketRow { bucket: string; count: number; total: number; }
interface SupplierRow { code: string; name: string; total: number; count: number; }

interface Data {
  rows: Row[]; totalOutstanding: number;
  byBucket: BucketRow[]; bySupplier: SupplierRow[];
}

const BUCKET_COLORS: Record<string, string> = {
  "Not Yet Due": "green", "0-30 Days": "blue", "31-60 Days": "orange", "61-90 Days": "red", "90+ Days": "magenta",
};

export default function PaymentAgingReport() {
  const { message } = App.useApp();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/payment-aging");
    const json = await res.json();
    if (json.success) setData(json.data);
    else message.error("Failed to load report");
    setLoading(false);
  }, [message]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const columns: ColumnsType<Row> = [
    { title: "PO #", dataIndex: "poNumber", width: 120 },
    { title: "Supplier", dataIndex: "supplier", ellipsis: true },
    { title: "Amount", dataIndex: "amount", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
    { title: "Due Date", dataIndex: "dueDate", width: 120, render: (v: string | null) => v ? dayjs(v).format("DD MMM YYYY") : "-" },
    { title: "Days Overdue", dataIndex: "daysOverdue", width: 120, align: "right" },
    { title: "Aging Bucket", dataIndex: "bucket", width: 130, render: (v: string) => <Tag color={BUCKET_COLORS[v]}>{v}</Tag> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="grid grid-cols-3 gap-4">
          <Card size="small"><Statistic title="Total Outstanding" value={data?.totalOutstanding || 0} precision={2} prefix={<DollarOutlined />} styles={{ content: { color: "#faad14" } }} /></Card>
          {data?.byBucket.filter(b => b.bucket === "90+ Days").map(b => (
            <Card key={b.bucket} size="small"><Statistic title="90+ Days Overdue" value={b.total} precision={2} prefix={<DollarOutlined />} styles={{ content: { color: "#ff4d4f" } }} /></Card>
          ))}
        </div>
        <Button icon={<DownloadOutlined />} onClick={() => data && exportToExcel("Payment Aging", [
          { header: "PO #", key: "poNumber", width: 15 }, { header: "Supplier", key: "supplier", width: 25 },
          { header: "Amount", key: "amount", width: 15 }, { header: "Due Date", key: "dueDate", width: 15 },
          { header: "Days Overdue", key: "daysOverdue", width: 15 }, { header: "Bucket", key: "bucket", width: 15 },
        ], data.rows)}>Export</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-base font-semibold mb-2">By Aging Bucket</h3>
          <Table rowKey="bucket" dataSource={data?.byBucket || []} loading={loading} pagination={false} size="small" columns={[
            { title: "Bucket", dataIndex: "bucket", render: (v: string) => <Tag color={BUCKET_COLORS[v]}>{v}</Tag> },
            { title: "Count", dataIndex: "count", width: 80, align: "right" },
            { title: "Total", dataIndex: "total", width: 130, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
          ]} />
        </div>
        <div>
          <h3 className="text-base font-semibold mb-2">By Supplier</h3>
          <Table rowKey="code" dataSource={data?.bySupplier || []} loading={loading} pagination={false} size="small" columns={[
            { title: "Supplier", dataIndex: "name", ellipsis: true },
            { title: "Count", dataIndex: "count", width: 80, align: "right" },
            { title: "Total", dataIndex: "total", width: 130, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
          ]} />
        </div>
      </div>

      <h3 className="text-base font-semibold">All Outstanding Payments</h3>
      <Table rowKey="id" columns={columns} dataSource={data?.rows || []} loading={loading} pagination={{ pageSize: 20 }} size="small" />
    </div>
  );
}
