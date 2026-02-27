"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty, Popconfirm, Input } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface TransferRecord {
  id: string;
  transferNumber: string;
  status: string;
  notes: string | null;
  createdAt: string;
  fromLocation: { id: string; code: string; name: string };
  toLocation: { id: string; code: string; name: string };
  createdBy: { id: string; fullName: string };
  _count: { lines: number };
}

export default function PendingApprovalsPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/transfers?status=PENDING&pageSize=50");
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

  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transfers/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "reject" && { reason: rejectReason }),
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(
          action === "approve" ? t.transfers.pending.transferApproved : t.transfers.pending.transferRejected
        );
        setRejectReason("");
        fetchTransfers();
      } else {
        message.error(json.error || (action === "approve" ? t.transfers.pending.failedToApprove : t.transfers.pending.failedToReject));
      }
    } catch {
      message.error(t.common.networkError);
    }
    setActionLoading(false);
  };

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
      width: 100,
      render: () => <Tag color="orange">{t.transfers.statusLabels.PENDING_APPROVAL}</Tag>,
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
      width: 180,
      render: (_, record) => {
        const canApprove =
          hasPermission("transfers:approve") &&
          record.createdBy.id !== user?.id;

        if (!canApprove) return null;

        return (
          <div className="flex gap-1">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAction(record.id, "approve")}
              loading={actionLoading}
            >
              {t.transfers.pending.approveTransfer}
            </Button>
            <Popconfirm
              title={t.transfers.pending.rejectTitle}
              description={
                <Input.TextArea
                  rows={2}
                  placeholder={t.transfers.pending.rejectPlaceholder}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              }
              onConfirm={() => handleAction(record.id, "reject")}
              okText={t.common.reject}
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<CloseOutlined />} disabled={actionLoading}>
                {t.transfers.pending.rejectTransfer}
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  if (transfers.length === 0 && !loading) {
    return <Empty description={t.transfers.pending.noPendingTransfers} />;
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
