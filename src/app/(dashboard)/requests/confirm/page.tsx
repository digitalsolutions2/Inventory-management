"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface RequestRecord {
  id: string;
  requestNumber: string;
  status: string;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  fulfilledBy: { id: string; fullName: string } | null;
  fulfilledAt: string | null;
  _count: { lines: number };
}

export default function ConfirmQueuePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/internal-requests?status=ISSUED&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setRequests(json.data.data || []);
    } else {
      message.error(t.requests.confirm.failedToLoad);
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const columns: ColumnsType<RequestRecord> = [
    { title: t.requests.confirm.columns.requestNumber, dataIndex: "requestNumber", width: 130 },
    {
      title: t.common.status,
      dataIndex: "status",
      width: 100,
      render: () => <Tag color="blue">{t.requests.statusLabels.FULFILLED}</Tag>,
    },
    {
      title: t.requests.columns.requestedBy,
      dataIndex: ["createdBy", "fullName"],
      width: 150,
    },
    {
      title: t.requests.confirm.fulfilledBy,
      dataIndex: ["fulfilledBy", "fullName"],
      width: 150,
    },
    {
      title: t.requests.confirm.fulfilledAt,
      dataIndex: "fulfilledAt",
      width: 150,
      render: (v: string | null) =>
        v ? dayjs(v).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: t.common.items,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: "",
      width: 110,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => router.push(`/requests/confirm/${record.id}`)}
        >
          {t.common.confirm}
        </Button>
      ),
    },
  ];

  if (requests.length === 0 && !loading) {
    return <Empty description={t.requests.confirm.noIssuedRequests} />;
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
