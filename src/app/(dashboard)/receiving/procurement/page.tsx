"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, App, Empty } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ReceivingStatusTag } from "@/components/receiving/receiving-status-tag";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
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
      message.error(t.procurement.failedToLoad);
    }
    setLoadingPOs(false);
  }, [message, t]);

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
    { title: t.receiving.procurement.columns.poNumber, dataIndex: "poNumber", width: 130 },
    { title: t.receiving.procurement.columns.supplier, dataIndex: ["supplier", "name"], ellipsis: true },
    {
      title: t.receiving.procurement.columns.totalAmount,
      dataIndex: "totalAmount",
      width: 130,
      align: "right",
      render: (v: number, r) => `${r.currency} ${v.toFixed(2)}`,
    },
    {
      title: t.receiving.procurement.columns.items,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: t.procurement.columns.createdBy,
      dataIndex: ["createdBy", "fullName"],
      width: 140,
    },
    {
      title: t.procurement.columns.created,
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
          {t.receiving.procurement.receiveGoods}
        </Button>
      ),
    },
  ];

  const rcvColumns: ColumnsType<ReceivingRecord> = [
    { title: t.receiving.qc.columns.grn, dataIndex: "receivingNumber", width: 170 },
    {
      title: t.receiving.qc.columns.poNumber,
      dataIndex: ["purchaseOrder", "poNumber"],
      width: 130,
    },
    {
      title: t.receiving.procurement.columns.supplier,
      dataIndex: ["purchaseOrder", "supplier", "name"],
      ellipsis: true,
    },
    {
      title: t.receiving.procurement.columns.status,
      dataIndex: "status",
      width: 170,
      render: (status: string) => <ReceivingStatusTag status={status} />,
    },
    {
      title: t.receiving.procurement.verifiedBy,
      dataIndex: ["procVerifiedBy", "fullName"],
      width: 140,
    },
    {
      title: t.receiving.procurement.verifiedAt,
      dataIndex: "procVerifiedAt",
      width: 140,
      render: (v: string | null) =>
        v ? dayjs(v).format("DD MMM YYYY HH:mm") : "-",
    },
    {
      title: t.receiving.procurement.columns.items,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {t.receiving.procurement.title}
        </h2>
        {pos.length === 0 && !loadingPOs ? (
          <Empty description={t.receiving.procurement.noItemsToReceive} />
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
          {t.receiving.procurement.recentlyVerified}
        </h2>
        {receivings.length === 0 && !loadingRcv ? (
          <Empty description={t.receiving.procurement.noRecentlyVerified} />
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
