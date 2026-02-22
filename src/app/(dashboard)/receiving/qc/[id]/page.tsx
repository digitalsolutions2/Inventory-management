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
  Radio,
  App,
  Popconfirm,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import { ReceivingSteps } from "@/components/receiving/receiving-steps";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface ReceivingLine {
  id: string;
  itemId: string;
  expectedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitCost: number;
  notes: string | null;
  item: { id: string; code: string; name: string; uom: string };
}

interface ReceivingDetail {
  id: string;
  receivingNumber: string;
  status: string;
  procNotes: string | null;
  procVerifiedAt: string | null;
  procVerifiedBy: { id: string; fullName: string; email: string } | null;
  qcInspectedBy: { id: string; fullName: string; email: string } | null;
  qcInspectedAt: string | null;
  warehouseReceivedBy: { id: string; fullName: string; email: string } | null;
  warehouseReceivedAt: string | null;
  qcResult: string | null;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { id: string; name: string; code: string };
    createdBy: { id: string; fullName: string };
  };
  lines: ReceivingLine[];
}

interface LineInput {
  id: string;
  acceptedQty: number;
  rejectedQty: number;
  notes: string;
}

export default function QCInspectPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const [receiving, setReceiving] = useState<ReceivingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qcResult, setQcResult] = useState<string>("ACCEPTED");
  const [lineInputs, setLineInputs] = useState<LineInput[]>([]);
  const [qcNotes, setQcNotes] = useState("");

  const fetchReceiving = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/receiving/${id}`);
    const json = await res.json();
    if (json.success) {
      setReceiving(json.data);
      setLineInputs(
        json.data.lines.map((l: ReceivingLine) => ({
          id: l.id,
          acceptedQty: l.receivedQty, // Default: accept all
          rejectedQty: 0,
          notes: "",
        }))
      );
    } else {
      message.error("Failed to load receiving record");
    }
    setLoading(false);
  }, [id, message]);

  useEffect(() => {
    fetchReceiving();
  }, [fetchReceiving]);

  const handleSubmit = async () => {
    if (!receiving) return;

    // Validate each line
    for (let i = 0; i < lineInputs.length; i++) {
      const input = lineInputs[i];
      const recLine = receiving.lines[i];
      if (input.acceptedQty + input.rejectedQty !== recLine.receivedQty) {
        message.error(
          `Line "${recLine.item.name}": Accepted (${input.acceptedQty}) + Rejected (${input.rejectedQty}) must equal Received (${recLine.receivedQty})`
        );
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch(`/api/receiving/${id}/qc-inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qcResult,
        lines: lineInputs,
        notes: qcNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      message.success(
        qcResult === "REJECTED"
          ? "QC inspection submitted - items rejected"
          : "QC inspection submitted successfully!"
      );
      router.push("/receiving/qc");
    } else {
      message.error(json.error || "Failed to submit inspection");
    }
    setSubmitting(false);
  };

  const updateLineInput = (index: number, field: string, value: unknown) => {
    setLineInputs((prev) => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: value };
      // Auto-calculate the other qty
      const receivedQty = receiving?.lines[index]?.receivedQty || 0;
      if (field === "acceptedQty") {
        line.rejectedQty = receivedQty - (line.acceptedQty || 0);
      } else if (field === "rejectedQty") {
        line.acceptedQty = receivedQty - (line.rejectedQty || 0);
      }
      updated[index] = line;
      return updated;
    });
  };

  const handleQcResultChange = (result: string) => {
    setQcResult(result);
    if (!receiving) return;
    if (result === "ACCEPTED") {
      setLineInputs(
        receiving.lines.map((l) => ({
          id: l.id,
          acceptedQty: l.receivedQty,
          rejectedQty: 0,
          notes: "",
        }))
      );
    } else if (result === "REJECTED") {
      setLineInputs(
        receiving.lines.map((l) => ({
          id: l.id,
          acceptedQty: 0,
          rejectedQty: l.receivedQty,
          notes: "",
        }))
      );
    }
    // PARTIAL: leave as-is for manual editing
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!receiving) {
    return <Alert type="error" message="Receiving record not found" showIcon />;
  }

  const isSameUser = receiving.procVerifiedBy?.id === user?.id;

  const columns: ColumnsType<ReceivingLine> = [
    { title: "Item Code", dataIndex: ["item", "code"], width: 120 },
    { title: "Item Name", dataIndex: ["item", "name"], ellipsis: true },
    { title: "UOM", dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: "Expected",
      dataIndex: "expectedQty",
      width: 100,
      align: "right",
    },
    {
      title: "Received",
      dataIndex: "receivedQty",
      width: 100,
      align: "right",
    },
    {
      title: "Accepted Qty",
      width: 120,
      render: (_, __, index) => (
        <InputNumber
          min={0}
          max={receiving.lines[index].receivedQty}
          value={lineInputs[index]?.acceptedQty}
          onChange={(val) => updateLineInput(index, "acceptedQty", val || 0)}
          disabled={isSameUser}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "Rejected Qty",
      width: 120,
      render: (_, __, index) => (
        <InputNumber
          min={0}
          max={receiving.lines[index].receivedQty}
          value={lineInputs[index]?.rejectedQty}
          onChange={(val) => updateLineInput(index, "rejectedQty", val || 0)}
          disabled={isSameUser}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "Notes",
      width: 180,
      render: (_, __, index) => (
        <Input
          placeholder="Inspection notes..."
          value={lineInputs[index]?.notes}
          onChange={(e) => updateLineInput(index, "notes", e.target.value)}
          disabled={isSameUser}
          size="small"
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/receiving/qc")}
      >
        Back to Queue
      </Button>

      {isSameUser && (
        <Alert
          type="warning"
          message="Segregation of Duties"
          description="You cannot inspect a receiving that you verified. A different QC user must inspect this."
          showIcon
        />
      )}

      <ReceivingSteps
        status={receiving.status}
        procVerifiedBy={receiving.procVerifiedBy}
        procVerifiedAt={receiving.procVerifiedAt}
        qcInspectedBy={receiving.qcInspectedBy}
        qcInspectedAt={receiving.qcInspectedAt}
        qcResult={receiving.qcResult}
        warehouseReceivedBy={receiving.warehouseReceivedBy}
        warehouseReceivedAt={receiving.warehouseReceivedAt}
      />

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Receiving #">
          {receiving.receivingNumber}
        </Descriptions.Item>
        <Descriptions.Item label="PO #">
          {receiving.purchaseOrder.poNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Supplier">
          {receiving.purchaseOrder.supplier.name}
        </Descriptions.Item>
        <Descriptions.Item label="Verified By">
          {receiving.procVerifiedBy?.fullName || "-"}
        </Descriptions.Item>
        {receiving.procNotes && (
          <Descriptions.Item label="Procurement Notes" span={2}>
            {receiving.procNotes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">QC Result</h3>
        <Radio.Group
          value={qcResult}
          onChange={(e) => handleQcResultChange(e.target.value)}
          disabled={isSameUser}
        >
          <Radio.Button value="ACCEPTED">Accept All</Radio.Button>
          <Radio.Button value="PARTIAL">Partial Accept</Radio.Button>
          <Radio.Button value="REJECTED">Reject All</Radio.Button>
        </Radio.Group>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2">Line Items</h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={receiving.lines}
          pagination={false}
          size="small"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          QC Notes
        </label>
        <Input.TextArea
          rows={3}
          placeholder="Quality control notes..."
          value={qcNotes}
          onChange={(e) => setQcNotes(e.target.value)}
          disabled={isSameUser}
        />
      </div>

      <div className="flex justify-end">
        <Popconfirm
          title={qcResult === "REJECTED" ? "Reject this receiving?" : "Submit QC inspection?"}
          description={qcResult === "REJECTED"
            ? "Rejected items will not enter inventory."
            : "This will advance the receiving to warehouse receipt."
          }
          onConfirm={handleSubmit}
          okText="Submit"
          okButtonProps={{ danger: qcResult === "REJECTED" }}
          disabled={isSameUser}
        >
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            disabled={isSameUser}
            danger={qcResult === "REJECTED"}
          >
            {qcResult === "REJECTED"
              ? "Submit Rejection"
              : "Submit Inspection"}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
