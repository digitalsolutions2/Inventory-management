"use client";

import { useEffect, useState } from "react";
import { Card, Statistic, Table, Tag, Button, Spin, Alert, Row, Col } from "antd";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface DashboardData {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  pendingIncoming: number;
  pendingOutgoing: number;
  recentPreps: Array<{
    id: string;
    orderNumber: string;
    status: string;
    prepDate: string;
    transfer: { transferNumber: string; status: string } | null;
    _count: { lines: number };
  }>;
  lowStockItems: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    uom: string;
    quantity: number;
    reorderPoint: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  SUBMITTED: "processing",
  TRANSFER_CREATED: "blue",
  COMPLETED: "success",
  CANCELLED: "error",
};

export default function StoreDashboardPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userContext?.locationId) {
      setLoading(false);
      return;
    }
    fetch("/api/store/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else toast.error(res.error);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [userContext?.locationId]);

  if (!userContext?.locationId) {
    return <Alert type="warning" message="You must be assigned to a location to view the store dashboard." showIcon />;
  }

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.storePortal.dashboard.title}</h1>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card><Statistic title={t.storePortal.dashboard.totalItems} value={data?.totalItems || 0} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title={t.storePortal.dashboard.totalValue} value={data?.totalValue || 0} precision={2} prefix="SAR " /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title={t.storePortal.dashboard.lowStock} value={data?.lowStock || 0} valueStyle={{ color: data?.lowStock ? "#faad14" : undefined }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title={t.storePortal.dashboard.outOfStock} value={data?.outOfStock || 0} valueStyle={{ color: data?.outOfStock ? "#ff4d4f" : undefined }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card><Statistic title={t.storePortal.dashboard.pendingIncoming} value={data?.pendingIncoming || 0} valueStyle={{ color: "#1677ff" }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title={t.storePortal.dashboard.pendingOutgoing} value={data?.pendingOutgoing || 0} /></Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title={t.storePortal.dashboard.quickActions}>
            <div className="flex flex-wrap gap-2">
              <Link href="/store/inventory"><Button>{t.storePortal.dashboard.viewInventory}</Button></Link>
              <Link href="/store/browse"><Button>{t.storePortal.dashboard.browseStores}</Button></Link>
              <Link href="/store/transfers/create"><Button type="primary">{t.storePortal.dashboard.createTransfer}</Button></Link>
              <Link href="/store/daily-prep/create"><Button type="primary">{t.storePortal.dashboard.createPrepOrder}</Button></Link>
            </div>
          </Card>
        </Col>
      </Row>

      {data?.lowStockItems && data.lowStockItems.length > 0 && (
        <Card title={t.storePortal.dashboard.lowStockAlerts}>
          <Table
            dataSource={data.lowStockItems}
            rowKey="itemId"
            pagination={false}
            size="small"
            columns={[
              { title: "Code", dataIndex: "itemCode" },
              { title: "Item", dataIndex: "itemName" },
              { title: "UOM", dataIndex: "uom" },
              {
                title: "Current", dataIndex: "quantity",
                render: (v: number, r: { reorderPoint: number }) => (
                  <span className={v <= 0 ? "text-red-500 font-bold" : v <= r.reorderPoint ? "text-yellow-500 font-bold" : ""}>{v}</span>
                ),
              },
              { title: "Reorder At", dataIndex: "reorderPoint" },
            ]}
          />
        </Card>
      )}

      <Card title={t.storePortal.dashboard.recentPrepOrders}>
        <Table
          dataSource={data?.recentPreps || []}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: t.storePortal.dailyPrep.noOrders }}
          columns={[
            { title: "Order #", dataIndex: "orderNumber", render: (v: string, r: { id: string }) => <Link href={`/store/daily-prep/${r.id}`} className="text-blue-600">{v}</Link> },
            { title: "Status", dataIndex: "status", render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{v}</Tag> },
            { title: "Recipes", dataIndex: ["_count", "lines"] },
            {
              title: "Transfer", dataIndex: "transfer",
              render: (tr: { transferNumber: string; status: string } | null) => tr ? <Tag>{tr.transferNumber} ({tr.status})</Tag> : "-",
            },
            { title: "Date", dataIndex: "prepDate", render: (v: string) => new Date(v).toLocaleDateString() },
          ]}
        />
      </Card>
    </div>
  );
}
