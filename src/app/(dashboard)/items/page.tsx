"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Select, Tag, Space, Popconfirm, App } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ItemFormModal } from "@/components/items/item-form-modal";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string } | null;
  uom: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  avgCost: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function ItemsPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(Item & { id: string }) | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(categoryFilter && { categoryId: categoryFilter }),
      status: "active",
    });
    const res = await fetch(`/api/items?${params}`);
    const json = await res.json();
    if (json.success) {
      setItems(json.data.data);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [page, pageSize, search, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    if (json.success) setCategories(json.data);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (values: { code: string; name: string; description?: string; categoryId?: string; uom: string; minStock: number; maxStock: number; reorderPoint: number }) => {
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingItem ? t.items.itemUpdated : t.items.itemCreated);
        setModalOpen(false);
        setEditingItem(null);
        fetchItems();
      } else {
        message.error(json.error || t.common.failed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      message.success(t.items.itemDeactivated);
      fetchItems();
    } else {
      message.error(json.error || t.common.failed);
    }
  };

  const columns: ColumnsType<Item> = [
    { title: t.items.columns.code, dataIndex: "code", width: 120 },
    { title: t.items.columns.name, dataIndex: "name", ellipsis: true },
    {
      title: t.items.columns.category,
      dataIndex: ["category", "name"],
      width: 150,
      render: (val: string) => val || "-",
    },
    { title: t.items.columns.uom, dataIndex: "uom", width: 80 },
    { title: t.items.columns.minStock, dataIndex: "minStock", width: 100, align: "right" },
    { title: t.items.columns.reorderPt, dataIndex: "reorderPoint", width: 100, align: "right" },
    {
      title: t.items.columns.avgCost,
      dataIndex: "avgCost",
      width: 110,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: t.items.columns.status,
      dataIndex: "isActive",
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? t.common.active : t.common.inactive}</Tag>
      ),
    },
    {
      title: t.items.columns.actions,
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("items:write") && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingItem(record);
                setModalOpen(true);
              }}
            />
          )}
          {hasPermission("items:delete") && (
            <Popconfirm
              title={t.items.deactivateConfirm}
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
        <h1 className="text-2xl font-bold text-gray-900">{t.items.title}</h1>
        {hasPermission("items:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            {t.items.addItem}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-3">
          <Input
            placeholder={t.items.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
            allowClear
          />
          <Select
            placeholder={t.items.allCategories}
            value={categoryFilter || undefined}
            onChange={(v) => {
              setCategoryFilter(v || "");
              setPage(1);
            }}
            allowClear
            className="w-48"
          >
            {categories.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t.common.items}`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          size="small"
        />
      </div>

      <ItemFormModal
        open={modalOpen}
        editingItem={editingItem}
        categories={categories}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
