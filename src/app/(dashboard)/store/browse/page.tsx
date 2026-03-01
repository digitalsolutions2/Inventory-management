"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Select, Card, Tag, Button, Spin, Empty } from "antd";
import { useRouter } from "next/navigation";
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
  item: {
    id: string;
    code: string;
    name: string;
    uom: string;
    reorderPoint: number;
    category: { name: string } | null;
  };
}

export default function BrowseStoresPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Fetch store/kitchen locations
  useEffect(() => {
    fetch("/api/locations?pageSize=100")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const stores = (res.data.data || res.data).filter(
            (l: Location) =>
              (l.type === "STORE" || l.type === "KITCHEN") &&
              l.id !== userContext?.locationId
          );
          setLocations(stores);
        }
      })
      .catch(() => toast.error("Failed to load locations"));
  }, [userContext?.locationId]);

  const fetchInventory = useCallback(async () => {
    if (!selectedLoc) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        locationId: selectedLoc,
        page: String(page),
        pageSize: "20",
      });
      const res = await fetch(`/api/store/inventory?${params}`);
      const json = await res.json();
      if (json.success) {
        setInventory(json.data.data);
        setTotal(json.data.total);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [selectedLoc, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.storePortal.browse.title}</h1>
        <Tag color="blue">{t.storePortal.browse.readOnly}</Tag>
      </div>

      <Card>
        <div className="mb-4">
          <Select
            value={selectedLoc || undefined}
            onChange={(v) => { setSelectedLoc(v); setPage(1); }}
            placeholder={t.storePortal.browse.selectStore}
            className="w-72"
            allowClear
            options={locations.map((l) => ({
              value: l.id,
              label: `${l.name} (${l.type})`,
            }))}
          />
        </div>

        {!selectedLoc ? (
          <Empty description={t.storePortal.browse.noStoreSelected} />
        ) : (
          <Table
            dataSource={inventory}
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
              { title: "Available", dataIndex: "quantity", width: 100 },
              {
                title: "", key: "action", width: 140,
                render: (_: unknown, r: InventoryRow) => (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() =>
                      router.push(
                        `/store/transfers/create?fromLocationId=${selectedLoc}&itemId=${r.item.id}`
                      )
                    }
                  >
                    {t.storePortal.browse.requestTransfer}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
