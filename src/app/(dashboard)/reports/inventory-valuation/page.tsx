"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, App } from "antd";
import { DownloadOutlined, DollarOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";

interface Row {
  itemCode: string; itemName: string; uom: string; category: string;
  location: string; locationType: string; quantity: number; avgCost: number; totalValue: number;
}

export default function InventoryValuationReport() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/inventory-valuation");
    const json = await res.json();
    if (json.success) {
      setRows(json.data.rows);
      setTotalValue(json.data.totalValue);
      setTotalQty(json.data.totalQty);
    } else { message.error("Failed to load report"); }
    setLoading(false);
  }, [message]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const columns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "Category", dataIndex: "category", width: 140 },
    { title: "Location", dataIndex: "location", width: 140 },
    { title: "Qty", dataIndex: "quantity", width: 80, align: "right" },
    { title: "Avg Cost", dataIndex: "avgCost", width: 100, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
    { title: "Value", dataIndex: "totalValue", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}`, sorter: (a, b) => a.totalValue - b.totalValue, defaultSortOrder: "descend" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="grid grid-cols-2 gap-4">
          <Card size="small"><Statistic title="Total Value" value={totalValue} precision={2} prefix={<DollarOutlined />} /></Card>
          <Card size="small"><Statistic title="Total Qty" value={totalQty} precision={0} /></Card>
        </div>
        <Button icon={<DownloadOutlined />} onClick={() => exportToExcel("Inventory Valuation", [
          { header: "Code", key: "itemCode", width: 12 }, { header: "Item", key: "itemName", width: 30 },
          { header: "Category", key: "category", width: 18 }, { header: "Location", key: "location", width: 18 },
          { header: "Qty", key: "quantity", width: 10 }, { header: "Avg Cost", key: "avgCost", width: 12 },
          { header: "Value", key: "totalValue", width: 14 },
        ], rows)}>Export</Button>
      </div>
      <Table rowKey={(r) => `${r.itemCode}-${r.location}`} columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 50 }} size="small" />
    </div>
  );
}
