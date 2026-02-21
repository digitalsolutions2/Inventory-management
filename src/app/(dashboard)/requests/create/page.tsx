"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  InputNumber,
  Input,
  App,
  Empty,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import type { ColumnsType } from "antd/es/table";

interface InventoryItem {
  id: string;
  quantity: number;
  avgCost: number;
  item: { id: string; code: string; name: string; uom: string; minStock: number };
  location: { id: string; code: string; name: string; type: string };
}

interface LineItem {
  key: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  available: number;
  requestedQty: number;
  notes: string;
}

export default function CreateRequestPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [requestNotes, setRequestNotes] = useState("");

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inventory?pageSize=200");
    const json = await res.json();
    if (json.success) {
      setInventory(json.data.data || []);
    } else {
      message.error("Failed to load inventory");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Aggregate inventory by item (sum across locations)
  const aggregatedStock = inventory.reduce(
    (acc, inv) => {
      const existing = acc.find((a) => a.itemId === inv.item.id);
      if (existing) {
        existing.totalQty += inv.quantity;
      } else {
        acc.push({
          itemId: inv.item.id,
          itemCode: inv.item.code,
          itemName: inv.item.name,
          uom: inv.item.uom,
          totalQty: inv.quantity,
          minStock: inv.item.minStock,
        });
      }
      return acc;
    },
    [] as {
      itemId: string;
      itemCode: string;
      itemName: string;
      uom: string;
      totalQty: number;
      minStock: number;
    }[]
  );

  const addItem = (item: (typeof aggregatedStock)[0]) => {
    if (lines.find((l) => l.itemId === item.itemId)) {
      message.warning("Item already added");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: item.itemId,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        available: item.totalQty,
        requestedQty: 1,
        notes: "",
      },
    ]);
  };

  const removeLine = (itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const updateLine = (itemId: string, field: string, value: unknown) => {
    setLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async () => {
    if (lines.length === 0) {
      message.error("Add at least one item");
      return;
    }
    for (const line of lines) {
      if (line.requestedQty <= 0) {
        message.error(`Quantity for ${line.itemName} must be positive`);
        return;
      }
      if (line.requestedQty > line.available) {
        message.error(
          `Requested qty for ${line.itemName} exceeds available stock (${line.available})`
        );
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch("/api/internal-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({
          itemId: l.itemId,
          requestedQty: l.requestedQty,
          notes: l.notes || undefined,
        })),
        notes: requestNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      message.success(`Request ${json.data.requestNumber} created successfully!`);
      setLines([]);
      setRequestNotes("");
      router.push("/requests/fulfill");
    } else {
      message.error(json.error || "Failed to create request");
    }
    setSubmitting(false);
  };

  if (!hasPermission("requests:write")) {
    return <Empty description="You don't have permission to create requests" />;
  }

  // Stock table columns
  const stockColumns: ColumnsType<(typeof aggregatedStock)[0]> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    {
      title: "Available",
      dataIndex: "totalQty",
      width: 100,
      align: "right",
      render: (v: number, r) => (
        <span className={v <= r.minStock ? "text-red-600 font-medium" : ""}>
          {v}
        </span>
      ),
    },
    {
      title: "Status",
      width: 100,
      render: (_, r) => {
        if (r.totalQty <= 0) return <Tag color="red">Out of Stock</Tag>;
        if (r.totalQty <= r.minStock) return <Tag color="orange">Low</Tag>;
        return <Tag color="green">In Stock</Tag>;
      },
    },
    {
      title: "",
      width: 70,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => addItem(record)}
          disabled={record.totalQty <= 0 || lines.some((l) => l.itemId === record.itemId)}
        >
          Add
        </Button>
      ),
    },
  ];

  // Request lines columns
  const lineColumns: ColumnsType<LineItem> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    {
      title: "Available",
      dataIndex: "available",
      width: 90,
      align: "right",
    },
    {
      title: "Qty",
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.available}
          value={record.requestedQty}
          onChange={(val) => updateLine(record.itemId, "requestedQty", val || 1)}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "Notes",
      width: 180,
      render: (_, record) => (
        <Input
          placeholder="Notes..."
          value={record.notes}
          onChange={(e) => updateLine(record.itemId, "notes", e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: "",
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.itemId)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Available Stock
        </h2>
        <Table
          rowKey="itemId"
          columns={stockColumns}
          dataSource={aggregatedStock}
          loading={loading}
          pagination={{ pageSize: 10, size: "small" }}
          size="small"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Request Items ({lines.length})
        </h2>
        {lines.length === 0 ? (
          <Empty description="Click 'Add' on items above to build your request" />
        ) : (
          <>
            <Table
              rowKey="key"
              columns={lineColumns}
              dataSource={lines}
              pagination={false}
              size="small"
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Notes
              </label>
              <Input.TextArea
                rows={2}
                placeholder="Why are these items needed?..."
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={submitting}
              >
                Submit Request
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
