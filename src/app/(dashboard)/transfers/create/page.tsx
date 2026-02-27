"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  InputNumber,
  Input,
  Select,
  App,
  Empty,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface InventoryItem {
  id: string;
  quantity: number;
  avgCost: number;
  item: { id: string; code: string; name: string; uom: string };
  location: { id: string; code: string; name: string; type: string };
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface LineItem {
  key: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  available: number;
  avgCost: number;
  quantity: number;
  notes: string;
}

export default function CreateTransferPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [fromLocationId, setFromLocationId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [transferNotes, setTransferNotes] = useState("");

  const fetchLocations = useCallback(async () => {
    const res = await fetch("/api/locations?pageSize=100");
    const json = await res.json();
    if (json.success) setLocations(json.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Fetch inventory when source location changes
  const fetchInventory = useCallback(async () => {
    if (!fromLocationId) {
      setInventory([]);
      return;
    }
    const res = await fetch(
      `/api/inventory?locationId=${fromLocationId}&pageSize=200`
    );
    const json = await res.json();
    if (json.success) setInventory(json.data.data || []);
  }, [fromLocationId]);

  useEffect(() => {
    fetchInventory();
    setLines([]);
  }, [fetchInventory]);

  const addItem = (inv: InventoryItem) => {
    if (lines.find((l) => l.itemId === inv.item.id)) {
      message.warning(t.transfers.create.itemAlreadyAdded);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: inv.item.id,
        itemId: inv.item.id,
        itemCode: inv.item.code,
        itemName: inv.item.name,
        uom: inv.item.uom,
        available: inv.quantity,
        avgCost: inv.avgCost,
        quantity: 1,
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

  const totalValue = lines.reduce(
    (sum, l) => sum + l.quantity * l.avgCost,
    0
  );

  const handleSubmit = async () => {
    if (!fromLocationId || !toLocationId) {
      message.error(t.transfers.create.selectBothLocations);
      return;
    }
    if (fromLocationId === toLocationId) {
      message.error(t.transfers.create.locationsMustDiffer);
      return;
    }
    if (lines.length === 0) {
      message.error(t.transfers.create.addAtLeastOneItem);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromLocationId,
        toLocationId,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          notes: l.notes || undefined,
        })),
        notes: transferNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      const status = json.data.status;
      if (status === "PENDING") {
        message.success(
          `${t.transfers.columns.transferNumber} ${json.data.transferNumber} ${t.transfers.create.transferCreatedPending}`
        );
        router.push("/transfers/pending");
      } else {
        message.success(
          `${t.transfers.columns.transferNumber} ${json.data.transferNumber} ${t.transfers.create.transferCreatedAutoApproved}`
        );
        router.push("/transfers/fulfill");
      }
    } else {
      message.error(json.error || t.transfers.create.failedToCreate);
    }
    setSubmitting(false);
  };

  if (!hasPermission("transfers:write")) {
    return <Empty description={t.transfers.create.noPermission} />;
  }

  const stockColumns: ColumnsType<InventoryItem> = [
    { title: t.transfers.create.code, dataIndex: ["item", "code"], width: 100 },
    { title: t.transfers.create.item, dataIndex: ["item", "name"], ellipsis: true },
    { title: t.transfers.create.uom, dataIndex: ["item", "uom"], width: 60, align: "center" },
    {
      title: t.transfers.create.available,
      dataIndex: "quantity",
      width: 90,
      align: "right",
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
          disabled={
            record.quantity <= 0 ||
            lines.some((l) => l.itemId === record.item.id)
          }
        >
          {t.common.add}
        </Button>
      ),
    },
  ];

  const lineColumns: ColumnsType<LineItem> = [
    { title: t.transfers.create.code, dataIndex: "itemCode", width: 100 },
    { title: t.transfers.create.item, dataIndex: "itemName", ellipsis: true },
    { title: t.transfers.create.uom, dataIndex: "uom", width: 60, align: "center" },
    {
      title: t.transfers.create.available,
      dataIndex: "available",
      width: 90,
      align: "right",
    },
    {
      title: t.transfers.create.qty,
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.available}
          value={record.quantity}
          onChange={(val) => updateLine(record.itemId, "quantity", val || 1)}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: t.transfers.create.estValue,
      width: 100,
      align: "right",
      render: (_, record) => `$${(record.quantity * record.avgCost).toFixed(2)}`,
    },
    {
      title: t.common.notes,
      width: 150,
      render: (_, record) => (
        <Input
          placeholder={`${t.common.notes}...`}
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.transfers.create.fromLocation} *
          </label>
          <Select
            placeholder={t.transfers.create.selectSource}
            value={fromLocationId || undefined}
            onChange={(val) => setFromLocationId(val)}
            className="w-full"
            showSearch
            optionFilterProp="children"
            options={locations
              .filter((l) => l.id !== toLocationId)
              .map((l) => ({
                value: l.id,
                label: `${l.code} - ${l.name} (${l.type})`,
              }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.transfers.create.toLocation} *
          </label>
          <Select
            placeholder={t.transfers.create.selectDestination}
            value={toLocationId || undefined}
            onChange={setToLocationId}
            className="w-full"
            showSearch
            optionFilterProp="children"
            options={locations
              .filter((l) => l.id !== fromLocationId)
              .map((l) => ({
                value: l.id,
                label: `${l.code} - ${l.name} (${l.type})`,
              }))}
          />
        </div>
      </div>

      {fromLocationId && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {t.transfers.create.stockAtSource}
          </h2>
          {inventory.length === 0 ? (
            <Empty description={t.transfers.create.noInventoryAtLocation} />
          ) : (
            <Table
              rowKey="id"
              columns={stockColumns}
              dataSource={inventory}
              loading={loading}
              pagination={{ pageSize: 10, size: "small" }}
              size="small"
            />
          )}
        </div>
      )}

      {lines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {t.transfers.create.transferItems} ({lines.length})
          </h2>

          {totalValue > 1000 && (
            <Alert
              type="info"
              message={`${t.common.total}: $${totalValue.toFixed(2)} — ${t.transfers.create.approvalRequired}`}
              className="mb-3"
              showIcon
            />
          )}

          <Table
            rowKey="key"
            columns={lineColumns}
            dataSource={lines}
            pagination={false}
            size="small"
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.transfers.create.notes}
            </label>
            <Input.TextArea
              rows={2}
              placeholder={t.transfers.create.notesPlaceholder}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {t.transfers.create.estimatedTotalValue} <strong>${totalValue.toFixed(2)}</strong>
            </span>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!fromLocationId || !toLocationId}
            >
              {t.transfers.create.submitTransfer}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
