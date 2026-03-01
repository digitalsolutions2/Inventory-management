"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Tag, Space, Popconfirm, App } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { RoleFormModal } from "@/components/admin/role-form-modal";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  _count: { users: number };
}

export default function RolesPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      const res = await fetch(`/api/roles?${params}`);
      const json = await res.json();
      if (json.success) {
        setRoles(json.data.data);
        setTotal(json.data.total);
      } else {
        message.error(t.admin.roles.failedToLoad);
      }
    } catch {
      message.error(t.admin.roles.failedToLoad);
    }
    setLoading(false);
  }, [page, pageSize, search, message, t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSubmit = async (values: { name: string; description?: string; permissions: string[] }) => {
    setSubmitting(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = editingRole ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingRole ? t.admin.roles.roleUpdated : t.admin.roles.roleCreated);
        setModalOpen(false);
        setEditingRole(null);
        fetchRoles();
      } else {
        message.error(json.error || t.common.failed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      message.success(t.admin.roles.roleDeleted);
      fetchRoles();
    } else {
      message.error(json.error || t.common.failed);
    }
  };

  const columns: ColumnsType<Role> = [
    { title: t.admin.roles.columns.name, dataIndex: "name", width: 180 },
    {
      title: t.admin.roles.columns.description,
      dataIndex: "description",
      ellipsis: true,
      render: (v: string | null) => v || "-",
    },
    {
      title: t.admin.roles.columns.permissions,
      dataIndex: "permissions",
      width: 120,
      align: "center",
      render: (perms: string[]) => (
        <Tag color="blue">{perms?.length || 0}</Tag>
      ),
    },
    {
      title: t.admin.roles.columns.users,
      width: 90,
      align: "center",
      render: (_, record) => (
        <Tag>{record._count.users}</Tag>
      ),
    },
    {
      title: t.admin.roles.columns.actions,
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("users:write") && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRole(record);
                setModalOpen(true);
              }}
            />
          )}
          {hasPermission("users:delete") && (
            <Popconfirm
              title={t.admin.roles.deleteConfirm}
              description={record._count.users > 0 ? t.admin.roles.cannotDeleteWithUsers : undefined}
              onConfirm={() => handleDelete(record.id)}
              okButtonProps={{ disabled: record._count.users > 0 }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record._count.users > 0}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.roles.title}</h1>
        {hasPermission("users:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRole(null);
              setModalOpen(true);
            }}
          >
            {t.admin.roles.addRole}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Input
            placeholder={t.admin.roles.searchPlaceholder}
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
          dataSource={roles}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          size="small"
        />
      </div>

      <RoleFormModal
        open={modalOpen}
        editingRole={
          editingRole
            ? {
                id: editingRole.id,
                name: editingRole.name,
                description: editingRole.description || undefined,
                permissions: editingRole.permissions || [],
              }
            : null
        }
        onCancel={() => {
          setModalOpen(false);
          setEditingRole(null);
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
