"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Descriptions,
  Table,
  Alert,
  Spin,
  App,
} from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
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
  createdBy: { id: string; fullName: true; email: string };
  approvedBy: { id: string; fullName: string } | null;
  approvedAt: string | null;
  lines: TransferLine[];
}

export default function FulfillTransferPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fulfillNotes, setFulfillNotes] = useState("");

  const fetchTransfer = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/transfers/${id}`);
    const json = await res.json();
    if (json.success) {
      setTransfer(json.data);
    } else {
      message.error("Failed to load transfer");
    }
    setLoading(false);
  }, [id, message]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  const handleSubmit = async () => {
    if (!transfer) return;

    setSubmitting(true);
    const res = await fetch(`/api/transfers/${id}/fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: fulfillNotes || undefined }),
    });

    const json = await res.json();
    if (json.success) {
      message.success(
        "Transfer shipped! Items deducted from source and now in transit."
      );
      router.push("/transfers/fulfill");
    } else {
      message.error(json.error || "Failed to fulfill transfer");
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

  const columns: ColumnsType<TransferLine> = [
    { title: "Item Code", dataIndex: ["item", "code"], width: 120 },
    { title: "Item Name", dataIndex: ["item", "name"], ellipsis: true },
    { title: "UOM", dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: "Quantity to Ship",
      dataIndex: "quantity",
      width: 140,
      align: "right",
      render: (v: number) => <span className="font-medium">{v}</span>,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      render: (v: string | null) => v || "-",
    },
  ];

  return (
    <div className="space-y-4">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/transfers/fulfill")}
      >
        Back to Queue
      </Button>

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
        <Descriptions.Item label="Created By">
          {transfer.createdBy.fullName}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {dayjs(transfer.createdAt).format("DD MMM YYYY HH:mm")}
        </Descriptions.Item>
        {transfer.approvedBy && (
          <>
            <Descriptions.Item label="Approved By">
              {transfer.approvedBy.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Approved At">
              {transfer.approvedAt
                ? dayjs(transfer.approvedAt).format("DD MMM YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
          </>
        )}
        {transfer.notes && (
          <Descriptions.Item label="Notes" span={2}>
            <pre className="whitespace-pre-wrap text-sm">{transfer.notes}</pre>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">Items to Pick & Pack</h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={transfer.lines}
          pagination={false}
          size="small"
        />
      </div>

      <Alert
        type="info"
        message="Confirming will deduct these items from the source location and mark them as in-transit."
        showIcon
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fulfillment Notes
        </label>
        <Input.TextArea
          rows={2}
          placeholder="Picking/packing notes..."
          value={fulfillNotes}
          onChange={(e) => setFulfillNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={submitting}
        >
          Confirm Shipment
        </Button>
      </div>
    </div>
  );
}
