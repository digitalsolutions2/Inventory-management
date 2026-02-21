"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, Select, DatePicker, App } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Row {
  id: string; date: string; type: string; itemCode: string; itemName: string;
  uom: string; location: string; quantity: number; unitCost: number | null;
  referenceType: string | null; notes: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  INBOUND: "green", OUTBOUND: "red", TRANSFER_IN: "blue", TRANSFER_OUT: "orange", ADJUSTMENT: "purple",
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
    if (json.success) { setRows(json.data.rows); setTotal(json.data.total); }
    else message.error("Failed to load report");
    setLoading(false);
  }, [page, typeFilter, dateRange, message]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const columns: ColumnsType<Row> = [
    { title: "Date", dataIndex: "date", width: 150, render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm") },
    { title: "Type", dataIndex: "type", width: 120, render: (v: string) => <Tag color={TYPE_COLORS[v]}>{v.replace("_", " ")}</Tag> },
    { title: "Item Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "Location", dataIndex: "location", width: 130 },
    { title: "Qty", dataIndex: "quantity", width: 80, align: "right" },
    { title: "Unit Cost", dataIndex: "unitCost", width: 100, align: "right", render: (v: number | null) => v ? `$${v.toFixed(2)}` : "-" },
    { title: "Reference", dataIndex: "referenceType", width: 120, render: (v: string | null) => v || "-" },
    { title: "Notes", dataIndex: "notes", ellipsis: true, render: (v: string | null) => v || "-" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <Select
            placeholder="Transaction type"
            value={typeFilter || undefined}
            onChange={(v) => { setTypeFilter(v || ""); setPage(1); }}
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
        <Button icon={<DownloadOutlined />} onClick={() => exportToExcel("Transaction History", [
          { header: "Date", key: "date", width: 20 }, { header: "Type", key: "type", width: 15 },
          { header: "Item Code", key: "itemCode", width: 12 }, { header: "Item", key: "itemName", width: 25 },
          { header: "Location", key: "location", width: 18 }, { header: "Qty", key: "quantity", width: 10 },
          { header: "Unit Cost", key: "unitCost", width: 12 }, { header: "Reference", key: "referenceType", width: 15 },
          { header: "Notes", key: "notes", width: 25 },
        ], rows)}>Export</Button>
      </div>

      <Table
        rowKey="id" columns={columns} dataSource={rows} loading={loading} size="small"
        pagination={{ current: page, pageSize: 50, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} transactions` }}
      />
    </div>
  );
}
