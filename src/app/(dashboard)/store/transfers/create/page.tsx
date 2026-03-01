"use client";

import { useEffect, useState } from "react";
import { Card, Select, Button, InputNumber, Table, Alert, Input } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface InventoryRow {
  id: string;
  quantity: number;
  avgCost: number;
  item: { id: string; code: string; name: string; uom: string };
}

interface TransferLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  available: number;
  quantity: number;
}

export default function CreateStoreTransferPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromLocationId, setFromLocationId] = useState(searchParams.get("fromLocationId") || "");
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load store/kitchen locations (excluding own)
  useEffect(() => {
    fetch("/api/locations?pageSize=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const stores = (res.data.data || res.data).filter(
            (l: Location) =>
              (l.type === "STORE" || l.type === "KITCHEN" || l.type === "WAREHOUSE") &&
              l.id !== userContext?.locationId
          );
          setLocations(stores);
        }
      });
  }, [userContext?.locationId]);

  // Load inventory at selected source
  useEffect(() => {
    if (!fromLocationId) { setInventory([]); return; }
    fetch(`/api/store/inventory?locationId=${fromLocationId}&pageSize=100`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setInventory(res.data.data);
      });
  }, [fromLocationId]);

  // Pre-select item from URL
  useEffect(() => {
    const preItemId = searchParams.get("itemId");
    if (preItemId && inventory.length > 0) {
      const inv = inventory.find((i) => i.item.id === preItemId);
      if (inv && !lines.find((l) => l.itemId === preItemId)) {
        setLines((prev) => [
          ...prev,
          {
            itemId: inv.item.id,
            itemCode: inv.item.code,
            itemName: inv.item.name,
            uom: inv.item.uom,
            available: inv.quantity,
            quantity: 1,
          },
        ]);
      }
    }
  }, [inventory, searchParams]);

  const addItem = (invRow: InventoryRow) => {
    if (lines.find((l) => l.itemId === invRow.item.id)) {
      toast.error("Item already added");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        itemId: invRow.item.id,
        itemCode: invRow.item.code,
        itemName: invRow.item.name,
        uom: invRow.item.uom,
        available: invRow.quantity,
        quantity: 1,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!fromLocationId) { toast.error("Select source location"); return; }
    if (!userContext?.locationId) { toast.error("No assigned location"); return; }
    if (lines.length === 0) { toast.error("Add at least one item"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLocationId,
          toLocationId: userContext.locationId,
          notes: notes || `Store transfer request`,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Transfer request created! Pending approval.");
        router.push("/store/transfers");
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to create transfer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.storePortal.transfers.createTransfer}</h1>

      <Alert
        type="info"
        message={t.storePortal.transfers.storeToStoreNote}
        showIcon
        className="mb-4"
      />

      <Card title={t.storePortal.transfers.selectSource}>
        <Select
          value={fromLocationId || undefined}
          onChange={(v) => { setFromLocationId(v); setLines([]); }}
          placeholder={t.storePortal.transfers.selectSource}
          className="w-72"
          options={locations.map((l) => ({
            value: l.id,
            label: `${l.name} (${l.type})`,
          }))}
        />
      </Card>

      {fromLocationId && (
        <Card title="Available Stock at Source">
          <Table
            dataSource={inventory}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: "Code", dataIndex: ["item", "code"], width: 100 },
              { title: "Item", dataIndex: ["item", "name"] },
              { title: "UOM", dataIndex: ["item", "uom"], width: 70 },
              { title: "Available", dataIndex: "quantity", width: 90 },
              {
                title: "", key: "action", width: 80,
                render: (_: unknown, r: InventoryRow) => (
                  <Button
                    size="small"
                    onClick={() => addItem(r)}
                    disabled={lines.some((l) => l.itemId === r.item.id)}
                  >
                    Add
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {lines.length > 0 && (
        <Card title="Transfer Items">
          <Table
            dataSource={lines}
            rowKey="itemId"
            size="small"
            pagination={false}
            columns={[
              { title: "Code", dataIndex: "itemCode", width: 100 },
              { title: "Item", dataIndex: "itemName" },
              { title: "UOM", dataIndex: "uom", width: 70 },
              { title: "Available", dataIndex: "available", width: 90 },
              {
                title: "Qty", key: "qty", width: 120,
                render: (_: unknown, r: TransferLine) => (
                  <InputNumber
                    min={1}
                    max={r.available}
                    value={r.quantity}
                    onChange={(v) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.itemId === r.itemId ? { ...l, quantity: v || 1 } : l
                        )
                      )
                    }
                    size="small"
                  />
                ),
              },
              {
                title: "", key: "remove", width: 70,
                render: (_: unknown, r: TransferLine) => (
                  <Button
                    size="small"
                    danger
                    onClick={() => setLines((prev) => prev.filter((l) => l.itemId !== r.itemId))}
                  >
                    {t.common.remove}
                  </Button>
                ),
              },
            ]}
          />
          <div className="mt-4 space-y-3">
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes..."
              rows={2}
            />
            <Button type="primary" onClick={handleSubmit} loading={submitting} block>
              {t.common.submit}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
