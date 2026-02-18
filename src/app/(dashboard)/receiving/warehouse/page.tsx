"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ReceivingStatusTag } from "@/components/receiving/receiving-status-tag";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface ReceivingRecord {
  id: string;
  receivingNumber: string;
  status: string;
  qcResult: string | null;
  qcInspectedAt: string | null;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { id: string; name: string; code: string };
  };
  qcInspectedBy: { id: string; fullName: string } | null;
  _count: { lines: number };
}

const QC_RESULT_COLORS: Record<string, string> = {
  ACCEPTED: "green",
  PARTIAL: "orange",
  REJECTED: "red",
};

export default function WarehouseQueuePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [receivings, setReceivings] = useState<ReceivingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/receiving?status=QC_APPROVED&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setReceivings(json.data.data || []);
    } else {
      message.error("Failed to load receiving records");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchReceivings();
  }, [fetchReceivings]);

  const columns: ColumnsType<ReceivingRecord> = [
    { title: "Receiving #", dataIndex: "receivingNumber", width: 170 },
    {
      title: "PO #",
      dataIndex: ["purchaseOrder", "poNumber"],
      width: 130,
    },
    {
      title: "Supplier",
      dataIndex: ["purchaseOrder", "supplier", "name"],
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 170,
      render: (status: string) => <ReceivingStatusTag status={status} />,
    },
    {
      title: "QC Result",
      dataIndex: "qcResult",
      width: 120,
      render: (v: string | null) =>
        v ? <Tag color={QC_RESULT_COLORS[v]}>{v}</Tag> : "-",
    },
    {
      title: "QC By",
      dataIndex: ["qcInspectedBy", "fullName"],
      width: 140,
    },
    {
      title: "QC At",
      dataIndex: "qcInspectedAt",
      width: 150,
      render: (v: string | null) =>
        v ? dayjs(v).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: "Items",
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: "",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<InboxOutlined />}
          onClick={() => router.push(`/receiving/warehouse/${record.id}`)}
        >
          Receive
        </Button>
      ),
    },
  ];

  if (receivings.length === 0 && !loading) {
    return (
      <Empty description="No receiving records pending warehouse receipt" />
    );
  }

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={receivings}
      loading={loading}
      pagination={false}
      size="small"
    />
  );
}
