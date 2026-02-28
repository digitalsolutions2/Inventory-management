"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Input, Select, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface InventoryRecord {
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
  location: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
  children?: Location[];
}

function flattenLocations(locations: Location[]): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  for (const loc of locations) {
    result.push({ id: loc.id, name: `${loc.name} (${loc.code})` });
    if (loc.children) {
      for (const child of loc.children) {
        result.push({ id: child.id, name: `  ${child.name} (${child.code})` });
      }
    }
  }
  return result;
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<InventoryRecord[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(locationFilter && { locationId: locationFilter }),
    });
    const res = await fetch(`/api/inventory?${params}`);
    const json = await res.json();
    if (json.success) {
      setData(json.data.data);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [page, pageSize, search, locationFilter]);

  const fetchLocations = useCallback(async () => {
    const res = await fetch("/api/locations?tree=true");
    const json = await res.json();
    if (json.success) {
      setLocations(flattenLocations(json.data));
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const getStockStatus = (qty: number, reorderPoint: number) => {
    if (qty === 0) return { label: t.inventory.outOfStock, color: "red" };
    if (qty <= reorderPoint) return { label: t.inventory.lowStock, color: "orange" };
    return { label: t.inventory.ok, color: "green" };
  };

  const columns: ColumnsType<InventoryRecord> = [
    {
      title: t.inventory.columns.itemCode,
      dataIndex: ["item", "code"],
      width: 120,
    },
    {
      title: t.inventory.columns.itemName,
      dataIndex: ["item", "name"],
      ellipsis: true,
    },
    {
      title: t.inventory.columns.location,
      dataIndex: ["location", "name"],
      width: 160,
    },
    {
      title: t.inventory.columns.uom,
      dataIndex: ["item", "uom"],
      width: 80,
    },
    {
      title: t.inventory.columns.quantity,
      dataIndex: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: t.inventory.columns.avgCost,
      dataIndex: "avgCost",
      width: 110,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: t.inventory.columns.totalValue,
      width: 120,
      align: "right",
      render: (_, record) => (record.quantity * record.avgCost).toFixed(2),
    },
    {
      title: t.inventory.columns.stockStatus,
      width: 120,
      render: (_, record) => {
        const status = getStockStatus(record.quantity, record.item.reorderPoint);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.inventory.title}</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-3">
          <Input
            placeholder={t.inventory.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
            allowClear
          />
          <Select
            placeholder={t.inventory.allLocations}
            value={locationFilter || undefined}
            onChange={(v) => {
              setLocationFilter(v || "");
              setPage(1);
            }}
            allowClear
            className="w-56"
          >
            {locations.map((loc) => (
              <Select.Option key={loc.id} value={loc.id}>
                {loc.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t.common.items}`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          size="small"
        />
      </div>
    </div>
  );
}
