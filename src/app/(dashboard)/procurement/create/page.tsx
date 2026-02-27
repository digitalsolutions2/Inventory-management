"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Table,
  Space,
  App,
  Card,
} from "antd";
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface Supplier {
  id: string;
  code: string;
  name: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  uom: string;
  avgCost: number;
}

interface LineItem {
  key: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

let lineKeyCounter = 0;

export default function CreatePOPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const [supRes, itemRes] = await Promise.all([
      fetch("/api/suppliers?all=true"),
      fetch("/api/items?pageSize=500&status=active"),
    ]);
    const supJson = await supRes.json();
    const itemJson = await itemRes.json();
    if (supJson.success) setSuppliers(supJson.data);
    if (itemJson.success) setItems(itemJson.data.data);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addLine = () => {
    setLines([
      ...lines,
      { key: `line-${++lineKeyCounter}`, itemId: "", quantity: 1, unitCost: 0 },
    ]);
  };

  const updateLine = (key: string, field: string, value: unknown) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const updated = { ...l, [field]: value };
        // Auto-fill unit cost from item avgCost
        if (field === "itemId") {
          const item = items.find((i) => i.id === value);
          if (item && item.avgCost > 0) {
            updated.unitCost = item.avgCost;
          }
        }
        return updated;
      })
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const handleSave = async (submitForApproval: boolean) => {
    if (!supplierId) {
      message.error(t.procurement.supplierRequired);
      return;
    }
    if (lines.length === 0) {
      message.error(t.procurement.addAtLeastOneLine);
      return;
    }
    const invalidLines = lines.filter((l) => !l.itemId || l.quantity <= 0 || l.unitCost <= 0);
    if (invalidLines.length > 0) {
      message.error(t.procurement.allLinesMustBeValid);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          expectedDate: expectedDate || null,
          notes: notes || null,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            notes: l.notes,
          })),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        message.error(json.error || t.procurement.failedToCreate);
        return;
      }

      if (submitForApproval) {
        const submitRes = await fetch(
          `/api/purchase-orders/${json.data.id}/submit`,
          { method: "POST" }
        );
        const submitJson = await submitRes.json();
        if (!submitJson.success) {
          message.warning(t.procurement.poCreatedButFailedSubmit + ": " + submitJson.error);
          router.push(`/procurement/${json.data.id}`);
          return;
        }
        message.success(t.procurement.poCreatedAndSubmitted);
      } else {
        message.success(t.procurement.poSavedAsDraft);
      }
      router.push(`/procurement/${json.data.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const lineColumns: ColumnsType<LineItem> = [
    {
      title: t.procurement.columns.item,
      dataIndex: "itemId",
      width: 300,
      render: (val: string, record) => (
        <Select
          value={val || undefined}
          onChange={(v) => updateLine(record.key, "itemId", v)}
          placeholder={t.procurement.selectItem}
          showSearch
          optionFilterProp="label"
          className="w-full"
          options={items.map((i) => ({
            value: i.id,
            label: `${i.code} - ${i.name} (${i.uom})`,
          }))}
        />
      ),
    },
    {
      title: t.procurement.columns.qty,
      dataIndex: "quantity",
      width: 100,
      render: (val: number, record) => (
        <InputNumber
          value={val}
          min={0.01}
          onChange={(v) => updateLine(record.key, "quantity", v || 0)}
          className="w-full"
        />
      ),
    },
    {
      title: t.procurement.columns.unitCost,
      dataIndex: "unitCost",
      width: 120,
      render: (val: number, record) => (
        <InputNumber
          value={val}
          min={0}
          precision={2}
          onChange={(v) => updateLine(record.key, "unitCost", v || 0)}
          className="w-full"
        />
      ),
    },
    {
      title: t.procurement.columns.total,
      width: 120,
      align: "right",
      render: (_, record) => (record.quantity * record.unitCost).toFixed(2),
    },
    {
      title: "",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/procurement")} />
        <h1 className="text-2xl font-bold text-gray-900">{t.procurement.createPO}</h1>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.procurement.supplier} *
            </label>
            <Select
              value={supplierId || undefined}
              onChange={setSupplierId}
              placeholder={t.procurement.selectSupplier}
              showSearch
              optionFilterProp="label"
              className="w-full"
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.code} - ${s.name}`,
              }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.procurement.expectedDeliveryDate}
            </label>
            <DatePicker
              className="w-full"
              onChange={(_, dateStr) =>
                setExpectedDate(typeof dateStr === "string" ? dateStr : "")
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.common.notes}
            </label>
            <Input.TextArea
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.procurement.optionalNotes}
            />
          </div>
        </div>
      </Card>

      <Card
        title={t.procurement.lineItems}
        extra={
          <Button icon={<PlusOutlined />} onClick={addLine} size="small">
            {t.procurement.addLine}
          </Button>
        }
      >
        <Table
          rowKey="key"
          columns={lineColumns}
          dataSource={lines}
          pagination={false}
          size="small"
          locale={{ emptyText: t.procurement.noLineItems }}
        />
        {lines.length > 0 && (
          <div className="flex justify-end mt-4 text-lg font-semibold">
            {t.common.total}: SAR {totalAmount.toFixed(2)}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3 mt-4">
        <Button onClick={() => router.push("/procurement")}>{t.common.cancel}</Button>
        <Space>
          <Button
            onClick={() => handleSave(false)}
            loading={submitting}
          >
            {t.procurement.saveAsDraft}
          </Button>
          <Button
            type="primary"
            onClick={() => handleSave(true)}
            loading={submitting}
          >
            {t.procurement.submitForApproval}
          </Button>
        </Space>
      </div>
    </div>
  );
}
