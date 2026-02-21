"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty, Popconfirm, Input } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user";
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
      message.error("Failed to load transfers");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
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
        action === "approve" ? "Transfer approved!" : "Transfer rejected."
      );
      setRejectReason("");
      fetchTransfers();
    } else {
      message.error(json.error || `Failed to ${action}`);
    }
  };

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
      width: 100,
      render: () => <Tag color="orange">Pending</Tag>,
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
            >
              Approve
            </Button>
            <Popconfirm
              title="Reject Transfer"
              description={
                <Input.TextArea
                  rows={2}
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              }
              onConfirm={() => handleAction(record.id, "reject")}
              okText="Reject"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" icon={<CloseOutlined />}>
                Reject
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  if (transfers.length === 0 && !loading) {
    return <Empty description="No transfers pending approval" />;
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
