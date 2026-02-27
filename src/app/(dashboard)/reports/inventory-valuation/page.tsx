"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, Select, Empty, Skeleton, App } from "antd";
import {
  DownloadOutlined,
  DollarOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { exportToExcel } from "@/lib/export-excel";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface Row {
  itemCode: string;
  itemName: string;
  uom: string;
  category: string;
  location: string;
  locationType: string;
  quantity: number;
  avgCost: number;
  totalValue: number;
}

const PIE_COLORS = ["#1890ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16"];

export default function InventoryValuationReport() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [_totalValue, setTotalValue] = useState(0);
  const [_totalQty, setTotalQty] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/inventory-valuation");
    const json = await res.json();
    if (json.success) {
      setRows(json.data.rows);
      setTotalValue(json.data.totalValue);
      setTotalQty(json.data.totalQty);
    } else {
      message.error(t.reports.failedToLoad);
    }
    setLoading(false);
  }, [message, t]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  // Derived data
  const locations = [...new Set(rows.map((r) => r.location))];
  const categories = [...new Set(rows.map((r) => r.category))];

  const filtered = rows.filter(
    (r) =>
      (!locationFilter || r.location === locationFilter) &&
      (!categoryFilter || r.category === categoryFilter)
  );

  // Breakdown by location
  const byLocation = Object.values(
    filtered.reduce(
      (acc, r) => {
        if (!acc[r.location]) acc[r.location] = { location: r.location, items: 0, qty: 0, value: 0 };
        acc[r.location].items++;
        acc[r.location].qty += r.quantity;
        acc[r.location].value += r.totalValue;
        return acc;
      },
      {} as Record<string, { location: string; items: number; qty: number; value: number }>
    )
  ).sort((a, b) => b.value - a.value);

  // Breakdown by category
  const byCategory = Object.values(
    filtered.reduce(
      (acc, r) => {
        const cat = r.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = { category: cat, items: 0, qty: 0, value: 0 };
        acc[cat].items++;
        acc[cat].qty += r.quantity;
        acc[cat].value += r.totalValue;
        return acc;
      },
      {} as Record<string, { category: string; items: number; qty: number; value: number }>
    )
  ).sort((a, b) => b.value - a.value);

  const filteredTotalValue = filtered.reduce((s, r) => s + r.totalValue, 0);
  const _filteredTotalQty = filtered.reduce((s, r) => s + r.quantity, 0);

  const columns: ColumnsType<Row> = [
    { title: t.reports.code, dataIndex: "itemCode", width: 100 },
    { title: t.reports.item, dataIndex: "itemName", ellipsis: true },
    { title: t.reports.category, dataIndex: "category", width: 140, filters: categories.map((c) => ({ text: c, value: c })), onFilter: (v, r) => r.category === v },
    { title: t.reports.location, dataIndex: "location", width: 140, filters: locations.map((l) => ({ text: l, value: l })), onFilter: (v, r) => r.location === v },
    { title: t.reports.qty, dataIndex: "quantity", width: 80, align: "right", sorter: (a, b) => a.quantity - b.quantity },
    { title: t.finance.valuation.columns.avgCost, dataIndex: "avgCost", width: 100, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
    {
      title: t.reports.value,
      dataIndex: "totalValue",
      width: 120,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
      sorter: (a, b) => a.totalValue - b.totalValue,
      defaultSortOrder: "descend",
    },
    {
      title: t.reports.percentOfTotal,
      width: 100,
      align: "right",
      render: (_, r) => {
        const pct = filteredTotalValue > 0 ? ((r.totalValue / filteredTotalValue) * 100) : 0;
        return <span className="text-gray-500">{pct.toFixed(1)}%</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="small"><Skeleton active paragraph={{ rows: 1 }} /></Card>
          ))}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#1890ff" }}>
          <Statistic title={t.reports.totalValue} value={filteredTotalValue} precision={2} prefix={<DollarOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#52c41a" }}>
          <Statistic title={t.reports.totalItems} value={filtered.length} prefix={<InboxOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#722ed1" }}>
          <Statistic title={t.reports.locations} value={byLocation.length} prefix={<EnvironmentOutlined />} />
        </Card>
        <Card size="small" className="border-l-4" style={{ borderLeftColor: "#faad14" }}>
          <Statistic title={t.reports.avgItemValue} value={filtered.length > 0 ? filteredTotalValue / filtered.length : 0} precision={2} prefix={<DollarOutlined />} />
        </Card>
      </div>

      {/* Filters & Export */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <Select
            placeholder={t.reports.filterByLocation}
            value={locationFilter || undefined}
            onChange={(v) => setLocationFilter(v || "")}
            allowClear
            className="w-48"
            options={locations.map((l) => ({ value: l, label: l }))}
          />
          <Select
            placeholder={t.reports.filterByCategory}
            value={categoryFilter || undefined}
            onChange={(v) => setCategoryFilter(v || "")}
            allowClear
            className="w-48"
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetch_}>
            {t.common.refresh}
          </Button>
        </div>
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          onClick={() =>
            exportToExcel(t.reports.inventoryValuation, [
              { header: t.reports.code, key: "itemCode", width: 12 },
              { header: t.reports.item, key: "itemName", width: 30 },
              { header: t.reports.category, key: "category", width: 18 },
              { header: t.reports.location, key: "location", width: 18 },
              { header: t.reports.qty, key: "quantity", width: 10 },
              { header: t.finance.valuation.columns.avgCost, key: "avgCost", width: 12 },
              { header: t.reports.value, key: "totalValue", width: 14 },
            ], filtered)
          }
        >
          {t.common.exportToExcel}
        </Button>
      </div>

      {/* Charts: By Location & By Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t.reports.valueByLocation} size="small" styles={{ body: { padding: "12px 12px 0" } }}>
          {byLocation.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byLocation.slice(0, 8)} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="location" fontSize={10} angle={-20} textAnchor="end" height={50} />
                <YAxis fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, t.reports.value]} />
                <Bar dataKey="value" fill="#1890ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title={t.reports.valueByCategory} size="small" styles={{ body: { padding: "12px" } }}>
          {byCategory.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(entry: Record<string, any>) =>
                    `${(entry.category?.length > 10 ? entry.category.slice(0, 10) + "..." : entry.category) ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                  }
                  fontSize={11}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, t.reports.value]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t.reports.breakdownByLocation} size="small">
          <Table
            rowKey="location"
            dataSource={byLocation}
            pagination={false}
            size="small"
            columns={[
              { title: t.reports.location, dataIndex: "location", ellipsis: true },
              { title: t.reports.totalItems, dataIndex: "items", width: 70, align: "right" },
              { title: t.reports.qty, dataIndex: "qty", width: 80, align: "right" },
              { title: t.reports.value, dataIndex: "value", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
              {
                title: t.reports.percentOfTotal,
                width: 90,
                align: "right",
                render: (_, r) => {
                  const pct = filteredTotalValue > 0 ? ((r.value / filteredTotalValue) * 100) : 0;
                  return (
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-12 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs">{pct.toFixed(1)}%</span>
                    </div>
                  );
                },
              },
            ]}
          />
        </Card>

        <Card title={t.reports.breakdownByCategory} size="small">
          <Table
            rowKey="category"
            dataSource={byCategory}
            pagination={false}
            size="small"
            columns={[
              { title: t.reports.category, dataIndex: "category", ellipsis: true },
              { title: t.reports.totalItems, dataIndex: "items", width: 70, align: "right" },
              { title: t.reports.qty, dataIndex: "qty", width: 80, align: "right" },
              { title: t.reports.value, dataIndex: "value", width: 120, align: "right", render: (v: number) => `$${v.toFixed(2)}` },
              {
                title: t.reports.percentOfTotal,
                width: 90,
                align: "right",
                render: (_, r) => {
                  const pct = filteredTotalValue > 0 ? ((r.value / filteredTotalValue) * 100) : 0;
                  return (
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-12 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs">{pct.toFixed(1)}%</span>
                    </div>
                  );
                },
              },
            ]}
          />
        </Card>
      </div>

      {/* Detail Table */}
      <Card title={t.reports.allItems} size="small">
        <Table
          rowKey={(r) => `${r.itemCode}-${r.location}`}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 50, showTotal: (total) => `${total} ${t.common.items}` }}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
