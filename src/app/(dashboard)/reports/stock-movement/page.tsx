"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Radio, Tag, App } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";

interface Row {
  itemId: string; itemCode: string; itemName: string; uom: string;
  inbound: number; outbound: number; transferIn: number; transferOut: number;
  totalMovement: number; txCount: number; avgDailyConsumption: number; turnoverRatio: number;
}

interface Data { period: string; rows: Row[]; slowMoving: Row[]; fastMoving: Row[]; }

export default function StockMovementReport() {
  const { message } = App.useApp();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [view, setView] = useState<"all" | "slow" | "fast">("all");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/stock-movement?days=${days}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    else message.error("Failed to load report");
    setLoading(false);
  }, [days, message]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const displayRows = view === "slow" ? data?.slowMoving : view === "fast" ? data?.fastMoving : data?.rows;

  const columns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    { title: "Inbound", dataIndex: "inbound", width: 90, align: "right", render: (v: number) => v > 0 ? <span className="text-green-600">{v}</span> : "-" },
    { title: "Outbound", dataIndex: "outbound", width: 90, align: "right", render: (v: number) => v > 0 ? <span className="text-red-600">{v}</span> : "-" },
    { title: "Xfer In", dataIndex: "transferIn", width: 80, align: "right", render: (v: number) => v > 0 ? v : "-" },
    { title: "Xfer Out", dataIndex: "transferOut", width: 80, align: "right", render: (v: number) => v > 0 ? v : "-" },
    { title: "Total", dataIndex: "totalMovement", width: 80, align: "right", sorter: (a, b) => a.totalMovement - b.totalMovement },
    { title: "Avg Daily", dataIndex: "avgDailyConsumption", width: 90, align: "right" },
    {
      title: "Activity", width: 100,
      render: (_, r) => {
        if (r.totalMovement === 0) return <Tag color="red">No Movement</Tag>;
        if (r.outbound > r.inbound) return <Tag color="green">Fast</Tag>;
        return <Tag color="blue">Normal</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <Radio.Group value={days} onChange={(e) => setDays(e.target.value)}>
            <Radio.Button value="30">30 Days</Radio.Button>
            <Radio.Button value="60">60 Days</Radio.Button>
            <Radio.Button value="90">90 Days</Radio.Button>
          </Radio.Group>
          <Radio.Group value={view} onChange={(e) => setView(e.target.value)}>
            <Radio.Button value="all">All Items</Radio.Button>
            <Radio.Button value="slow">Slow Moving</Radio.Button>
            <Radio.Button value="fast">Fast Moving</Radio.Button>
          </Radio.Group>
        </div>
        <Button icon={<DownloadOutlined />} onClick={() => displayRows && exportToExcel("Stock Movement", [
          { header: "Code", key: "itemCode", width: 12 }, { header: "Item", key: "itemName", width: 25 },
          { header: "Inbound", key: "inbound", width: 10 }, { header: "Outbound", key: "outbound", width: 10 },
          { header: "Xfer In", key: "transferIn", width: 10 }, { header: "Xfer Out", key: "transferOut", width: 10 },
          { header: "Total", key: "totalMovement", width: 10 }, { header: "Avg Daily", key: "avgDailyConsumption", width: 12 },
        ], displayRows)}>Export</Button>
      </div>

      <Table rowKey="itemId" columns={columns} dataSource={displayRows || []} loading={loading} pagination={{ pageSize: 50 }} size="small" />
    </div>
  );
}
