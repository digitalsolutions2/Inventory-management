"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Select, DatePicker, Tag, App } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportToExcel } from "@/lib/export-excel";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
}

const ENTITY_COLORS: Record<string, string> = {
  PurchaseOrder: "blue", Receiving: "green", InternalRequest: "orange",
  Transfer: "cyan", Payment: "purple", Item: "default", Location: "default",
};

export default function AuditLogsPage() {
  const { message } = App.useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (entityType) params.set("entityType", entityType);
    if (dateRange[0]) params.set("dateFrom", dateRange[0].toISOString());
    if (dateRange[1]) params.set("dateTo", dateRange[1].toISOString());

    const res = await fetch(`/api/audit-logs?${params}`);
    const json = await res.json();
    if (json.success) { setLogs(json.data.data); setTotal(json.data.total); }
    else message.error("Failed to load audit logs");
    setLoading(false);
  }, [page, entityType, dateRange, message]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Timestamp", dataIndex: "createdAt", width: 170,
      render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm:ss"),
    },
    { title: "User", dataIndex: ["user", "fullName"], width: 150, render: (v: string | undefined) => v || "System" },
    { title: "Action", dataIndex: "action", width: 180, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: "Entity", dataIndex: "entityType", width: 140,
      render: (v: string) => <Tag color={ENTITY_COLORS[v] || "default"}>{v}</Tag>,
    },
    { title: "Entity ID", dataIndex: "entityId", width: 120, ellipsis: true, render: (v: string | null) => v ? v.slice(0, 8) + "..." : "-" },
    {
      title: "Changes", width: 200, ellipsis: true,
      render: (_, r) => {
        if (r.afterData) return <span className="text-xs text-gray-500">{JSON.stringify(r.afterData).slice(0, 80)}</span>;
        return "-";
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <Select
              placeholder="Entity type"
              value={entityType || undefined}
              onChange={(v) => { setEntityType(v || ""); setPage(1); }}
              allowClear
              className="w-48"
              options={[
                { value: "PurchaseOrder", label: "Purchase Orders" },
                { value: "Receiving", label: "Receiving" },
                { value: "InternalRequest", label: "Internal Requests" },
                { value: "Transfer", label: "Transfers" },
                { value: "Payment", label: "Payments" },
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
          <Button icon={<DownloadOutlined />} onClick={() => exportToExcel("Audit Logs", [
            { header: "Timestamp", key: "createdAt", width: 22 }, { header: "User", key: "userName", width: 20 },
            { header: "Action", key: "action", width: 20 }, { header: "Entity", key: "entityType", width: 18 },
            { header: "Entity ID", key: "entityId", width: 38 },
          ], logs.map(l => ({ ...l, userName: l.user?.fullName || "System" })))}>Export</Button>
        </div>

        <Table
          rowKey="id" columns={columns} dataSource={logs} loading={loading} size="small"
          pagination={{ current: page, pageSize: 50, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} logs` }}
        />
      </div>
    </div>
  );
}
