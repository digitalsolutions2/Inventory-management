"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Tag, Space, Popconfirm, Rate, App } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms: number;
  rating: number;
  isActive: boolean;
}

export default function SuppliersPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
    });
    const res = await fetch(`/api/suppliers?${params}`);
    const json = await res.json();
    if (json.success) {
      setSuppliers(json.data.data);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSubmit = async (values: { code: string; name: string; contactName?: string; email?: string; phone?: string; address?: string; paymentTerms: number; rating: number }) => {
    setSubmitting(true);
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingSupplier ? t.suppliers.supplierUpdated : t.suppliers.supplierCreated);
        setModalOpen(false);
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        message.error(json.error || t.common.failed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      message.success(t.suppliers.supplierDeactivated);
      fetchSuppliers();
    } else {
      message.error(json.error || t.common.failed);
    }
  };

  const columns: ColumnsType<Supplier> = [
    { title: t.suppliers.columns.code, dataIndex: "code", width: 110 },
    { title: t.suppliers.columns.name, dataIndex: "name", ellipsis: true },
    { title: t.suppliers.columns.contact, dataIndex: "contactName", width: 150, render: (v: string) => v || "-" },
    { title: t.suppliers.columns.email, dataIndex: "email", width: 180, render: (v: string) => v || "-" },
    { title: t.suppliers.columns.phone, dataIndex: "phone", width: 130, render: (v: string) => v || "-" },
    {
      title: t.suppliers.columns.terms,
      dataIndex: "paymentTerms",
      width: 80,
      align: "right",
      render: (v: number) => `${v}d`,
    },
    {
      title: t.suppliers.columns.rating,
      dataIndex: "rating",
      width: 140,
      render: (v: number) => <Rate disabled allowHalf value={v} style={{ fontSize: 14 }} />,
    },
    {
      title: t.suppliers.columns.status,
      dataIndex: "isActive",
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? t.common.active : t.common.inactive}</Tag>
      ),
    },
    {
      title: t.suppliers.columns.actions,
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("supplier:edit") && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingSupplier(record);
                setModalOpen(true);
              }}
            />
          )}
          {hasPermission("supplier:delete") && (
            <Popconfirm
              title={t.suppliers.deactivateConfirm}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.suppliers.title}</h1>
        {hasPermission("supplier:create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSupplier(null);
              setModalOpen(true);
            }}
          >
            {t.suppliers.addSupplier}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Input
            placeholder={t.suppliers.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
            allowClear
          />
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={suppliers}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t.common.suppliers}`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          size="small"
        />
      </div>

      <SupplierFormModal
        open={modalOpen}
        editingSupplier={editingSupplier}
        onCancel={() => {
          setModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
