"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, Select, DatePicker, Card, Statistic, Skeleton, Empty, App } from "antd";
import {
  DownloadOutlined,
  SwapOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Row {
  id: string;
  date: string;
  type: string;
  itemCode: string;
  itemName: string;
  uom: string;
  location: string;
  quantity: number;
  unitCost: number | null;
  referenceType: string | null;
  notes: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  INBOUND: "green",
  OUTBOUND: "red",
  TRANSFER_IN: "blue",
  TRANSFER_OUT: "orange",
  ADJUSTMENT: "purple",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  INBOUND: <ArrowDownOutlined />,
  OUTBOUND: <ArrowUpOutlined />,
  TRANSFER_IN: <SwapOutlined />,
  TRANSFER_OUT: <SwapOutlined />,
  ADJUSTMENT: <FilterOutlined />,
};

export default function TransactionHistoryReport() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (typeFilter) params.set("type", typeFilter);
    if (dateRange[0]) params.set("dateFrom", dateRange[0].toISOString());
    if (dateRange[1]) params.set("dateTo", dateRange[1].toISOString());

    const res = await fetch(`/api/reports/transaction-history?${params}`);
    const json = await res.json();
    if (json.success) {
      setRows(json.data.rows);
      setTotal(json.data.total);
    } else message.error("Failed to load report");
    setLoading(false);
  }, [page, typeFilter, dateRange, message]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  // Summary stats
  const inboundQty = rows.filter((r) => r.type === "INBOUND").reduce((s, r) => s + r.quantity, 0);
  const outboundQty = rows.filter((r) => r.type === "OUTBOUND").reduce((s, r) => s + r.quantity, 0);
  const transferQty = rows.filter((r) => r.type.startsWith("TRANSFER")).reduce((s, r) => s + r.quantity, 0);

  // Type breakdown for chart
  const typeBreakdown = Object.entries(
    rows.reduce(
      (acc, r) => {
        const label = r.type.replace("_", " ");
        if (!acc[label]) acc[label] = { type: label, count: 0, qty: 0 };
        acc[label].count++;
        acc[label].qty += r.quantity;
        return acc;
      },
      {} as Record<string, { type: string; count: number; qty: number }>
    )
  ).map(([, v]) => v);

  const columns: ColumnsType<Row> = [
    {
      title: "Date",
      dataIndex: "date",
      width: 150,
      render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm"),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 130,
      render: (v: string) => (
        <Tag color={TYPE_COLORS[v]} icon={TYPE_ICONS[v]}>
          {v.replace("_", " ")}
        </Tag>
      ),
      filters: [
        { text: "Inbound", value: "INBOUND" },
        { text: "Outbound", value: "OUTBOUND" },
        { text: "Transfer In", value: "TRANSFER_IN" },
        { text: "Transfer Out", value: "TRANSFER_OUT" },
        { text: "Adjustment", value: "ADJUSTMENT" },
      ],
      onFilter: (v, r) => r.type === v,
    },
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "Location", dataIndex: "location", width: 130 },
    {
      title: "Qty",
      dataIndex: "quantity",
      width: 80,
      align: "right",
      sorter: (a, b) => a.quantity - b.quantity,
      render: (v: number, r) => (
        <span
          style={{
            color: r.type === "INBOUND" || r.type === "TRANSFER_IN" ? "#52c41a" : r.type === "OUTBOUND" || r.type === "TRANSFER_OUT" ? "#ff4d4f" : undefined,
            fontWeight: 500,
          }}
        >
          {r.type === "INBOUND" || r.type === "TRANSFER_IN" ? "+" : r.type === "OUTBOUND" || r.type === "TRANSFER_OUT" ? "-" : ""}
          {v}
        </span>
      ),
    },
    {
      title: "Unit Cost",
      dataIndex: "unitCost",
      width: 100,
      align: "right",
      render: (v: number | null) => (v ? `$${v.toFixed(2)}` : "-"),
    },
    { title: "Reference", dataIndex: "referenceType", width: 120, render: (v: string | null) => v || "-" },
    { title: "Notes", dataIndex: "notes", ellipsis: true, render: (v: string | null) => v || "-" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#1890ff" }}>
          <Statistic title="Total Transactions" value={total} prefix={<SwapOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#52c41a" }}>
          <Statistic title="Inbound Qty" value={inboundQty} prefix={<ArrowDownOutlined />} styles={{ content: { color: "#52c41a" } }} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#ff4d4f" }}>
          <Statistic title="Outbound Qty" value={outboundQty} prefix={<ArrowUpOutlined />} styles={{ content: { color: "#ff4d4f" } }} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#722ed1" }}>
          <Statistic title="Transfer Qty" value={transferQty} prefix={<SwapOutlined />} />
        </Card>
      </div>

      {/* Type Breakdown Chart */}
      {typeBreakdown.length > 0 && (
        <Card title="Transaction Breakdown (Current Page)" size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeBreakdown} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="type" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Transactions" fill="#1890ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="qty" name="Quantity" fill="#52c41a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filters & Export */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <Select
            placeholder="Transaction type"
            value={typeFilter || undefined}
            onChange={(v) => {
              setTypeFilter(v || "");
              setPage(1);
            }}
            allowClear
            className="w-48"
            options={[
              { value: "INBOUND", label: "Inbound" },
              { value: "OUTBOUND", label: "Outbound" },
              { value: "TRANSFER_IN", label: "Transfer In" },
              { value: "TRANSFER_OUT", label: "Transfer Out" },
              { value: "ADJUSTMENT", label: "Adjustment" },
            ]}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates ? [dates[0], dates[1]] : [null, null]);
              setPage(1);
            }}
          />
        </div>
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          onClick={() =>
            exportToExcel("Transaction History", [
              { header: "Date", key: "date", width: 20 },
              { header: "Type", key: "type", width: 15 },
              { header: "Item Code", key: "itemCode", width: 12 },
              { header: "Item", key: "itemName", width: 25 },
              { header: "Location", key: "location", width: 18 },
              { header: "Qty", key: "quantity", width: 10 },
              { header: "Unit Cost", key: "unitCost", width: 12 },
              { header: "Reference", key: "referenceType", width: 15 },
              { header: "Notes", key: "notes", width: 25 },
            ], rows)
          }
        >
          Export to Excel
        </Button>
      </div>

      {/* Transaction Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        size="small"
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: 50,
          total,
          onChange: (p) => setPage(p),
          showTotal: (t) => `${t} transactions`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
