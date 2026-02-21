"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
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
      message.error("Failed to load transfers");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const columns: ColumnsType<TransferRecord> = [
    { title: "Transfer #", dataIndex: "transferNumber", width: 130 },
    {
      title: "From",
      dataIndex: ["fromLocation", "name"],
      ellipsis: true,
    },
    {
      title: "To",
      dataIndex: ["toLocation", "name"],
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: () => <Tag color="green">Approved</Tag>,
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "fullName"],
      width: 140,
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
          Pick & Pack
        </Button>
      ),
    },
  ];

  if (transfers.length === 0 && !loading) {
    return <Empty description="No approved transfers to fulfill" />;
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
