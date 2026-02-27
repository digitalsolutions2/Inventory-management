"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Card, Statistic, App } from "antd";
import { DollarOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/inventory-valuation");
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    } else {
      message.error(t.finance.valuation.failedToLoad);
    }
    setLoading(false);
  }, [message, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    if (!data) return;
    try {
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.finance.valuation.title,
          columns: [
            { header: t.finance.valuation.columns.itemCode, key: "itemCode", width: 15 },
            { header: t.finance.valuation.columns.itemName, key: "itemName", width: 30 },
            { header: t.finance.valuation.uom, key: "uom", width: 8 },
            { header: t.finance.valuation.category, key: "category", width: 20 },
            { header: t.finance.valuation.columns.location, key: "location", width: 20 },
            { header: t.finance.valuation.columns.quantity, key: "quantity", width: 12 },
            { header: t.finance.valuation.columns.avgCost, key: "avgCost", width: 12 },
            { header: t.finance.valuation.columns.totalValue, key: "totalValue", width: 15 },
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
      } else {
        message.error(t.finance.valuation.failedToExport);
      }
    } catch {
      message.error(t.finance.valuation.networkErrorExport);
    }
  };

  const columns: ColumnsType<ValuationRow> = [
    { title: t.finance.valuation.columns.itemCode, dataIndex: "itemCode", width: 110 },
    { title: t.finance.valuation.columns.itemName, dataIndex: "itemName", ellipsis: true },
    { title: t.finance.valuation.uom, dataIndex: "uom", width: 60, align: "center" },
    { title: t.finance.valuation.category, dataIndex: "category", width: 140 },
    { title: t.finance.valuation.columns.location, dataIndex: "location", width: 140 },
    {
      title: t.finance.valuation.columns.quantity,
      dataIndex: "quantity",
      width: 100,
      align: "right",
    },
    {
      title: t.finance.valuation.columns.avgCost,
      dataIndex: "avgCost",
      width: 100,
      align: "right",
      render: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      title: t.finance.valuation.columns.totalValue,
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
            title={t.finance.valuation.totalInventoryValue}
            value={data?.totalValue || 0}
            precision={2}
            prefix={<DollarOutlined />}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={t.finance.valuation.totalItemsInStock}
            value={data?.totalQty || 0}
            precision={0}
          />
        </Card>
      </div>

      <div className="flex justify-end">
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          {t.finance.valuation.exportCsv}
        </Button>
      </div>

      <Table
        rowKey={(r) => `${r.itemCode}-${r.location}`}
        columns={columns}
        dataSource={data?.rows || []}
        loading={loading}
        pagination={{ pageSize: 50, showTotal: (total) => `${total} ${t.common.items}` }}
        size="small"
        summary={() =>
          data ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <strong>{t.common.total}</strong>
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
