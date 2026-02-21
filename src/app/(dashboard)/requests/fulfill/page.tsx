"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { CheckSquareOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface RequestRecord {
  id: string;
  requestNumber: string;
  status: string;
  notes: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  fulfilledBy: { id: string; fullName: string } | null;
  fulfilledAt: string | null;
  _count: { lines: number };
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: "orange", label: "Pending Fulfillment" },
  ISSUED: { color: "blue", label: "Issued" },
  CONFIRMED: { color: "green", label: "Confirmed" },
  CANCELLED: { color: "red", label: "Cancelled" },
};

export default function FulfillQueuePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/internal-requests?status=PENDING&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setRequests(json.data.data || []);
    } else {
      message.error("Failed to load requests");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const columns: ColumnsType<RequestRecord> = [
    { title: "Request #", dataIndex: "requestNumber", width: 130 },
    {
      title: "Status",
      dataIndex: "status",
      width: 160,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] || { color: "default", label: status };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Requested By",
      dataIndex: ["createdBy", "fullName"],
      width: 150,
    },
    {
      title: "Items",
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 150,
      render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm"),
    },
    {
      title: "",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckSquareOutlined />}
          onClick={() => router.push(`/requests/fulfill/${record.id}`)}
        >
          Fulfill
        </Button>
      ),
    },
  ];

  if (requests.length === 0 && !loading) {
    return <Empty description="No pending requests to fulfill" />;
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={requests}
      loading={loading}
      pagination={false}
      size="small"
    />
  );
}
