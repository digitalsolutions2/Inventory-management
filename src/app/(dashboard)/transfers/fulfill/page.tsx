"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface TransferRecord {
  id: string;
  transferNumber: string;
  status: string;
  createdAt: string;
  fromLocation: { id: string; code: string; name: string; type: string };
  toLocation: { id: string; code: string; name: string; type: string };
  createdBy: { id: string; fullName: string };
  approvedBy: { id: string; fullName: string } | null;
  _count: { lines: number };
}

export default function FulfillTransfersPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const router = useRouter();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/transfers?status=APPROVED&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setTransfers(json.data.data || []);
    } else {
      message.error(t.transfers.fulfill.failedToLoad);
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const columns: ColumnsType<TransferRecord> = [
    { title: t.transfers.columns.transferNumber, dataIndex: "transferNumber", width: 130 },
    {
      title: t.transfers.columns.from,
      dataIndex: ["fromLocation", "name"],
      ellipsis: true,
    },
    {
      title: t.transfers.columns.to,
      dataIndex: ["toLocation", "name"],
      ellipsis: true,
    },
    {
      title: t.transfers.columns.status,
      dataIndex: "status",
      width: 110,
      render: () => <Tag color="green">{t.transfers.statusLabels.APPROVED}</Tag>,
    },
    {
      title: t.transfers.columns.createdBy,
      dataIndex: ["createdBy", "fullName"],
      width: 140,
    },
    {
      title: t.transfers.columns.items,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: t.transfers.columns.createdAt,
      dataIndex: "createdAt",
      width: 140,
      render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm"),
    },
    {
      title: "",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          onClick={() => router.push(`/transfers/fulfill/${record.id}`)}
        >
          {t.transfers.fulfill.fulfillTransfer}
        </Button>
      ),
    },
  ];

  if (transfers.length === 0 && !loading) {
    return <Empty description={t.transfers.fulfill.noApprovedTransfers} />;
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={transfers}
      loading={loading}
      pagination={false}
      size="small"
    />
  );
}
