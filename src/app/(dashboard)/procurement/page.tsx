"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, Space, App } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
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
  PENDING_APPROVAL: "orange",
  APPROVED: "green",
  SENT: "blue",
  PARTIALLY_RECEIVED: "cyan",
  RECEIVED: "geekblue",
  CANCELLED: "red",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "PENDING_APPROVAL", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "SENT", label: "Sent" },
  { key: "RECEIVED", label: "Received" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function ProcurementPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");

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
      message.error("Failed to load purchase orders");
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, message]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "PO Number",
      dataIndex: "poNumber",
      width: 130,
      render: (val: string, record) => (
        <a onClick={() => router.push(`/procurement/${record.id}`)}>{val}</a>
      ),
    },
    {
      title: "Supplier",
      dataIndex: ["supplier", "name"],
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status] || status}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      width: 130,
      align: "right",
      render: (v: number, r) => `${r.currency} ${v.toFixed(2)}`,
    },
    {
      title: "Lines",
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "fullName"],
      width: 140,
    },
    {
      title: "Expected",
      dataIndex: "expectedDate",
      width: 110,
      render: (v: string | null) => (v ? dayjs(v).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Created",
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
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        {hasPermission("po:create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/procurement/create")}
          >
            Create PO
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
            showTotal: (t) => `${t} orders`,
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
