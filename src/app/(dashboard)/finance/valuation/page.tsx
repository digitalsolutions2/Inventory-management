"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, Radio, App } from "antd";
import { DollarOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface ValuationRow {
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

interface ValuationData {
  rows: ValuationRow[];
  totalValue: number;
  totalQty: number;
}

export default function ValuationPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/inventory-valuation");
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    } else {
      message.error("Failed to load valuation data");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    if (!data) return;
    const res = await fetch("/api/export/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Inventory Valuation Report",
        columns: [
          { header: "Item Code", key: "itemCode", width: 15 },
          { header: "Item Name", key: "itemName", width: 30 },
          { header: "UOM", key: "uom", width: 8 },
          { header: "Category", key: "category", width: 20 },
          { header: "Location", key: "location", width: 20 },
          { header: "Quantity", key: "quantity", width: 12 },
          { header: "Avg Cost", key: "avgCost", width: 12 },
          { header: "Total Value", key: "totalValue", width: 15 },
        ],
        rows: data.rows,
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Inventory_Valuation.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const columns: ColumnsType<ValuationRow> = [
    { title: "Item Code", dataIndex: "itemCode", width: 110 },
    { title: "Item Name", dataIndex: "itemName", ellipsis: true },
    { title: "UOM", dataIndex: "uom", width: 60, align: "center" },
    { title: "Category", dataIndex: "category", width: 140 },
    { title: "Location", dataIndex: "location", width: 140 },
    {
      title: "Quantity",
      dataIndex: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: "Avg Cost",
      dataIndex: "avgCost",
      width: 100,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      title: "Total Value",
      dataIndex: "totalValue",
      width: 120,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
      sorter: (a, b) => a.totalValue - b.totalValue,
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card size="small">
          <Statistic
            title="Total Inventory Value"
            value={data?.totalValue || 0}
            precision={2}
            prefix={<DollarOutlined />}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Total Items in Stock"
            value={data?.totalQty || 0}
            precision={0}
          />
        </Card>
      </div>

      <div className="flex justify-end">
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Export to Excel
        </Button>
      </div>

      <Table
        rowKey={(r) => `${r.itemCode}-${r.location}`}
        columns={columns}
        dataSource={data?.rows || []}
        loading={loading}
        pagination={{ pageSize: 50, showTotal: (t) => `${t} items` }}
        size="small"
        summary={() =>
          data ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <strong>{data.totalQty}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
              <Table.Summary.Cell index={7} align="right">
                <strong>${data.totalValue.toFixed(2)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : undefined
        }
      />
    </div>
  );
}
