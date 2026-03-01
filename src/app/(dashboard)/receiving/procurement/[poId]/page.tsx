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
  Popconfirm,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
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
      message.error(t.procurement.failedToLoad);
    }
    setLoading(false);
  }, [poId, message, t]);

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
      message.success(t.receiving.procurement.received);
      router.push("/receiving/procurement");
    } else {
      message.error(json.error || t.receiving.procurement.failedToReceive);
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
    return <Alert type="error" title={t.procurement.notFound} showIcon />;
  }

  const isSameUser = po.createdBy.id === user?.id;

  const columns: ColumnsType<POLine> = [
    {
      title: t.procurement.columns.itemCode,
      dataIndex: ["item", "code"],
      width: 120,
    },
    {
      title: t.procurement.columns.itemName,
      dataIndex: ["item", "name"],
      ellipsis: true,
    },
    {
      title: t.procurement.columns.uom,
      dataIndex: ["item", "uom"],
      width: 70,
      align: "center",
    },
    {
      title: t.receiving.procurement.pendingQty,
      dataIndex: "quantity",
      width: 110,
      align: "right",
    },
    {
      title: t.receiving.procurement.receivedQuantity,
      dataIndex: "receivedQty",
      width: 130,
      align: "right",
      render: (v: number) => (v > 0 ? v : "-"),
    },
    {
      title: t.receiving.procurement.quantityToReceive,
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
      title: t.receiving.procurement.discrepancy,
      width: 110,
      align: "right",
      render: (_, record, index) => {
        const diff =
          (lineInputs[index]?.receivedQty || 0) - record.quantity;
        if (diff === 0) return <span className="text-green-600">{t.receiving.procurement.match}</span>;
        return (
          <span className={diff < 0 ? "text-red-600" : "text-orange-600"}>
            {diff > 0 ? "+" : ""}
            {diff}
          </span>
        );
      },
    },
    {
      title: t.common.notes,
      width: 180,
      render: (_, __, index) => (
        <Input
          placeholder={t.receiving.procurement.lineNotesPlaceholder}
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
        {t.common.back}
      </Button>

      {isSameUser && (
        <Alert
          type="warning"
          message={t.receiving.procurement.segregationOfDuties}
          description={t.receiving.procurement.segregationDescription}
          showIcon
        />
      )}

      <Descriptions
        bordered
        size="small"
        column={2}
        title={`PO: ${po.poNumber}`}
      >
        <Descriptions.Item label={t.procurement.supplier}>{po.supplier.name}</Descriptions.Item>
        <Descriptions.Item label={t.common.status}>{po.status}</Descriptions.Item>
        <Descriptions.Item label={t.procurement.details.totalAmount}>
          {po.currency} {po.totalAmount.toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label={t.receiving.procurement.columns.expectedDate}>
          {po.expectedDate ? dayjs(po.expectedDate).format("DD MMM YYYY") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t.procurement.details.createdBy}>
          {po.createdBy.fullName}
        </Descriptions.Item>
        <Descriptions.Item label={t.procurement.details.created}>
          {dayjs(po.createdAt).format("DD MMM YYYY")}
        </Descriptions.Item>
        {po.notes && (
          <Descriptions.Item label={t.common.notes} span={2}>
            {po.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">{t.procurement.lineItems}</h3>
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
          {t.receiving.procurement.procurementNotes}
        </label>
        <Input.TextArea
          rows={3}
          placeholder={t.receiving.procurement.notesPlaceholder}
          value={procNotes}
          onChange={(e) => setProcNotes(e.target.value)}
          disabled={isSameUser}
        />
      </div>

      <div className="flex justify-end">
        <Popconfirm
          title={t.receiving.procurement.submitConfirm}
          description={t.receiving.procurement.submitConfirmDesc}
          onConfirm={handleSubmit}
          okText={t.common.submit}
          disabled={isSameUser || lineInputs.length === 0}
        >
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            disabled={isSameUser || lineInputs.length === 0}
          >
            {t.receiving.procurement.receiveItems}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
