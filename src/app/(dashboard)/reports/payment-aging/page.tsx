"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, Tag, Alert, Skeleton, Empty, App } from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Row {
  id: string;
  poNumber: string;
  supplier: string;
  supplierCode: string;
  amount: number;
  dueDate: string | null;
  daysOverdue: number;
  bucket: string;
  status: string;
}
interface BucketRow { bucket: string; count: number; total: number }
interface SupplierRow { code: string; name: string; total: number; count: number }

interface Data {
  rows: Row[];
  totalOutstanding: number;
  byBucket: BucketRow[];
  bySupplier: SupplierRow[];
}

const BUCKET_COLORS: Record<string, string> = {
  "Not Yet Due": "#52c41a",
  "0-30 Days": "#1890ff",
  "31-60 Days": "#faad14",
  "61-90 Days": "#fa8c16",
  "90+ Days": "#ff4d4f",
};

const BUCKET_TAG_COLORS: Record<string, string> = {
  "Not Yet Due": "green",
  "0-30 Days": "blue",
  "31-60 Days": "orange",
  "61-90 Days": "volcano",
  "90+ Days": "red",
};

export default function PaymentAgingReport() {
  const { message } = App.useApp();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [bucketFilter, setBucketFilter] = useState<string>("");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/payment-aging");
    const json = await res.json();
    if (json.success) setData(json.data);
    else message.error("Failed to load report");
    setLoading(false);
  }, [message]);

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

  const overdue90 = data?.byBucket.find((b) => b.bucket === "90+ Days");
  const overdue60 = data?.byBucket.find((b) => b.bucket === "61-90 Days");
  const overdue30 = data?.byBucket.find((b) => b.bucket === "31-60 Days");
  const current = data?.byBucket.find((b) => b.bucket === "0-30 Days");

  const filteredRows = bucketFilter
    ? data?.rows.filter((r) => r.bucket === bucketFilter) || []
    : data?.rows || [];

  const totalOverdue = (overdue30?.total || 0) + (overdue60?.total || 0) + (overdue90?.total || 0);

  const columns: ColumnsType<Row> = [
    { title: "PO #", dataIndex: "poNumber", width: 120 },
    { title: "Supplier", dataIndex: "supplier", ellipsis: true },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 120,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format("DD MMM YYYY") : "-"),
      sorter: (a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime(),
    },
    {
      title: "Days Overdue",
      dataIndex: "daysOverdue",
      width: 120,
      align: "right",
      sorter: (a, b) => a.daysOverdue - b.daysOverdue,
      render: (v: number) => (
        <span style={{ color: v > 60 ? "#ff4d4f" : v > 30 ? "#faad14" : undefined, fontWeight: v > 60 ? 600 : undefined }}>
          {v > 0 ? v : "-"}
        </span>
      ),
    },
    {
      title: "Aging Bucket",
      dataIndex: "bucket",
      width: 130,
      filters: data?.byBucket.map((b) => ({ text: b.bucket, value: b.bucket })) || [],
      onFilter: (v, r) => r.bucket === v,
      render: (v: string) => <Tag color={BUCKET_TAG_COLORS[v]}>{v}</Tag>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overdue Alert */}
      {totalOverdue > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={
            <span>
              <strong>${totalOverdue.toFixed(2)}</strong> in overdue payments require immediate attention
            </span>
          }
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#faad14" }}>
          <Statistic
            title="Total Outstanding"
            value={data?.totalOutstanding || 0}
            precision={2}
            prefix={<DollarOutlined />}
            styles={{ content: { color: "#faad14" } }}
          />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#52c41a" }}>
          <Statistic title="Current (0-30)" value={current?.total || 0} precision={2} prefix={<DollarOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#fa8c16" }}>
          <Statistic
            title="31-60 Days"
            value={overdue30?.total || 0}
            precision={2}
            prefix={<DollarOutlined />}
            styles={{ content: { color: (overdue30?.total || 0) > 0 ? "#fa8c16" : undefined } }}
          />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#ff4d4f" }}>
          <Statistic
            title="90+ Days"
            value={overdue90?.total || 0}
            precision={2}
            prefix={<WarningOutlined />}
            styles={{ content: { color: (overdue90?.total || 0) > 0 ? "#ff4d4f" : undefined } }}
          />
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Distribution by Aging Bucket" size="small" styles={{ body: { padding: "12px" } }}>
          {!data?.byBucket.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.byBucket}
                  dataKey="total"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(entry: Record<string, any>) => `${entry.bucket ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                  fontSize={10}
                >
                  {data.byBucket.map((b, i) => (
                    <Cell key={i} fill={BUCKET_COLORS[b.bucket] || "#d9d9d9"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Outstanding by Supplier" size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          {!data?.bySupplier.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.bySupplier.slice(0, 6)}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v.toFixed(0)}`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={100} fontSize={10} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Outstanding"]} />
                <Bar dataKey="total" fill="#fa8c16" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="By Aging Bucket" size="small">
          <Table
            rowKey="bucket"
            dataSource={data?.byBucket || []}
            pagination={false}
            size="small"
            columns={[
              {
                title: "Bucket",
                dataIndex: "bucket",
                render: (v: string) => <Tag color={BUCKET_TAG_COLORS[v]}>{v}</Tag>,
              },
              { title: "Count", dataIndex: "count", width: 80, align: "right" },
              { title: "Total", dataIndex: "total", width: 130, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
            ]}
          />
        </Card>
        <Card title="By Supplier" size="small">
          <Table
            rowKey="code"
            dataSource={data?.bySupplier || []}
            pagination={false}
            size="small"
            columns={[
              { title: "Supplier", dataIndex: "name", ellipsis: true },
              { title: "Count", dataIndex: "count", width: 80, align: "right" },
              { title: "Total", dataIndex: "total", width: 130, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
            ]}
          />
        </Card>
      </div>

      {/* All Outstanding Payments */}
      <Card
        title="All Outstanding Payments"
        size="small"
        extra={
          <Button
            icon={<DownloadOutlined />}
            type="primary"
            size="small"
            onClick={() =>
              data &&
              exportToExcel("Payment Aging", [
                { header: "PO #", key: "poNumber", width: 15 },
                { header: "Supplier", key: "supplier", width: 25 },
                { header: "Amount", key: "amount", width: 15 },
                { header: "Due Date", key: "dueDate", width: 15 },
                { header: "Days Overdue", key: "daysOverdue", width: 15 },
                { header: "Bucket", key: "bucket", width: 15 },
              ], data.rows)
            }
          >
            Export
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} payments` }}
          size="small"
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
}
