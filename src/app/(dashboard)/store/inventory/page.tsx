"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Input, Select, Card, Tag, Spin, Alert } from "antd";
import { useTranslation } from "@/lib/i18n";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface InventoryRow {
  id: string;
  quantity: number;
  avgCost: number;
  item: {
    id: string;
    code: string;
    name: string;
    uom: string;
    minStock: number;
    reorderPoint: number;
    category: { name: string } | null;
  };
  location: { id: string; name: string };
}

export default function StoreInventoryPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const [data, setData] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!userContext?.locationId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        locationId: userContext.locationId,
        page: String(page),
        pageSize: "20",
        ...(search && { search }),
        ...(stockFilter && { stockFilter }),
      });
      const res = await fetch(`/api/store/inventory?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data.data);
        setTotal(json.data.total);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [userContext?.locationId, page, search, stockFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!userContext?.locationId) {
    return <Alert type="warning" message="You must be assigned to a location." showIcon />;
  }

  const getStockTag = (qty: number, reorder: number) => {
    if (qty <= 0) return <Tag color="error">{t.storePortal.inventory.outOfStock}</Tag>;
    if (reorder > 0 && qty <= reorder) return <Tag color="warning">{t.storePortal.inventory.lowStock}</Tag>;
    return <Tag color="success">OK</Tag>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.storePortal.inventory.title}</h1>

      <Card>
        <div className="flex gap-4 mb-4">
          <Input.Search
            placeholder={t.storePortal.inventory.searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onSearch={fetchData}
            className="max-w-xs"
            allowClear
          />
          <Select
            value={stockFilter || undefined}
            onChange={(v) => { setStockFilter(v || ""); setPage(1); }}
            placeholder={t.storePortal.inventory.stockFilter}
            allowClear
            className="w-40"
            options={[
              { value: "low", label: t.storePortal.inventory.lowStock },
              { value: "out", label: t.storePortal.inventory.outOfStock },
            ]}
          />
        </div>

        <Table
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `${t} items`,
          }}
          columns={[
            { title: "Code", dataIndex: ["item", "code"], width: 100 },
            { title: "Item", dataIndex: ["item", "name"] },
            { title: "Category", dataIndex: ["item", "category", "name"], render: (v: string) => v || "-" },
            { title: "UOM", dataIndex: ["item", "uom"], width: 70 },
            {
              title: "Quantity", dataIndex: "quantity", width: 100,
              render: (v: number) => <span className={v <= 0 ? "text-red-500 font-bold" : ""}>{v}</span>,
            },
            { title: "Avg Cost", dataIndex: "avgCost", width: 100, render: (v: number) => `SAR ${v.toFixed(2)}` },
            { title: "Value", key: "value", width: 110, render: (_: unknown, r: InventoryRow) => `SAR ${(r.quantity * r.avgCost).toFixed(2)}` },
            {
              title: "Status", key: "status", width: 100,
              render: (_: unknown, r: InventoryRow) => getStockTag(r.quantity, r.item.reorderPoint),
            },
          ]}
        />
      </Card>
    </div>
  );
}
