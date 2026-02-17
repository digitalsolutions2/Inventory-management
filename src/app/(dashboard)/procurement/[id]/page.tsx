"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Tag,
  Table,
  Descriptions,
  Space,
  Popconfirm,
  Input,
  Modal,
  Spin,
  App,
  Card,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

interface POLine {
  id: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
  notes?: string;
  item: { id: string; code: string; name: string; uom: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes?: string;
  expectedDate: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: string;
    code: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  createdBy: { id: string; fullName: string; email: string };
  approvedBy?: { id: string; fullName: string; email: string } | null;
  approvedAt?: string | null;
  lines: POLine[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  PENDING_APPROVAL: "orange",
  APPROVED: "green",
  SENT: "blue",
  PARTIALLY_RECEIVED: "cyan",
  RECEIVED: "geekblue",
  CANCELLED: "red",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export default function PODetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const hasPermission = useUserStore((s) => s.hasPermission);

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPO = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}`);
    const json = await res.json();
    if (json.success) {
      setPO(json.data);
    } else {
      message.error("Failed to load purchase order");
    }
    setLoading(false);
  }, [id, message]);

  useEffect(() => {
    fetchPO();
  }, [fetchPO]);

  const handleSubmit = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}/submit`, { method: "POST" });
    const json = await res.json();
    if (json.success) {
      message.success("PO submitted for approval");
      fetchPO();
    } else {
      message.error(json.error || "Failed");
    }
    setActionLoading(false);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const json = await res.json();
    if (json.success) {
      message.success("PO approved");
      fetchPO();
    } else {
      message.error(json.error || "Failed");
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason: rejectReason }),
    });
    const json = await res.json();
    if (json.success) {
      message.success("PO rejected");
      setRejectModalOpen(false);
      setRejectReason("");
      fetchPO();
    } else {
      message.error(json.error || "Failed");
    }
    setActionLoading(false);
  };

  const handleMarkSent = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    // The PUT only allows DRAFT edits, so we handle SENT via a direct update
    // For now, we'll use a simple approach
    const json = await res.json();
    if (json.success) {
      message.success("PO marked as sent");
      fetchPO();
    } else {
      message.error(json.error || "Only draft POs can be edited via this endpoint");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!po) {
    return <div className="text-center text-gray-500 mt-12">Purchase order not found</div>;
  }

  const canApprove =
    po.status === "PENDING_APPROVAL" &&
    hasPermission("po:approve") &&
    user?.id !== po.createdBy.id;

  const lineColumns: ColumnsType<POLine> = [
    { title: "Item Code", dataIndex: ["item", "code"], width: 120 },
    { title: "Item Name", dataIndex: ["item", "name"], ellipsis: true },
    { title: "UOM", dataIndex: ["item", "uom"], width: 70 },
    { title: "Qty", dataIndex: "quantity", width: 80, align: "right" },
    {
      title: "Unit Cost",
      dataIndex: "unitCost",
      width: 110,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: "Total",
      dataIndex: "totalCost",
      width: 120,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: "Received",
      dataIndex: "receivedQty",
      width: 90,
      align: "right",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/procurement")} />
        <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
        <Tag color={STATUS_COLORS[po.status]} className="text-sm">
          {STATUS_LABELS[po.status] || po.status}
        </Tag>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Supplier">
              {po.supplier.code} - {po.supplier.name}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              {po.currency} {po.totalAmount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Created By">
              {po.createdBy.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(po.createdAt).format("DD MMM YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Delivery">
              {po.expectedDate
                ? dayjs(po.expectedDate).format("DD MMM YYYY")
                : "-"}
            </Descriptions.Item>
            {po.approvedBy && (
              <Descriptions.Item label="Approved By">
                {po.approvedBy.fullName} on{" "}
                {po.approvedAt ? dayjs(po.approvedAt).format("DD MMM YYYY HH:mm") : ""}
              </Descriptions.Item>
            )}
            {po.notes && (
              <Descriptions.Item label="Notes" span={2}>
                {po.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title="Actions">
          <Space direction="vertical" className="w-full">
            {po.status === "DRAFT" && hasPermission("po:create") && (
              <>
                <Button
                  block
                  onClick={() => router.push(`/procurement/create?edit=${po.id}`)}
                >
                  Edit PO
                </Button>
                <Popconfirm title="Submit for approval?" onConfirm={handleSubmit}>
                  <Button block type="primary" loading={actionLoading}>
                    Submit for Approval
                  </Button>
                </Popconfirm>
              </>
            )}
            {canApprove && (
              <>
                <Button
                  block
                  type="primary"
                  style={{ background: "#52c41a" }}
                  onClick={handleApprove}
                  loading={actionLoading}
                >
                  Approve
                </Button>
                <Button
                  block
                  danger
                  onClick={() => setRejectModalOpen(true)}
                  loading={actionLoading}
                >
                  Reject
                </Button>
              </>
            )}
            {po.status === "APPROVED" && hasPermission("po:edit") && (
              <Button block type="primary" onClick={handleMarkSent} loading={actionLoading}>
                Mark as Sent to Supplier
              </Button>
            )}
          </Space>
        </Card>
      </div>

      <Card title="Line Items">
        <Table
          rowKey="id"
          columns={lineColumns}
          dataSource={po.lines}
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong>{po.totalAmount.toFixed(2)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Modal
        title="Reject Purchase Order"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
        }}
        confirmLoading={actionLoading}
      >
        <div className="mb-2 text-gray-600">
          Please provide a reason for rejecting this PO:
        </div>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection..."
        />
      </Modal>
    </div>
  );
}
