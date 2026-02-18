"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, App, Empty } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ReceivingStatusTag } from "@/components/receiving/receiving-status-tag";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  supplier: { id: string; name: string; code: string };
  createdBy: { id: string; fullName: string };
  _count: { lines: number };
}

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

export default function ProcurementQueuePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [receivings, setReceivings] = useState<ReceivingRecord[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [loadingRcv, setLoadingRcv] = useState(true);

  const fetchPOs = useCallback(async () => {
    setLoadingPOs(true);
    const res = await fetch("/api/purchase-orders?status=APPROVED&pageSize=50");
    const json = await res.json();
    if (json.success) {
      // Also fetch SENT POs
      const res2 = await fetch("/api/purchase-orders?status=SENT&pageSize=50");
      const json2 = await res2.json();
      const allPOs = [...(json.data.data || [])];
      if (json2.success) allPOs.push(...(json2.data.data || []));
      setPos(allPOs);
    } else {
      message.error("Failed to load purchase orders");
    }
    setLoadingPOs(false);
  }, [message]);

  const fetchReceivings = useCallback(async () => {
    setLoadingRcv(true);
    const res = await fetch("/api/receiving?status=PROC_VERIFIED&pageSize=50");
    const json = await res.json();
    if (json.success) {
      setReceivings(json.data.data || []);
    }
    setLoadingRcv(false);
  }, []);

  useEffect(() => {
    fetchPOs();
    fetchReceivings();
  }, [fetchPOs, fetchReceivings]);

  const poColumns: ColumnsType<PurchaseOrder> = [
    { title: "PO Number", dataIndex: "poNumber", width: 130 },
    { title: "Supplier", dataIndex: ["supplier", "name"], ellipsis: true },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      width: 130,
      align: "right",
      render: (v: number, r) => `${r.currency} ${v.toFixed(2)}`,
    },
    {
      title: "Items",
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "fullName"],
      width: 140,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 110,
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "",
      width: 140,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => router.push(`/receiving/procurement/${record.id}`)}
        >
          Start Receiving
        </Button>
      ),
    },
  ];

  const rcvColumns: ColumnsType<ReceivingRecord> = [
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
      width: 140,
      render: (v: string | null) =>
        v ? dayjs(v).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: "Items",
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          POs Ready for Receiving
        </h2>
        {pos.length === 0 && !loadingPOs ? (
          <Empty description="No approved POs pending receiving" />
        ) : (
          <Table
            rowKey="id"
            columns={poColumns}
            dataSource={pos}
            loading={loadingPOs}
            pagination={false}
            size="small"
          />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Recently Verified
        </h2>
        {receivings.length === 0 && !loadingRcv ? (
          <Empty description="No recently verified receiving records" />
        ) : (
          <Table
            rowKey="id"
            columns={rcvColumns}
            dataSource={receivings}
            loading={loadingRcv}
            pagination={false}
            size="small"
          />
        )}
      </div>
    </div>
  );
}
