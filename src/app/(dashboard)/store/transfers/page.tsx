"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Tag, Button, Card, Tabs } from "antd";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface TransferRow {
  id: string;
  transferNumber: string;
  status: string;
  notes: string | null;
  createdAt: string;
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
  createdBy: { fullName: string };
  _count: { lines: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  APPROVED: "blue",
  IN_TRANSIT: "processing",
  RECEIVED: "success",
  CANCELLED: "error",
};

export default function StoreTransfersPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
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
      });
      const res = await fetch(`/api/transfers?${params}`);
      const json = await res.json();
      if (json.success) {
        setTransfers(json.data.data);
        setTotal(json.data.total);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, [userContext?.locationId, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = transfers.filter((t) => {
    if (tab === "incoming") return t.toLocation.id === userContext?.locationId;
    if (tab === "outgoing") return t.fromLocation.id === userContext?.locationId;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.storePortal.transfers.title}</h1>
        <Link href="/store/transfers/create">
          <Button type="primary">{t.storePortal.transfers.createTransfer}</Button>
        </Link>
      </div>

      <Card>
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k)}
          items={[
            { key: "all", label: t.common.all },
            { key: "incoming", label: t.storePortal.transfers.incoming },
            { key: "outgoing", label: t.storePortal.transfers.outgoing },
          ]}
        />
        <Table
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
          }}
          columns={[
            { title: "Transfer #", dataIndex: "transferNumber" },
            { title: "From", dataIndex: ["fromLocation", "name"] },
            { title: "To", dataIndex: ["toLocation", "name"] },
            {
              title: "Status", dataIndex: "status",
              render: (v: string) => <Tag color={STATUS_COLORS[v] || "default"}>{v}</Tag>,
            },
            { title: "Items", dataIndex: ["_count", "lines"] },
            { title: "Created By", dataIndex: ["createdBy", "fullName"] },
            { title: "Date", dataIndex: "createdAt", render: (v: string) => new Date(v).toLocaleDateString() },
          ]}
        />
      </Card>

      <div className="text-sm text-gray-500">
        {t.storePortal.transfers.storeToStoreNote}
      </div>
    </div>
  );
}
