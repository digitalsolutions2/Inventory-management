"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Progress, App } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";

interface Row {
  supplierId: string; supplierCode: string; supplierName: string; rating: number;
  totalPOs: number; totalSpend: number; receivedPOs: number;
  onTimeRate: number; qualityRate: number; avgLeadTimeDays: number; avgOrderValue: number;
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

  useEffect(() => { fetch_(); }, [fetch_]);

  const rateColor = (v: number) => {
    if (v >= 90) return "#52c41a";
    if (v >= 70) return "#faad14";
    return "#ff4d4f";
  };

  const columns: ColumnsType<Row> = [
    { title: "Code", dataIndex: "supplierCode", width: 80 },
    { title: "Supplier", dataIndex: "supplierName", ellipsis: true },
    { title: "Total POs", dataIndex: "totalPOs", width: 80, align: "right" },
    { title: "Total Spend", dataIndex: "totalSpend", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}`, sorter: (a, b) => a.totalSpend - b.totalSpend, defaultSortOrder: "descend" },
    { title: "Avg Order", dataIndex: "avgOrderValue", width: 110, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
    {
      title: "On-Time Rate", dataIndex: "onTimeRate", width: 140,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={rateColor(v)} format={(p) => `${p}%`} />,
      sorter: (a, b) => a.onTimeRate - b.onTimeRate,
    },
    {
      title: "Quality Rate", dataIndex: "qualityRate", width: 140,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={rateColor(v)} format={(p) => `${p}%`} />,
      sorter: (a, b) => a.qualityRate - b.qualityRate,
    },
    { title: "Avg Lead Time", dataIndex: "avgLeadTimeDays", width: 120, align: "right", render: (v: number) => v > 0 ? `${v} days` : "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<DownloadOutlined />} onClick={() => exportToExcel("Supplier Performance", [
          { header: "Code", key: "supplierCode", width: 10 }, { header: "Supplier", key: "supplierName", width: 25 },
          { header: "Total POs", key: "totalPOs", width: 10 }, { header: "Total Spend", key: "totalSpend", width: 15 },
          { header: "Avg Order", key: "avgOrderValue", width: 15 }, { header: "On-Time %", key: "onTimeRate", width: 12 },
          { header: "Quality %", key: "qualityRate", width: 12 }, { header: "Avg Lead Time", key: "avgLeadTimeDays", width: 15 },
        ], rows)}>Export</Button>
      </div>

      <Table rowKey="supplierId" columns={columns} dataSource={rows} loading={loading} pagination={false} size="small" />
    </div>
  );
}
