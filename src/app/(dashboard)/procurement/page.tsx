"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, Space, App } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  expectedDate: string | null;
  createdAt: string;
  supplier: { id: string; name: string; code: string };
  createdBy: { id: string; fullName: string };
  approvedBy?: { id: string; fullName: string } | null;
  _count: { lines: number };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  PENDING_QC_APPROVAL: "orange",
  PENDING_FINANCE_APPROVAL: "gold",
  PENDING_WAREHOUSE_APPROVAL: "lime",
  APPROVED: "green",
  SENT: "blue",
  PARTIALLY_RECEIVED: "cyan",
  RECEIVED: "geekblue",
  CANCELLED: "red",
};

export default function ProcurementPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: t.procurement.statusLabels.DRAFT,
    PENDING_QC_APPROVAL: t.procurement.statusLabels.PENDING_QC_APPROVAL,
    PENDING_FINANCE_APPROVAL: t.procurement.statusLabels.PENDING_FINANCE_APPROVAL,
    PENDING_WAREHOUSE_APPROVAL: t.procurement.statusLabels.PENDING_WAREHOUSE_APPROVAL,
    APPROVED: t.procurement.statusLabels.APPROVED,
    SENT: t.procurement.statusLabels.SENT,
    PARTIALLY_RECEIVED: t.procurement.statusLabels.PARTIALLY_RECEIVED,
    RECEIVED: t.procurement.statusLabels.RECEIVED,
    CANCELLED: t.procurement.statusLabels.CANCELLED,
  };

  const STATUS_TABS = [
    { key: "", label: t.procurement.statusTabs.all },
    { key: "DRAFT", label: t.procurement.statusTabs.draft },
    { key: "PENDING_QC_APPROVAL,PENDING_FINANCE_APPROVAL,PENDING_WAREHOUSE_APPROVAL", label: t.procurement.statusTabs.pendingQC },
    { key: "APPROVED", label: t.procurement.statusTabs.approved },
    { key: "SENT", label: t.procurement.statusTabs.sent },
    { key: "RECEIVED", label: t.procurement.statusTabs.received },
    { key: "CANCELLED", label: t.procurement.statusTabs.cancelled },
  ];

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/purchase-orders?${params}`);
    const json = await res.json();
    if (json.success) {
      setOrders(json.data.data);
      setTotal(json.data.total);
    } else {
      message.error(t.procurement.failedToLoad);
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, message, t.procurement.failedToLoad]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: t.procurement.columns.poNumber,
      dataIndex: "poNumber",
      width: 130,
      render: (val: string, record) => (
        <a onClick={() => router.push(`/procurement/${record.id}`)}>{val}</a>
      ),
    },
    {
      title: t.procurement.columns.supplier,
      dataIndex: ["supplier", "name"],
      ellipsis: true,
    },
    {
      title: t.procurement.columns.status,
      dataIndex: "status",
      width: 180,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status] || status}</Tag>
      ),
    },
    {
      title: t.procurement.columns.amount,
      dataIndex: "totalAmount",
      width: 130,
      align: "right",
      render: (v: number, r) => `${r.currency} ${v.toFixed(2)}`,
    },
    {
      title: t.procurement.columns.lines,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: t.procurement.columns.createdBy,
      dataIndex: ["createdBy", "fullName"],
      width: 140,
    },
    {
      title: t.procurement.columns.expected,
      dataIndex: "expectedDate",
      width: 110,
      render: (v: string | null) => (v ? dayjs(v).format("DD MMM YYYY") : "-"),
    },
    {
      title: t.procurement.columns.created,
      dataIndex: "createdAt",
      width: 110,
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "",
      width: 50,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/procurement/${record.id}`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.procurement.title}</h1>
        {hasPermission("po:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/procurement/create")}
          >
            {t.procurement.createPO}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.key}
              type={statusFilter === tab.key ? "primary" : "default"}
              size="small"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `${count} ${t.common.orders}`,
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
