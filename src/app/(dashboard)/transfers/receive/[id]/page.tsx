"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  InputNumber,
  Input,
  Descriptions,
  Table,
  Alert,
  Spin,
  Steps,
  App,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface TransferLine {
  id: string;
  itemId: string;
  quantity: number;
  receivedQty: number;
  notes: string | null;
  item: { id: string; code: string; name: string; uom: string };
}

interface TransferDetail {
  id: string;
  transferNumber: string;
  status: string;
  notes: string | null;
  createdAt: string;
  fromLocation: { id: string; code: string; name: string; type: string };
  toLocation: { id: string; code: string; name: string; type: string };
  createdBy: { id: string; fullName: string };
  approvedBy: { id: string; fullName: string } | null;
  approvedAt: string | null;
  fulfilledBy: { id: string; fullName: string } | null;
  fulfilledAt: string | null;
  receivedBy: { id: string; fullName: string } | null;
  receivedAt: string | null;
  lines: TransferLine[];
}

interface LineInput {
  id: string;
  receivedQty: number;
  notes: string;
}

export default function ReceiveTransferPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineInputs, setLineInputs] = useState<LineInput[]>([]);
  const [receiveNotes, setReceiveNotes] = useState("");

  const fetchTransfer = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/transfers/${id}`);
    const json = await res.json();
    if (json.success) {
      setTransfer(json.data);
      setLineInputs(
        json.data.lines.map((l: TransferLine) => ({
          id: l.id,
          receivedQty: l.quantity, // Default: receive all
          notes: "",
        }))
      );
    } else {
      message.error("Failed to load transfer");
    }
    setLoading(false);
  }, [id, message]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  const updateLine = (lineId: string, field: string, value: unknown) => {
    setLineInputs((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async () => {
    if (!transfer) return;

    setSubmitting(true);
    const res = await fetch(`/api/transfers/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lineInputs,
        notes: receiveNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      message.success(
        `Transfer received! Items added to ${transfer.toLocation.name}.`
      );
      router.push("/transfers/receive");
    } else {
      message.error(json.error || "Failed to receive transfer");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!transfer) {
    return <Alert type="error" message="Transfer not found" showIcon />;
  }

  // Determine step status
  const getStepCurrent = () => {
    switch (transfer.status) {
      case "PENDING":
        return 0;
      case "APPROVED":
        return 1;
      case "IN_TRANSIT":
        return 2;
      case "RECEIVED":
        return 3;
      default:
        return 0;
    }
  };

  const columns: ColumnsType<TransferLine> = [
    { title: "Item Code", dataIndex: ["item", "code"], width: 120 },
    { title: "Item Name", dataIndex: ["item", "name"], ellipsis: true },
    { title: "UOM", dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: "Shipped",
      dataIndex: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Received Qty",
      width: 120,
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return (
          <InputNumber
            min={0}
            max={record.quantity}
            value={input?.receivedQty}
            onChange={(val) => updateLine(record.id, "receivedQty", val || 0)}
            size="small"
            className="w-full"
          />
        );
      },
    },
    {
      title: "Match?",
      width: 80,
      align: "center",
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return input?.receivedQty === record.quantity ? (
          <span className="text-green-600">Yes</span>
        ) : (
          <span className="text-red-600">No</span>
        );
      },
    },
    {
      title: "Notes",
      width: 180,
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return (
          <Input
            placeholder="Receipt notes..."
            value={input?.notes}
            onChange={(e) => updateLine(record.id, "notes", e.target.value)}
            size="small"
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/transfers/receive")}
      >
        Back to Queue
      </Button>

      <Steps
        current={getStepCurrent()}
        size="small"
        items={[
          {
            title: "Created",
            description: `${transfer.createdBy.fullName} · ${dayjs(transfer.createdAt).format("DD MMM HH:mm")}`,
          },
          {
            title: "Approved",
            description: transfer.approvedBy
              ? `${transfer.approvedBy.fullName} · ${dayjs(transfer.approvedAt).format("DD MMM HH:mm")}`
              : undefined,
          },
          {
            title: "Shipped",
            description: transfer.fulfilledBy
              ? `${transfer.fulfilledBy.fullName} · ${dayjs(transfer.fulfilledAt).format("DD MMM HH:mm")}`
              : undefined,
          },
          {
            title: "Received",
            status: transfer.status === "IN_TRANSIT" ? "process" : undefined,
            description: transfer.receivedBy
              ? `${transfer.receivedBy.fullName} · ${dayjs(transfer.receivedAt).format("DD MMM HH:mm")}`
              : undefined,
          },
        ]}
      />

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Transfer #">
          {transfer.transferNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Status">{transfer.status}</Descriptions.Item>
        <Descriptions.Item label="From">
          {transfer.fromLocation.code} - {transfer.fromLocation.name}
        </Descriptions.Item>
        <Descriptions.Item label="To">
          {transfer.toLocation.code} - {transfer.toLocation.name}
        </Descriptions.Item>
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">Verify Received Items</h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={transfer.lines}
          pagination={false}
          size="small"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receipt Notes
        </label>
        <Input.TextArea
          rows={2}
          placeholder="Delivery condition, discrepancies..."
          value={receiveNotes}
          onChange={(e) => setReceiveNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          loading={submitting}
        >
          Confirm Receipt
        </Button>
      </div>
    </div>
  );
}
