"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Progress, Card, Statistic, Tag, Skeleton, Empty, App } from "antd";
import {
  DownloadOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";

interface Row {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  rating: number;
  totalPOs: number;
  totalSpend: number;
  receivedPOs: number;
  onTimeRate: number;
  qualityRate: number;
  avgLeadTimeDays: number;
  avgOrderValue: number;
}

function calcScore(r: Row): number {
  return Math.round(r.onTimeRate * 0.4 + r.qualityRate * 0.4 + Math.max(0, 100 - r.avgLeadTimeDays * 2) * 0.2);
}

function scoreColor(score: number): string {
  if (score >= 90) return "#52c41a";
  if (score >= 70) return "#faad14";
  return "#ff4d4f";
}

function scoreTag(score: number) {
  if (score >= 90)
    return (
      <Tag color="green" icon={<TrophyOutlined />}>
        Excellent
      </Tag>
    );
  if (score >= 70) return <Tag color="orange">Good</Tag>;
  return <Tag color="red">Needs Improvement</Tag>;
}

export default function SupplierPerformanceReport() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/supplier-performance");
    const json = await res.json();
    if (json.success) setRows(json.data.suppliers);
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
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const scored = rows.map((r) => ({ ...r, score: calcScore(r) })).sort((a, b) => b.score - a.score);
  const top5 = scored.slice(0, 5);
  const bottom5 = [...scored].sort((a, b) => a.score - b.score).slice(0, 5);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
  const avgOnTime = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.onTimeRate, 0) / scored.length) : 0;
  const avgQuality = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.qualityRate, 0) / scored.length) : 0;

  const columns: ColumnsType<(typeof scored)[0]> = [
    { title: "Code", dataIndex: "supplierCode", width: 80 },
    { title: "Supplier", dataIndex: "supplierName", ellipsis: true },
    { title: "POs", dataIndex: "totalPOs", width: 60, align: "right" },
    {
      title: "Total Spend",
      dataIndex: "totalSpend",
      width: 120,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
      sorter: (a, b) => a.totalSpend - b.totalSpend,
    },
    {
      title: "On-Time %",
      dataIndex: "onTimeRate",
      width: 150,
      render: (v: number) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={scoreColor(v)}
          format={(p) => `${p}%`}
        />
      ),
      sorter: (a, b) => a.onTimeRate - b.onTimeRate,
    },
    {
      title: "Quality %",
      dataIndex: "qualityRate",
      width: 150,
      render: (v: number) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={scoreColor(v)}
          format={(p) => `${p}%`}
        />
      ),
      sorter: (a, b) => a.qualityRate - b.qualityRate,
    },
    {
      title: "Avg Lead Time",
      dataIndex: "avgLeadTimeDays",
      width: 120,
      align: "right",
      render: (v: number) => (v > 0 ? `${v} days` : "-"),
      sorter: (a, b) => a.avgLeadTimeDays - b.avgLeadTimeDays,
    },
    {
      title: "Score",
      dataIndex: "score",
      width: 100,
      align: "center",
      sorter: (a, b) => a.score - b.score,
      defaultSortOrder: "descend",
      render: (v: number) => (
        <span style={{ color: scoreColor(v), fontWeight: 700, fontSize: 16 }}>
          {v}
        </span>
      ),
    },
    {
      title: "Rating",
      width: 140,
      render: (_, r) => scoreTag(r.score),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#1890ff" }}>
          <Statistic title="Total Suppliers" value={scored.length} prefix={<TeamOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#52c41a" }}>
          <Statistic
            title="Avg Performance Score"
            value={avgScore}
            suffix="/100"
            prefix={<TrophyOutlined />}
            styles={{ content: { color: scoreColor(avgScore) } }}
          />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#722ed1" }}>
          <Statistic
            title="Avg On-Time Rate"
            value={avgOnTime}
            suffix="%"
            prefix={<ClockCircleOutlined />}
            styles={{ content: { color: scoreColor(avgOnTime) } }}
          />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#13c2c2" }}>
          <Statistic
            title="Avg Quality Rate"
            value={avgQuality}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            styles={{ content: { color: scoreColor(avgQuality) } }}
          />
        </Card>
      </div>

      {/* Performance Formula */}
      <Card size="small" styles={{ body: { padding: "8px 16px" } }}>
        <span className="text-xs text-gray-500">
          <strong>Performance Score</strong> = On-Time Delivery (40%) + Quality Acceptance (40%) + Lead Time Efficiency (20%)
        </span>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Top 5 Suppliers by Score" size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          {top5.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={top5}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} fontSize={11} />
                <YAxis type="category" dataKey="supplierName" width={100} fontSize={10} />
                <Tooltip formatter={(value) => [`${value}/100`, "Score"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {top5.map((r, i) => (
                    <Cell key={i} fill={scoreColor(r.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Bottom 5 Suppliers by Score" size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          {bottom5.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={bottom5}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} fontSize={11} />
                <YAxis type="category" dataKey="supplierName" width={100} fontSize={10} />
                <Tooltip formatter={(value) => [`${value}/100`, "Score"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {bottom5.map((r, i) => (
                    <Cell key={i} fill={scoreColor(r.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Performance Table */}
      <Card
        title="All Suppliers"
        size="small"
        extra={
          <Button
            icon={<DownloadOutlined />}
            type="primary"
            size="small"
            onClick={() =>
              exportToExcel("Supplier Performance", [
                { header: "Code", key: "supplierCode", width: 10 },
                { header: "Supplier", key: "supplierName", width: 25 },
                { header: "Total POs", key: "totalPOs", width: 10 },
                { header: "Total Spend", key: "totalSpend", width: 15 },
                { header: "Avg Order", key: "avgOrderValue", width: 15 },
                { header: "On-Time %", key: "onTimeRate", width: 12 },
                { header: "Quality %", key: "qualityRate", width: 12 },
                { header: "Avg Lead Time", key: "avgLeadTimeDays", width: 15 },
                { header: "Score", key: "score", width: 10 },
              ], scored)
            }
          >
            Export to Excel
          </Button>
        }
      >
        <Table
          rowKey="supplierId"
          columns={columns}
          dataSource={scored}
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
