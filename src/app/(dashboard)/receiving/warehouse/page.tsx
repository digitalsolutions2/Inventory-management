"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ReceivingStatusTag } from "@/components/receiving/receiving-status-tag";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
  const [receivings, setReceivings] = useState<ReceivingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/receiving?status=QC_APPROVED&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setReceivings(json.data.data || []);
    } else {
      message.error(t.receiving.qc.failedToLoad);
    }
    setLoading(false);
  }, [message, t]);

  useEffect(() => {
    fetchReceivings();
  }, [fetchReceivings]);

  const columns: ColumnsType<ReceivingRecord> = [
    { title: t.receiving.warehouse.columns.grn, dataIndex: "receivingNumber", width: 170 },
    {
      title: t.receiving.warehouse.columns.poNumber,
      dataIndex: ["purchaseOrder", "poNumber"],
      width: 130,
    },
    {
      title: t.receiving.warehouse.columns.supplier,
      dataIndex: ["purchaseOrder", "supplier", "name"],
      ellipsis: true,
    },
    {
      title: t.receiving.warehouse.columns.status,
      dataIndex: "status",
      width: 170,
      render: (status: string) => <ReceivingStatusTag status={status} />,
    },
    {
      title: t.receiving.warehouse.qcResult,
      dataIndex: "qcResult",
      width: 120,
      render: (v: string | null) =>
        v ? <Tag color={QC_RESULT_COLORS[v]}>{v}</Tag> : "-",
    },
    {
      title: t.receiving.warehouse.qcBy,
      dataIndex: ["qcInspectedBy", "fullName"],
      width: 140,
    },
    {
      title: t.receiving.warehouse.columns.qcDate,
      dataIndex: "qcInspectedAt",
      width: 150,
      render: (v: string | null) =>
        v ? dayjs(v).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: t.receiving.warehouse.columns.items,
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
          {t.receiving.warehouse.putaway}
        </Button>
      ),
    },
  ];

  if (receivings.length === 0 && !loading) {
    return (
      <Empty description={t.receiving.warehouse.pendingPutaway} />
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
