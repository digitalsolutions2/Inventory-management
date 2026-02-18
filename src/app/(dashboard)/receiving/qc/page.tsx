"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, App, Empty } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ReceivingStatusTag } from "@/components/receiving/receiving-status-tag";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface ReceivingRecord {
  id: string;
  receivingNumber: string;
  status: string;
  procVerifiedAt: string | null;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { id: string; name: string; code: string };
  };
  procVerifiedBy: { id: string; fullName: string } | null;
  _count: { lines: number };
}

export default function QCQueuePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [receivings, setReceivings] = useState<ReceivingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/receiving?status=PROC_VERIFIED&pageSize=50");
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
      title: "Verified By",
      dataIndex: ["procVerifiedBy", "fullName"],
      width: 140,
    },
    {
      title: "Verified At",
      dataIndex: "procVerifiedAt",
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
          icon={<ExperimentOutlined />}
          onClick={() => router.push(`/receiving/qc/${record.id}`)}
        >
          Inspect
        </Button>
      ),
    },
  ];

  if (receivings.length === 0 && !loading) {
    return (
      <Empty description="No receiving records pending QC inspection" />
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
