"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Select, Tag, Space, Popconfirm, App } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ItemFormModal } from "@/components/items/item-form-modal";
import { useUserStore } from "@/store/user";
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
        message.success(editingItem ? "Item updated" : "Item created");
        setModalOpen(false);
        setEditingItem(null);
        fetchItems();
      } else {
        message.error(json.error || "Failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      message.success("Item deactivated");
      fetchItems();
    } else {
      message.error(json.error || "Failed");
    }
  };

  const columns: ColumnsType<Item> = [
    { title: "Code", dataIndex: "code", width: 120 },
    { title: "Name", dataIndex: "name", ellipsis: true },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      width: 150,
      render: (val: string) => val || "-",
    },
    { title: "UOM", dataIndex: "uom", width: 80 },
    { title: "Min Stock", dataIndex: "minStock", width: 100, align: "right" },
    { title: "Reorder Pt", dataIndex: "reorderPoint", width: 100, align: "right" },
    {
      title: "Avg Cost",
      dataIndex: "avgCost",
      width: 110,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("item:edit") && (
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
          {hasPermission("item:delete") && (
            <Popconfirm
              title="Deactivate this item?"
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
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        {hasPermission("item:create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            Add Item
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-3">
          <Input
            placeholder="Search items..."
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
            placeholder="All Categories"
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
            showTotal: (t) => `${t} items`,
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
