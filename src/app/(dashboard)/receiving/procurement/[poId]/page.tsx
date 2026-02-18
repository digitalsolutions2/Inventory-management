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
  App,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface POLine {
  id: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
  item: { id: string; code: string; name: string; uom: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes: string | null;
  expectedDate: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    code: string;
    contactName: string | null;
  };
  createdBy: { id: string; fullName: string; email: string };
  lines: POLine[];
}

interface LineInput {
  itemId: string;
  receivedQty: number;
  notes: string;
}

export default function ProcurementVerifyPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { poId } = useParams<{ poId: string }>();
  const user = useUserStore((s) => s.user);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineInputs, setLineInputs] = useState<LineInput[]>([]);
  const [procNotes, setProcNotes] = useState("");

  const fetchPO = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${poId}`);
    const json = await res.json();
    if (json.success) {
      setPo(json.data);
      setLineInputs(
        json.data.lines.map((l: POLine) => ({
          itemId: l.itemId,
          receivedQty: l.quantity, // Default to ordered qty
          notes: "",
        }))
      );
    } else {
      message.error("Failed to load purchase order");
    }
    setLoading(false);
  }, [poId, message]);

  useEffect(() => {
    fetchPO();
  }, [fetchPO]);

  const handleSubmit = async () => {
    if (!po) return;
    setSubmitting(true);

    const res = await fetch("/api/receiving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseOrderId: po.id,
        lines: lineInputs,
        notes: procNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      message.success("Procurement verification submitted successfully!");
      router.push("/receiving/procurement");
    } else {
      message.error(json.error || "Failed to submit verification");
    }
    setSubmitting(false);
  };

  const updateLineInput = (index: number, field: string, value: unknown) => {
    setLineInputs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!po) {
    return <Alert type="error" message="Purchase order not found" showIcon />;
  }

  const isSameUser = po.createdBy.id === user?.id;

  const columns: ColumnsType<POLine> = [
    {
      title: "Item Code",
      dataIndex: ["item", "code"],
      width: 120,
    },
    {
      title: "Item Name",
      dataIndex: ["item", "name"],
      ellipsis: true,
    },
    {
      title: "UOM",
      dataIndex: ["item", "uom"],
      width: 70,
      align: "center",
    },
    {
      title: "Ordered Qty",
      dataIndex: "quantity",
      width: 110,
      align: "right",
    },
    {
      title: "Already Received",
      dataIndex: "receivedQty",
      width: 130,
      align: "right",
      render: (v: number) => (v > 0 ? v : "-"),
    },
    {
      title: "Received Qty",
      width: 130,
      render: (_, __, index) => (
        <InputNumber
          min={0}
          max={po.lines[index].quantity}
          value={lineInputs[index]?.receivedQty}
          onChange={(val) => updateLineInput(index, "receivedQty", val || 0)}
          disabled={isSameUser}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "Discrepancy",
      width: 110,
      align: "right",
      render: (_, record, index) => {
        const diff =
          (lineInputs[index]?.receivedQty || 0) - record.quantity;
        if (diff === 0) return <span className="text-green-600">Match</span>;
        return (
          <span className={diff < 0 ? "text-red-600" : "text-orange-600"}>
            {diff > 0 ? "+" : ""}
            {diff}
          </span>
        );
      },
    },
    {
      title: "Notes",
      width: 180,
      render: (_, __, index) => (
        <Input
          placeholder="Line notes..."
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
        onClick={() => router.push("/receiving/procurement")}
      >
        Back to Queue
      </Button>

      {isSameUser && (
        <Alert
          type="warning"
          message="Segregation of Duties"
          description="You cannot verify a PO that you created. A different procurement user must verify this PO."
          showIcon
        />
      )}

      <Descriptions
        bordered
        size="small"
        column={2}
        title={`PO: ${po.poNumber}`}
      >
        <Descriptions.Item label="Supplier">{po.supplier.name}</Descriptions.Item>
        <Descriptions.Item label="Status">{po.status}</Descriptions.Item>
        <Descriptions.Item label="Total Amount">
          {po.currency} {po.totalAmount.toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Expected Date">
          {po.expectedDate ? dayjs(po.expectedDate).format("DD MMM YYYY") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {po.createdBy.fullName}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {dayjs(po.createdAt).format("DD MMM YYYY")}
        </Descriptions.Item>
        {po.notes && (
          <Descriptions.Item label="PO Notes" span={2}>
            {po.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">Line Items</h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={po.lines}
          pagination={false}
          size="small"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Procurement Notes
        </label>
        <Input.TextArea
          rows={3}
          placeholder="Notes about this verification..."
          value={procNotes}
          onChange={(e) => setProcNotes(e.target.value)}
          disabled={isSameUser}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={isSameUser || lineInputs.length === 0}
        >
          Submit Verification
        </Button>
      </div>
    </div>
  );
}
