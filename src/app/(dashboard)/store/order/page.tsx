"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  InputNumber,
  Select,
  App,
  Empty,
  Alert,
  Tag,
  Statistic,
  Card,
} from "antd";
import {
  ShoppingCartOutlined,
  ThunderboltOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import type { ColumnsType } from "antd/es/table";

interface InventoryItem {
  id: string;
  quantity: number;
  avgCost: number;
  item: {
    id: string;
    code: string;
    name: string;
    uom: string;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
  };
  location: { id: string; code: string; name: string; type: string };
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface OrderLine {
  key: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  suggestedQty: number;
  orderQty: number;
}

export default function StoreOrderPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [locations, setLocations] = useState<Location[]>([]);
  const [storeLocationId, setStoreLocationId] = useState<string>("");
  const [warehouseLocationId, setWarehouseLocationId] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations?pageSize=100");
      const json = await res.json();
      if (json.success) setLocations(json.data.data || []);
      else message.error("Failed to load locations");
    } catch {
      message.error("Network error loading locations");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const fetchStoreInventory = useCallback(async () => {
    if (!storeLocationId) return;
    try {
      const res = await fetch(
        `/api/inventory?locationId=${storeLocationId}&pageSize=200`
      );
      const json = await res.json();
      if (json.success) {
        setInventory(json.data.data || []);
      } else {
        message.error("Failed to load inventory");
      }
    } catch {
      message.error("Network error loading inventory");
    }
  }, [storeLocationId, message]);

  useEffect(() => {
    fetchStoreInventory();
    setOrderLines([]);
  }, [fetchStoreInventory]);

  const generateSuggestions = () => {
    const suggestions: OrderLine[] = inventory
      .filter((inv) => inv.quantity <= inv.item.reorderPoint)
      .map((inv) => {
        const suggestedQty = Math.max(
          inv.item.maxStock - inv.quantity,
          inv.item.minStock - inv.quantity,
          1
        );
        return {
          key: inv.item.id,
          itemId: inv.item.id,
          itemCode: inv.item.code,
          itemName: inv.item.name,
          uom: inv.item.uom,
          currentStock: inv.quantity,
          minStock: inv.item.minStock,
          maxStock: inv.item.maxStock,
          reorderPoint: inv.item.reorderPoint,
          suggestedQty: Math.ceil(suggestedQty),
          orderQty: Math.ceil(suggestedQty),
        };
      });
    setOrderLines(suggestions);
    if (suggestions.length === 0) {
      message.info("All items are above reorder point - no replenishment needed!");
    } else {
      message.success(`${suggestions.length} items need replenishment`);
    }
  };

  const updateOrderQty = (itemId: string, qty: number) => {
    setOrderLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, orderQty: qty } : l))
    );
  };

  const removeOrderLine = (itemId: string) => {
    setOrderLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const handleSubmit = async () => {
    if (!warehouseLocationId) {
      message.error("Select the source warehouse");
      return;
    }
    if (orderLines.length === 0) {
      message.error("No items to order");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLocationId: warehouseLocationId,
          toLocationId: storeLocationId,
          lines: orderLines.map((l) => ({
            itemId: l.itemId,
            quantity: l.orderQty,
          })),
          notes: `Store replenishment order from smart ordering`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        message.success(
          `Transfer ${json.data.transferNumber} created! ${json.data.status === "PENDING" ? "Awaiting approval." : "Ready for fulfillment."}`
        );
        router.push("/transfers/fulfill");
      } else {
        message.error(json.error || "Failed to create transfer");
      }
    } catch {
      message.error("Network error");
    }
    setSubmitting(false);
  };

  if (!hasPermission("transfers:write")) {
    return <Empty description="You don't have permission for store ordering" />;
  }

  const lowStockCount = inventory.filter(
    (inv) => inv.quantity <= inv.item.reorderPoint
  ).length;
  const outOfStockCount = inventory.filter((inv) => inv.quantity <= 0).length;

  const columns: ColumnsType<OrderLine> = [
    { title: "Code", dataIndex: "itemCode", width: 100 },
    { title: "Item", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    {
      title: "Current",
      dataIndex: "currentStock",
      width: 90,
      align: "right",
      render: (v: number, r) => (
        <span className={v <= r.minStock ? "text-red-600 font-medium" : ""}>
          {v}
        </span>
      ),
    },
    {
      title: "Min",
      dataIndex: "minStock",
      width: 70,
      align: "right",
    },
    {
      title: "Max",
      dataIndex: "maxStock",
      width: 70,
      align: "right",
    },
    {
      title: "Suggested",
      dataIndex: "suggestedQty",
      width: 90,
      align: "right",
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Order Qty",
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.orderQty}
          onChange={(val) => updateOrderQty(record.itemId, val || 1)}
          size="small"
          className="w-full"
        />
      ),
    },
    {
      title: "",
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          onClick={() => removeOrderLine(record.itemId)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Smart Store Ordering
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Store Location *
            </label>
            <Select
              placeholder="Select your store..."
              value={storeLocationId || undefined}
              onChange={setStoreLocationId}
              className="w-full"
              showSearch
              optionFilterProp="children"
              options={locations
                .filter((l) => ["STORE", "KITCHEN"].includes(l.type))
                .map((l) => ({
                  value: l.id,
                  label: `${l.code} - ${l.name} (${l.type})`,
                }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Warehouse *
            </label>
            <Select
              placeholder="Order from warehouse..."
              value={warehouseLocationId || undefined}
              onChange={setWarehouseLocationId}
              className="w-full"
              showSearch
              optionFilterProp="children"
              options={locations
                .filter(
                  (l) =>
                    ["WAREHOUSE", "ZONE"].includes(l.type) &&
                    l.id !== storeLocationId
                )
                .map((l) => ({
                  value: l.id,
                  label: `${l.code} - ${l.name} (${l.type})`,
                }))}
            />
          </div>
        </div>

        {storeLocationId && inventory.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card size="small">
                <Statistic
                  title="Total Items"
                  value={inventory.length}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="Low Stock"
                  value={lowStockCount}
                  styles={{ content: { color: lowStockCount > 0 ? "#faad14" : "#52c41a" } }}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="Out of Stock"
                  value={outOfStockCount}
                  styles={{ content: { color: outOfStockCount > 0 ? "#ff4d4f" : "#52c41a" } }}
                />
              </Card>
            </div>

            <div className="flex justify-center">
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={generateSuggestions}
              >
                Generate Replenishment Suggestions
              </Button>
            </div>
          </>
        )}

        {storeLocationId && inventory.length === 0 && (
          <Empty description="No inventory found at this location" />
        )}

        {orderLines.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Replenishment Order ({orderLines.length} items)
            </h2>

            <Alert
              type="info"
              message="Review suggested quantities below. Adjust as needed, then submit to create a transfer from warehouse."
              className="mb-3"
              showIcon
            />

            <Table
              rowKey="key"
              columns={columns}
              dataSource={orderLines}
              pagination={false}
              size="small"
            />

            <div className="flex justify-end mt-4">
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                disabled={!warehouseLocationId}
              >
                Submit Order (Create Transfer)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
