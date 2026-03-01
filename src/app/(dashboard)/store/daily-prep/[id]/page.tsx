"use client";

import { useEffect, useState } from "react";
import { Card, Tag, Table, Descriptions, Spin, Button } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

interface PrepOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  prepDate: string;
  notes: string | null;
  createdAt: string;
  location: { name: string };
  createdBy: { fullName: string };
  transfer: {
    id: string;
    transferNumber: string;
    status: string;
    fromLocation: { name: string };
    toLocation: { name: string };
    lines: Array<{
      id: string;
      quantity: number;
      receivedQty: number;
      item: { code: string; name: string; uom: string };
    }>;
  } | null;
  lines: Array<{
    id: string;
    quantity: number;
    notes: string | null;
    recipe: {
      code: string;
      name: string;
      yieldQty: number;
      yieldUom: string;
      lines: Array<{
        quantity: number;
        item: { code: string; name: string; uom: string };
      }>;
    };
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  SUBMITTED: "processing",
  TRANSFER_CREATED: "blue",
  COMPLETED: "success",
  CANCELLED: "error",
  PENDING: "orange",
  APPROVED: "blue",
  IN_TRANSIT: "processing",
  RECEIVED: "success",
};

export default function PrepOrderDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [order, setOrder] = useState<PrepOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/daily-prep/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOrder(res.data);
        else toast.error(res.error);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />;
  if (!order) return <div>Not found</div>;

  // Calculate material breakdown
  const materials = new Map<string, { code: string; name: string; uom: string; quantity: number }>();
  for (const line of order.lines) {
    for (const ingredient of line.recipe.lines) {
      const qty = ingredient.quantity * line.quantity;
      const key = ingredient.item.code;
      const existing = materials.get(key);
      if (existing) {
        existing.quantity += qty;
      } else {
        materials.set(key, {
          code: ingredient.item.code,
          name: ingredient.item.name,
          uom: ingredient.item.uom,
          quantity: qty,
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <Tag color={STATUS_COLORS[order.status] || "default"} className="text-sm px-3 py-1">
          {t.storePortal.dailyPrep.statusLabels[order.status as keyof typeof t.storePortal.dailyPrep.statusLabels] || order.status}
        </Tag>
      </div>

      <Card>
        <Descriptions column={2} size="small">
          <Descriptions.Item label={t.storePortal.dailyPrep.prepDate}>
            {new Date(order.prepDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Location">{order.location.name}</Descriptions.Item>
          <Descriptions.Item label="Created By">{order.createdBy.fullName}</Descriptions.Item>
          <Descriptions.Item label={t.common.createdAt}>
            {new Date(order.createdAt).toLocaleString()}
          </Descriptions.Item>
          {order.notes && (
            <Descriptions.Item label={t.common.notes} span={2}>{order.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={t.storePortal.dailyPrep.recipesOrdered}>
        <Table
          dataSource={order.lines}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: "Code", dataIndex: ["recipe", "code"], width: 100 },
            { title: "Recipe", dataIndex: ["recipe", "name"] },
            {
              title: "Yield", key: "yield",
              render: (_: unknown, r: PrepOrderDetail["lines"][0]) =>
                `${r.recipe.yieldQty} ${r.recipe.yieldUom}`,
            },
            { title: "Qty Ordered", dataIndex: "quantity", width: 110 },
            {
              title: "Ingredients", key: "ingredients",
              render: (_: unknown, r: PrepOrderDetail["lines"][0]) =>
                r.recipe.lines.map((i) => `${i.item.name} (${(i.quantity * r.quantity).toFixed(2)} ${i.item.uom})`).join(", "),
            },
          ]}
        />
      </Card>

      <Card title={t.storePortal.dailyPrep.totalMaterials}>
        <Table
          dataSource={Array.from(materials.values())}
          rowKey="code"
          size="small"
          pagination={false}
          columns={[
            { title: "Code", dataIndex: "code", width: 100 },
            { title: "Item", dataIndex: "name" },
            { title: "UOM", dataIndex: "uom", width: 70 },
            {
              title: "Total Needed", dataIndex: "quantity", width: 120,
              render: (v: number) => <span className="font-bold">{v.toFixed(2)}</span>,
            },
          ]}
        />
      </Card>

      {order.transfer && (
        <Card title={t.storePortal.dailyPrep.linkedTransfer}>
          <div className="mb-3">
            <Tag color={STATUS_COLORS[order.transfer.status] || "default"} className="text-sm">
              {order.transfer.transferNumber} — {order.transfer.status}
            </Tag>
            <span className="ml-2 text-gray-500">
              {order.transfer.fromLocation.name} → {order.transfer.toLocation.name}
            </span>
          </div>
          <Table
            dataSource={order.transfer.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: "Code", dataIndex: ["item", "code"], width: 100 },
              { title: "Item", dataIndex: ["item", "name"] },
              { title: "UOM", dataIndex: ["item", "uom"], width: 70 },
              { title: "Requested", dataIndex: "quantity", width: 100 },
              { title: "Received", dataIndex: "receivedQty", width: 100 },
            ]}
          />
        </Card>
      )}

      <Link href="/store/daily-prep">
        <Button>{t.common.back}</Button>
      </Link>
    </div>
  );
}
