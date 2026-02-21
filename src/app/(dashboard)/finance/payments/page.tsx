"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Statistic,
  App,
} from "antd";
import { PlusOutlined, DollarOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    totalAmount: number;
    supplier: { id: string; name: string; code: string };
  };
  recordedBy: { id: string; fullName: string };
}

interface PO {
  id: string;
  poNumber: string;
  totalAmount: number;
  supplier: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  PARTIAL: "blue",
  PAID: "green",
  OVERDUE: "red",
};

export default function PaymentsPage() {
  const { message } = App.useApp();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/payments?${params}`);
    const json = await res.json();
    if (json.success) {
      setPayments(json.data.data);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [page, statusFilter]);

  const fetchPOs = useCallback(async () => {
    const res = await fetch("/api/purchase-orders?pageSize=100");
    const json = await res.json();
    if (json.success) setPos(json.data.data);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        dueDate: values.dueDate
          ? (values.dueDate as dayjs.Dayjs).toISOString()
          : undefined,
        paidAt: values.paidAt
          ? (values.paidAt as dayjs.Dayjs).toISOString()
          : undefined,
      }),
    });
    const json = await res.json();
    if (json.success) {
      message.success("Payment recorded!");
      setModalOpen(false);
      form.resetFields();
      fetchPayments();
    } else {
      message.error(json.error || "Failed to record payment");
    }
    setSubmitting(false);
  };

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payments
    .filter((p) => ["PENDING", "PARTIAL", "OVERDUE"].includes(p.status))
    .reduce((s, p) => s + p.amount, 0);

  const columns: ColumnsType<Payment> = [
    {
      title: "PO #",
      dataIndex: ["purchaseOrder", "poNumber"],
      width: 120,
    },
    {
      title: "Supplier",
      dataIndex: ["purchaseOrder", "supplier", "name"],
      ellipsis: true,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 120,
      align: "right",
      render: (v: number, r) => `${r.currency} ${v.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Paid At",
      dataIndex: "paidAt",
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      width: 100,
      render: (v: string | null) => v || "-",
    },
    {
      title: "Reference",
      dataIndex: "referenceNumber",
      width: 120,
      render: (v: string | null) => v || "-",
    },
    {
      title: "Recorded By",
      dataIndex: ["recordedBy", "fullName"],
      width: 130,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card size="small">
          <Statistic
            title="Total Paid"
            value={totalPaid}
            precision={2}
            prefix={<DollarOutlined />}
            styles={{ content: { color: "#52c41a" } }}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Total Outstanding"
            value={totalPending}
            precision={2}
            prefix={<DollarOutlined />}
            styles={{ content: { color: totalPending > 0 ? "#faad14" : "#52c41a" } }}
          />
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {["", "PENDING", "PAID", "OVERDUE"].map((s) => (
            <Button
              key={s}
              type={statusFilter === s ? "primary" : "default"}
              size="small"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s || "All"}
            </Button>
          ))}
        </div>
        {hasPermission("payments:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Record Payment
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={payments}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: (p) => setPage(p),
        }}
        size="small"
      />

      <Modal
        title="Record Payment"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="purchaseOrderId"
            label="Purchase Order"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select PO..."
              options={pos.map((po) => ({
                value: po.id,
                label: `${po.poNumber} - ${po.supplier.name} ($${po.totalAmount.toFixed(2)})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true }]}
          >
            <InputNumber min={0.01} step={0.01} className="w-full" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="paidAt" label="Paid Date">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="paymentMethod" label="Method">
              <Select
                placeholder="Select..."
                options={[
                  { value: "Bank Transfer", label: "Bank Transfer" },
                  { value: "Check", label: "Check" },
                  { value: "Cash", label: "Cash" },
                  { value: "Credit Card", label: "Credit Card" },
                ]}
              />
            </Form.Item>
            <Form.Item name="referenceNumber" label="Reference #">
              <Input placeholder="Invoice/reference number" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Record Payment
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
