"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Radio, Tag, Card, Statistic, Tabs, Alert, Skeleton, Empty, App } from "antd";
import {
  DownloadOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
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

interface Row {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  inbound: number;
  outbound: number;
  transferIn: number;
  transferOut: number;
  totalMovement: number;
  txCount: number;
  avgDailyConsumption: number;
  turnoverRatio: number;
}

interface Data {
  period: string;
  rows: Row[];
  slowMoving: Row[];
  fastMoving: Row[];
}

export default function StockMovementReport() {
  const { message } = App.useApp();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [activeTab, setActiveTab] = useState("all");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/stock-movement?days=${days}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    else message.error("Failed to load report");
    setLoading(false);
  }, [days, message]);

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
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const slowCount = data?.slowMoving.length || 0;
  const fastCount = data?.fastMoving.length || 0;
  const totalItems = data?.rows.length || 0;
  const noMovement = data?.rows.filter((r) => r.totalMovement === 0).length || 0;

  // Chart data: top 10 by movement
  const topMovers = [...(data?.rows || [])]
    .sort((a, b) => b.totalMovement - a.totalMovement)
    .slice(0, 10);

  const allColumns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    {
      title: "Inbound",
      dataIndex: "inbound",
      width: 90,
      align: "right",
      render: (v: number) => (v > 0 ? <span className="text-green-600 font-medium">+{v}</span> : <span className="text-gray-300">-</span>),
      sorter: (a, b) => a.inbound - b.inbound,
    },
    {
      title: "Outbound",
      dataIndex: "outbound",
      width: 90,
      align: "right",
      render: (v: number) => (v > 0 ? <span className="text-red-600 font-medium">-{v}</span> : <span className="text-gray-300">-</span>),
      sorter: (a, b) => a.outbound - b.outbound,
    },
    {
      title: "Xfer In",
      dataIndex: "transferIn",
      width: 80,
      align: "right",
      render: (v: number) => (v > 0 ? <span className="text-blue-600">+{v}</span> : <span className="text-gray-300">-</span>),
    },
    {
      title: "Xfer Out",
      dataIndex: "transferOut",
      width: 80,
      align: "right",
      render: (v: number) => (v > 0 ? <span className="text-orange-600">-{v}</span> : <span className="text-gray-300">-</span>),
    },
    {
      title: "Total",
      dataIndex: "totalMovement",
      width: 80,
      align: "right",
      sorter: (a, b) => a.totalMovement - b.totalMovement,
      render: (v: number) => <span className="font-semibold">{v}</span>,
    },
    { title: "Avg Daily", dataIndex: "avgDailyConsumption", width: 90, align: "right" },
    {
      title: "Activity",
      width: 110,
      render: (_, r) => {
        if (r.totalMovement === 0)
          return (
            <Tag color="red" icon={<WarningOutlined />}>
              Dead Stock
            </Tag>
          );
        if (r.turnoverRatio > 1)
          return (
            <Tag color="green" icon={<ThunderboltOutlined />}>
              Fast
            </Tag>
          );
        if (r.turnoverRatio > 0.3) return <Tag color="blue">Normal</Tag>;
        return (
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            Slow
          </Tag>
        );
      },
      filters: [
        { text: "Fast", value: "fast" },
        { text: "Normal", value: "normal" },
        { text: "Slow", value: "slow" },
        { text: "Dead Stock", value: "dead" },
      ],
      onFilter: (v, r) => {
        if (v === "dead") return r.totalMovement === 0;
        if (v === "fast") return r.turnoverRatio > 1;
        if (v === "normal") return r.turnoverRatio > 0.3 && r.turnoverRatio <= 1;
        return r.turnoverRatio <= 0.3 && r.totalMovement > 0;
      },
    },
  ];

  const slowColumns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    { title: "Total Movement", dataIndex: "totalMovement", width: 120, align: "right" },
    { title: "Transactions", dataIndex: "txCount", width: 100, align: "right" },
    { title: "Turnover Ratio", dataIndex: "turnoverRatio", width: 120, align: "right", render: (v: number) => v.toFixed(2) },
    {
      title: "Status",
      width: 120,
      render: (_, r) =>
        r.totalMovement === 0 ? (
          <Tag color="red" icon={<WarningOutlined />}>Dead Stock</Tag>
        ) : (
          <Tag color="orange" icon={<ClockCircleOutlined />}>Slow</Tag>
        ),
    },
  ];

  const fastColumns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    { title: "Avg Daily", dataIndex: "avgDailyConsumption", width: 100, align: "right" },
    { title: "Outbound", dataIndex: "outbound", width: 100, align: "right", render: (v: number) => <span className="text-red-600 font-medium">{v}</span> },
    { title: "Turnover", dataIndex: "turnoverRatio", width: 100, align: "right", render: (v: number) => <span className="text-green-600 font-semibold">{v.toFixed(2)}</span> },
    {
      title: "Status",
      width: 100,
      render: () => <Tag color="green" icon={<ThunderboltOutlined />}>Fast</Tag>,
    },
  ];

  const turnoverColumns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    {
      title: "Turnover Ratio",
      dataIndex: "turnoverRatio",
      width: 120,
      align: "right",
      sorter: (a, b) => a.turnoverRatio - b.turnoverRatio,
      defaultSortOrder: "descend",
      render: (v: number) => (
        <span style={{ color: v > 1 ? "#52c41a" : v > 0.3 ? "#1890ff" : "#ff4d4f", fontWeight: 600 }}>
          {v.toFixed(2)}
        </span>
      ),
    },
    { title: "Avg Daily Consumption", dataIndex: "avgDailyConsumption", width: 150, align: "right" },
    { title: "Total Movement", dataIndex: "totalMovement", width: 120, align: "right" },
    { title: "Transactions", dataIndex: "txCount", width: 100, align: "right" },
  ];

  const getExportData = () => {
    if (activeTab === "slow") return data?.slowMoving || [];
    if (activeTab === "fast") return data?.fastMoving || [];
    return data?.rows || [];
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Radio.Group value={days} onChange={(e) => setDays(e.target.value)}>
          <Radio.Button value="30">30 Days</Radio.Button>
          <Radio.Button value="60">60 Days</Radio.Button>
          <Radio.Button value="90">90 Days</Radio.Button>
        </Radio.Group>
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          onClick={() =>
            exportToExcel("Stock Movement", [
              { header: "Code", key: "itemCode", width: 12 },
              { header: "Item", key: "itemName", width: 25 },
              { header: "UOM", key: "uom", width: 8 },
              { header: "Inbound", key: "inbound", width: 10 },
              { header: "Outbound", key: "outbound", width: 10 },
              { header: "Xfer In", key: "transferIn", width: 10 },
              { header: "Xfer Out", key: "transferOut", width: 10 },
              { header: "Total", key: "totalMovement", width: 10 },
              { header: "Avg Daily", key: "avgDailyConsumption", width: 12 },
              { header: "Turnover", key: "turnoverRatio", width: 10 },
            ], getExportData())
          }
        >
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#1890ff" }}>
          <Statistic title="Total Items" value={totalItems} prefix={<BarChartOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#52c41a" }}>
          <Statistic title="Fast Moving" value={fastCount} prefix={<ThunderboltOutlined />} styles={{ content: { color: "#52c41a" } }} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#faad14" }}>
          <Statistic title="Slow Moving" value={slowCount} prefix={<ClockCircleOutlined />} styles={{ content: { color: slowCount > 0 ? "#faad14" : undefined } }} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#ff4d4f" }}>
          <Statistic title="No Movement" value={noMovement} prefix={<WarningOutlined />} styles={{ content: { color: noMovement > 0 ? "#ff4d4f" : undefined } }} />
        </Card>
      </div>

      {/* Alerts */}
      {noMovement > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${noMovement} item${noMovement > 1 ? "s have" : " has"} had no movement in the last ${days} days. Consider reviewing dead stock.`}
        />
      )}

      {/* Top Movers Chart */}
      {topMovers.length > 0 && (
        <Card title="Top 10 Items by Movement" size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topMovers} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="itemCode" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="inbound" name="Inbound" fill="#52c41a" stackId="a" />
              <Bar dataKey="outbound" name="Outbound" fill="#ff4d4f" stackId="a" />
              <Bar dataKey="transferIn" name="Transfer In" fill="#1890ff" stackId="b" />
              <Bar dataKey="transferOut" name="Transfer Out" fill="#fa8c16" stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tabbed Tables */}
      <Card size="small">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "all",
              label: `All Items (${totalItems})`,
              children: (
                <Table
                  rowKey="itemId"
                  columns={allColumns}
                  dataSource={data?.rows || []}
                  pagination={{ pageSize: 50, showTotal: (t) => `${t} items` }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              ),
            },
            {
              key: "slow",
              label: (
                <span>
                  <ClockCircleOutlined className="mr-1" />
                  Slow Moving ({slowCount})
                </span>
              ),
              children: (
                <Table
                  rowKey="itemId"
                  columns={slowColumns}
                  dataSource={data?.slowMoving || []}
                  pagination={{ pageSize: 50 }}
                  size="small"
                  scroll={{ x: 600 }}
                />
              ),
            },
            {
              key: "fast",
              label: (
                <span>
                  <ThunderboltOutlined className="mr-1" />
                  Fast Moving ({fastCount})
                </span>
              ),
              children: (
                <Table
                  rowKey="itemId"
                  columns={fastColumns}
                  dataSource={data?.fastMoving || []}
                  pagination={{ pageSize: 50 }}
                  size="small"
                  scroll={{ x: 600 }}
                />
              ),
            },
            {
              key: "turnover",
              label: (
                <span>
                  <BarChartOutlined className="mr-1" />
                  Turnover Analysis
                </span>
              ),
              children: (
                <Table
                  rowKey="itemId"
                  columns={turnoverColumns}
                  dataSource={data?.rows || []}
                  pagination={{ pageSize: 50 }}
                  size="small"
                  scroll={{ x: 600 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
