"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { CheckSquareOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
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

export default function FulfillQueuePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/internal-requests?status=PENDING&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setRequests(json.data.data || []);
    } else {
      message.error(t.requests.fulfill.failedToLoad);
    }
    setLoading(false);
  }, [message, t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const columns: ColumnsType<RequestRecord> = [
    { title: t.requests.fulfill.columns.requestNumber, dataIndex: "requestNumber", width: 130 },
    {
      title: t.common.status,
      dataIndex: "status",
      width: 160,
      render: (status: string) => {
        const statusKey = status as keyof typeof t.requests.statusLabels;
        const label = t.requests.statusLabels[statusKey] || status;
        const colorMap: Record<string, string> = {
          PENDING: "orange",
          APPROVED: "blue",
          FULFILLED: "blue",
          COMPLETED: "green",
          CANCELLED: "red",
        };
        return <Tag color={colorMap[status] || "default"}>{label}</Tag>;
      },
    },
    {
      title: t.requests.fulfill.columns.requestedBy,
      dataIndex: ["createdBy", "fullName"],
      width: 150,
    },
    {
      title: t.requests.fulfill.columns.items,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: t.requests.fulfill.columns.date,
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
          {t.requests.fulfill.fulfillRequest}
        </Button>
      ),
    },
  ];

  if (requests.length === 0 && !loading) {
    return <Empty description={t.requests.fulfill.noPendingRequests} />;
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
