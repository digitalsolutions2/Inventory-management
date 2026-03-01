"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Button, Card } from "antd";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface PrepOrder {
  id: string;
  orderNumber: string;
  status: string;
  prepDate: string;
  notes: string | null;
  createdAt: string;
  location: { name: string };
  createdBy: { fullName: string };
  transfer: { id: string; transferNumber: string; status: string } | null;
  _count: { lines: number };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  SUBMITTED: "processing",
  TRANSFER_CREATED: "blue",
  COMPLETED: "success",
  CANCELLED: "error",
};

export default function DailyPrepListPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const [orders, setOrders] = useState<PrepOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        ...(userContext?.locationId && { locationId: userContext.locationId }),
      });
      const res = await fetch(`/api/daily-prep?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.data);
        setTotal(json.data.total);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error(t.storePortal.dailyPrep.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [page, userContext?.locationId, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.storePortal.dailyPrep.title}</h1>
        <Link href="/store/daily-prep/create">
          <Button type="primary">{t.storePortal.dailyPrep.createOrder}</Button>
        </Link>
      </div>

      <Card>
        <Table
          dataSource={orders}
          rowKey="id"
          loading={loading}
          size="small"
          locale={{ emptyText: t.storePortal.dailyPrep.noOrders }}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
          }}
          columns={[
            {
              title: t.storePortal.dailyPrep.orderNumber, dataIndex: "orderNumber",
              render: (v: string, r: PrepOrder) => <Link href={`/store/daily-prep/${r.id}`} className="text-blue-600 font-medium">{v}</Link>,
            },
            {
              title: t.common.status, dataIndex: "status",
              render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{t.storePortal.dailyPrep.statusLabels[v as keyof typeof t.storePortal.dailyPrep.statusLabels] || v}</Tag>,
            },
            { title: t.storePortal.dailyPrep.prepDate, dataIndex: "prepDate", render: (v: string) => new Date(v).toLocaleDateString() },
            { title: t.storePortal.dailyPrep.recipesOrdered, dataIndex: ["_count", "lines"] },
            {
              title: t.storePortal.dailyPrep.linkedTransfer, dataIndex: "transfer",
              render: (tr: PrepOrder["transfer"]) =>
                tr ? (
                  <Tag color={STATUS_COLORS[tr.status] || "default"}>
                    {tr.transferNumber} ({tr.status})
                  </Tag>
                ) : "-",
            },
            { title: t.common.createdAt, dataIndex: "createdAt", render: (v: string) => new Date(v).toLocaleDateString() },
          ]}
        />
      </Card>
    </div>
  );
}
